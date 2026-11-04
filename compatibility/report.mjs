import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {suiteVersion,targets,labels,names} from './config.mjs';
import {root as projectRoot} from '../scripts/context.mjs';
const recordedDate=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
export function matchingReport(report,packageName) {
  return report?.schemaVersion===1 && report.suiteVersion===suiteVersion && report.traffic==='live-mainnet' && report.source==='npm' && report.packageName===packageName
    && typeof report.packageVersion==='string' && /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(report.packageVersion)
    && report.packageAvailable===true && recordedDate(report.checkedAt) && report.targets!==null && typeof report.targets==='object' && !Array.isArray(report.targets);
}
export function displayedTarget(report,target,name) {
  const unavailable={status:'not-run',checks:[],reason:'No recorded live exchange result is available.'};
  if(!matchingReport(report,name))return unavailable;
  const result=report.targets[target];
  if(!result || !['passed','failed','build-only','not-run'].includes(result.status) || !Array.isArray(result.checks)
    || result.checks.some(check=>!check || typeof check.id!=='string' || !['passed','failed','not-run'].includes(check.status))
    || (result.checkedAt!==undefined && !recordedDate(result.checkedAt)))return unavailable;
  return result;
}
const sharedInclude=name=>`<!--@include: @/.vitepress/shared/compatibility/${name}.md-->`;
// Edit common scope and version guidance in shared/content/compatibility/.
// Keep result selection, runtime evidence and generated setup recipes here.
const statusLabel={passed:'Live checks passed',failed:'Checks failed','build-only':'Build only','not-run':'Not verified'};
const safe=value=>String(value??'').replaceAll('|','\\|').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\n',' ');
const detail=value=>safe(String(value||'').split('\n')[0].replace(/\/(Users|Volumes)\/[^\s:]*/g,'[consumer]'));
export async function generateCompatibility(ctx,root) {
  let report;
  try{report=JSON.parse(await readFile(path.join(root,'compatibility/results',ctx.id+'.json')));}catch(error){if(error.code!=='ENOENT' && !(error instanceof SyntaxError))throw error;}
  const hasReport=matchingReport(report,ctx.pkg.name);
  const version=hasReport?report.packageVersion:undefined;
  const visible=targets.filter(t=>t.endsWith('-configured')&&t.startsWith('react-native')?ctx.id!=='hyperliquid':t==='vite'?displayedTarget(report,t,ctx.pkg.name).status!=='not-run':t==='browser-configured'?ctx.id!=='hyperliquid':t==='browser-bundle'?displayedTarget(report,t,ctx.pkg.name).status!=='not-run':true);
  const setupTarget=['react-native-configured','react-native-ios-configured'].find(t=>{const c=displayedTarget(report,t,ctx.pkg.name);return c.status==='passed'&&c.consumerDependencies;});
  const lines=['---',`title: "${ctx.sdk.name} SDK runtime compatibility"`,`description: "Live exchange REST and WebSocket checks for ${ctx.sdk.name} across JavaScript runtimes."`,'---','','# Runtime compatibility','',
    `Setup and recorded public REST and WebSocket checks for the ${ctx.sdk.name} SDK. Install commands use the latest SDK release; test results identify the version checked.`, '',
    '| Environment | Tested version | Result |','| --- | --- | --- |',...visible.map(t=>{const c=displayedTarget(report,t,ctx.pkg.name);return `| [${labels[t]}](#${t}) | ${safe(c.runtimeVersion||'Not checked')} | ${statusLabel[c.status]||'Not verified'} |`;}),''];
  if(hasReport)lines.push(`Tested SDK: \`${ctx.pkg.name}@${version}\`. Last run: **${report.checkedAt.slice(0,10)}** on **${safe(report.platform)}**. Each environment lists its check date.`,'',
    sharedInclude('tested-version'),'');
  else lines.push('No recorded live exchange results are available for this SDK.','');
  for(const t of visible){
    const c=displayedTarget(report,t,ctx.pkg.name);
    lines.push(`## ${labels[t]} {#${t}}`,'',`**${statusLabel[c.status]||'Not verified'}.** ${safe(c.reason)}`,'');
    if(c.checkedAt)lines.push(`Checked ${c.checkedAt.slice(0,10)}.`,'');
    if(c.checks?.length)lines.push('| Check | Result |','| --- | --- |',...c.checks.map(ch=>`| ${safe(names[ch.id]||ch.id)} | ${ch.status==='passed'?'Passed':ch.status==='failed'?'Failed':'Not run'} |`),'');
    for(const ch of c.checks||[]){
      if(ch.status==='failed'&&ch.detail)lines.push(`**${safe(names[ch.id]||ch.id)}:** ${detail(ch.detail)}`,'');
      if(ch.price)lines.push(`Observed BTC price: **${safe(ch.price)}**, received ${safe(ch.observedAt)} from ${safe(ch.endpoint)}.`,'');
    }
    if(c.observation)lines.push(`The server route received BTC price **${safe(c.observation.price)}** at ${safe(c.observation.observedAt)}.`,'');
    if(t==='browser-configured'&&c.status==='passed'){
      const recipe=await readFile(path.join(projectRoot,'compatibility/browser-config',ctx.id+'.mjs'),'utf8');
      lines.push('### Vite configuration','','Install the SDK and EventEmitter polyfill:','','```sh',`npm install ${ctx.pkg.name} events@3.3.0`,'```','','Save this as `vite.config.mjs` at the application root:','','```js',recipe.trim(),'```','','This supplies EventEmitter'+(ctx.id==='binance'?" and selects Binance's browser signing module":'')+'. Tested with Vite 5.4.21 and an npm installation.','');
    }
    if(t==='vite')lines.push('Bundling only; see the browser results for runtime checks.','');
    if(t===setupTarget) {
      const recipe=await readFile(path.join(projectRoot,'compatibility/native-config/metro.cjs'),'utf8');
      const deps=c.consumerDependencies;
      lines.push('### Expo and Metro setup','','Install the latest SDK and the required polyfills:','','```sh',`npm install ${ctx.pkg.name} ${Object.entries(deps).map(([name,v])=>`${name}@${v}`).join(' ')}`,'```','',
        'Save this helper as `siebly-sdk.metro.cjs` at your application root:','','```js',recipe.trim(),'```','',
        'Apply it in `metro.config.cjs`:','','```js',"const {getDefaultConfig} = require('expo/metro-config');", "const configureSdkMetro = require('./siebly-sdk.metro.cjs');",'module.exports = configureSdkMetro(getDefaultConfig(__dirname), __dirname);','```','',
        'Restart Expo with `npx expo start --clear`. SDK imports and client initialization need no changes.','',
        'The HTTPS adapter uses React Native’s HTTP transport. `events` supplies EventEmitter; `buffer` supports the adapter’s stream dependency. The Binance rule selects the package’s browser implementation.','',
        'Tested in Expo Go with an npm `node_modules` layout.','',
        '[Metro resolver documentation](https://metrobundler.dev/docs/configuration/#resolverequest)','');
    }
    if(t==='react-native'&&c.status==='failed')lines.push('This is the default configuration. See [Android with polyfills](#react-native-configured) for the consumer setup and its live results.','');
    if(t==='react-native-ios'&&c.status==='failed')lines.push('See [iOS with polyfills](#react-native-ios-configured) for the configured consumer setup and results.','');
    if(t==='react-native-ios-configured'&&setupTarget&&t!==setupTarget)lines.push('Use the shared [Expo and Metro setup](#expo-and-metro-setup) above. The same helper is used for the iOS checks.','');
    if(t==='next')lines.push('Checked in a Node.js Route Handler. Client Components and Edge execution are untested.','');
  }
  lines.push(sharedInclude('live-check-scope'),'',sharedInclude('browser-scope'),'',sharedInclude('android-scope'),'',sharedInclude('ios-scope'),'',
    ...(hasReport&&version!==ctx.pkg.version?[`Test metadata: SDK ${version}; API reference source ${ctx.pkg.version}.`,'']:[]),
    '[Quickstart](/getting-started) · [Production usage](/guides/production) · [Troubleshooting](/guides/troubleshooting)','');
  await writeFile(path.join(ctx.docs,'compatibility.md'),lines.join('\n'));
}
