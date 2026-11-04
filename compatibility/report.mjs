import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {suiteVersion,targets,labels,names} from './config.mjs';
import {root as projectRoot} from '../scripts/context.mjs';
export function matchingReport(report,packageName,packageVersion) {
  return report?.schemaVersion===1 && report.suiteVersion===suiteVersion && report.traffic==='live-mainnet' && report.source==='npm' && report.packageName===packageName && report.packageVersion===packageVersion;
}
export function displayedTarget(report,target,name,version) {
  if(!matchingReport(report,name,version)||!report.packageAvailable)return {status:'not-run',checks:[],reason:'No live exchange result for this package version.'};
  return report.targets[target]||{status:'not-run',checks:[],reason:'This environment has not been checked against the live exchange.'};
}
export function resultVersionForPage(report,name,version) {
  return report?.selection?.kind==='explicit' && report.selection.documentationVersion===version && matchingReport(report,name,report.packageVersion)?report.packageVersion:version;
}
const sharedInclude=name=>`<!--@include: @/.vitepress/shared/compatibility/${name}.md-->`;
// Edit common scope and version guidance in shared/content/compatibility/.
// Keep result selection, runtime evidence and generated setup recipes here.
const statusLabel={passed:'Live checks passed',failed:'Checks failed','build-only':'Build only','not-run':'Not verified'};
const safe=value=>String(value??'').replaceAll('|','\\|').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\n',' ');
const detail=value=>safe(String(value||'').split('\n')[0].replace(/\/(Users|Volumes)\/[^\s:]*/g,'[consumer]'));
export async function generateCompatibility(ctx,root) {
  let report;
  try{report=JSON.parse(await readFile(path.join(root,'compatibility/results',ctx.id+'.json')));}catch(error){if(error.code!=='ENOENT')throw error;}
  const version=resultVersionForPage(report,ctx.pkg.name,ctx.pkg.version);
  const current=matchingReport(report,ctx.pkg.name,version);
  const visible=targets.filter(t=>t.endsWith('-configured')&&t.startsWith('react-native')?ctx.id!=='hyperliquid':t==='vite'?displayedTarget(report,t,ctx.pkg.name,version).status!=='not-run':t==='browser-configured'?ctx.id!=='hyperliquid':t==='browser-bundle'?displayedTarget(report,t,ctx.pkg.name,version).status!=='not-run':true);
  const lines=['---',`title: "${ctx.sdk.name} SDK runtime compatibility"`,`description: "Live exchange REST and WebSocket checks for ${ctx.sdk.name} across JavaScript runtimes."`,'---','','# Runtime compatibility','',
    `Set up the ${ctx.sdk.name} SDK for Node.js, Bun, Deno, browsers and React Native. The setup instructions use the latest SDK release. The checks below exercise public REST requests and WebSocket subscriptions against the exchange.`, '',
    '| Environment | Tested version | Result |','| --- | --- | --- |',...visible.map(t=>{const c=displayedTarget(report,t,ctx.pkg.name,version);return `| [${labels[t]}](#${t}) | ${safe(c.runtimeVersion||'Not checked')} | ${statusLabel[c.status]||'Not verified'} |`;}),''];
  if(current)lines.push(`Tested SDK: \`${ctx.pkg.name}@${version}\`. Last run: **${report.checkedAt.slice(0,10)}** on **${safe(report.platform)}**. Each environment lists its check date.`,'',
    sharedInclude('tested-version'),'');
  else lines.push('No matching live exchange results are available. Only recorded live exchange results are shown.','');
  for(const t of visible){
    const c=displayedTarget(report,t,ctx.pkg.name,version);
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
      lines.push('### Vite configuration','','Install the latest SDK and the EventEmitter polyfill:','','```sh',`npm install ${ctx.pkg.name} events@3.3.0`,'```','','Save this as `vite.config.mjs` at your application root. The check runner uses this same configuration file.','','```js',recipe.trim(),'```','','The configuration supplies EventEmitter'+(ctx.id==='binance'?" and selects the Binance package's browser signing module":'')+'. It was checked with Vite 5.4.21 and a conventional npm installation.','');
    }
    if(t==='vite')lines.push('This row covers bundling only. Browser rows require real exchange REST responses and a live market-data WebSocket update.','');
    if(t.startsWith('browser'))lines.push(sharedInclude('browser-scope'),'');
    if(t==='react-native-configured'&&c.status==='passed') {
      const recipe=await readFile(path.join(projectRoot,'compatibility/native-config/metro.cjs'),'utf8');
      const deps=c.consumerDependencies;
      lines.push('### Expo and Metro setup','','Install the latest SDK and the required polyfills:','','```sh',`npm install ${ctx.pkg.name} ${Object.entries(deps).map(([name,v])=>`${name}@${v}`).join(' ')}`,'```','',
        'Save this helper as `siebly-sdk.metro.cjs` at your application root:','','```js',recipe.trim(),'```','',
        'Apply it in `metro.config.cjs`:','','```js',"const {getDefaultConfig} = require('expo/metro-config');", "const configureSdkMetro = require('./siebly-sdk.metro.cjs');",'module.exports = configureSdkMetro(getDefaultConfig(__dirname), __dirname);','```','',
        'Restart Expo with `npx expo start --clear` after changing Metro configuration. Your SDK imports and client initialization stay the same. No additional app bootstrap or global polyfill assignment was needed in the tested app.','',
        'The HTTPS adapter is a functional polyfill. The SDK’s live REST requests use React Native’s HTTP transport. `events` supplies EventEmitter, and `buffer` supports the adapter’s stream dependency. The scoped Binance rule selects the browser implementation already shipped in the SDK package; it does not edit SDK files.','',
        'This setup was tested in Expo Go with a conventional npm `node_modules` layout. Authenticated operations and signing remain unverified.','',
        '[Metro resolver documentation](https://metrobundler.dev/docs/configuration/#resolverequest)','');
    }
    if(t==='react-native'&&c.status==='failed')lines.push('This is the default configuration. See [Android with polyfills](#react-native-configured) for the consumer setup and its live results.','');
    if(t==='react-native-ios'&&c.status==='failed')lines.push('See [iOS with polyfills](#react-native-ios-configured) for the configured Metro build result.','');
    if(t==='next')lines.push('The production Next.js server calls the actual exchange from a Node.js Route Handler. Client Components and Edge execution are not covered.','');
    if(t==='react-native'||t==='react-native-configured')lines.push(sharedInclude('android-scope'),'');
    if(t==='react-native-ios'||t==='react-native-ios-configured')lines.push('iOS bundling is checked separately. No iOS simulator or device execution has been performed.','');
  }
  lines.push(sharedInclude('live-check-scope'),'',
    ...(current&&version!==ctx.pkg.version?[`Test metadata: SDK ${version}; API reference source ${ctx.pkg.version}.`,'']:[]),
    '[Quickstart](/getting-started) · [Production usage](/guides/production) · [Troubleshooting](/guides/troubleshooting)','');
  await writeFile(path.join(ctx.docs,'compatibility.md'),lines.join('\n'));
}
