import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {readFile,writeFile,cp,mkdir,access,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {root} from '../scripts/context.mjs';
import {nativeVersions} from './config.mjs';
import {nativeMetroConfig} from './native-config/recipe.mjs';
import {npm,run} from './process.mjs';
import {completeLiveResult} from './live-scenario.mjs';

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function port() {const server=net.createServer();await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});const p=server.address().port;await new Promise(ok=>server.close(ok));return p;}
function summary(output) {
  const plain=output.replace(/\u001b\[[0-9;]*m/g,'');
  const missing=/Unable to resolve module ([^\s]+)|Unable to resolve ["']([^"']+)["']/.exec(plain);
  return missing?`Metro could not resolve the module ${missing[1]||missing[2]}.`:plain.split('\n').find(line=>/Error:|error:/.test(line))?.replace(/\/Users\/[^\s:]*/g,'[consumer]')||'The Metro bundle did not complete.';
}

export function completeNativeResult(report,platform='android') {
  return ['android','ios'].includes(platform) && report?.platform===platform && report.hermes===true && completeLiveResult(report.checks,'native-import');
}

export function matchingNativeReport(report,{runId,packageName,packageVersion,platform,profile}) {
  return report?.runId===runId && report.packageName===packageName && report.packageVersion===packageVersion
    && report.platform===platform && report.profile===profile && Array.isArray(report.checks);
}

export async function nativeCheck({id,consumer,evidence,env,packageName,packageVersion,runId,platform,profile='default'}) {
  const runtimeTimeout=Number(process.env.COMPAT_NATIVE_TIMEOUT_MS||300000);
  if(!Number.isSafeInteger(runtimeTimeout)||runtimeTimeout<1000||runtimeTimeout>900000)throw Error('COMPAT_NATIVE_TIMEOUT_MS must be between 1000 and 900000 milliseconds.');
  const evidenceId=id+(profile==='configured'?'-configured':'')+'-'+platform;
  const result={profile,runId,evidenceDirectory:path.relative(root,evidence),status:'not-run',runtimeVersion:`React Native ${nativeVersions.reactNative} / Expo ${nativeVersions.expo}`,checks:[],reason:''};
  const installed=JSON.parse(await readFile(path.join(consumer,'package.json')));
  if(installed.dependencies?.expo!==nativeVersions.expo)await npm(['install','--ignore-scripts','--save-exact',`expo@${nativeVersions.expo}`,`react@${nativeVersions.react}`,`react-native@${nativeVersions.reactNative}`],{cwd:consumer,env,timeout:180000,log:path.join(evidence,`${evidenceId}-native-install.log`)});
  if(profile==='configured') {
    const dependencies=JSON.parse(await readFile(path.join(root,'compatibility/native-config/dependencies.json')));
    await npm(['install','--ignore-scripts','--save-exact',...Object.entries(dependencies).map(([name,version])=>`${name}@${version}`)],{cwd:consumer,env,timeout:120000,log:path.join(evidence,`${evidenceId}-polyfills-install.log`)});
    await writeFile(path.join(consumer,'siebly-sdk.metro.cjs'),await nativeMetroConfig(id));
    if(id==='coinbase') await writeFile(path.join(consumer,'coinbase-public-auth.cjs'),await readFile(path.join(root,'compatibility/native-config/coinbase-public-auth.cjs')));
    result.consumerDependencies=dependencies;
  }
  const pkg=JSON.parse(await readFile(path.join(consumer,'package.json')));pkg.main='index.js';
  // The shared TypeScript consumer was already checked. This Expo consumer is JS.
  await Promise.all(['types.ts','tsconfig.json'].map(file=>rm(path.join(consumer,file),{force:true})));
  await Promise.all(['.metro-cache','.metro-file-map'].map(dir=>mkdir(path.join(consumer,dir),{recursive:true})));
  await writeFile(path.join(consumer,'package.json'),JSON.stringify(pkg,null,2));
  await cp(path.join(consumer,'package-lock.json'),path.join(evidence,`${evidenceId}-native-package-lock.json`));
  await rm(env.npm_config_cache,{recursive:true,force:true});
  await writeFile(path.join(consumer,'app.json'),JSON.stringify({expo:{name:`Siebly ${id} compatibility`,slug:`siebly-${id}-compat`,version:'1.0.0',platforms:['android','ios']}}));
  await writeFile(path.join(consumer,'metro.config.cjs'),`const {getDefaultConfig}=require('expo/metro-config');
const {FileStore}=require('metro-cache');
const path=require('node:path');
const config=getDefaultConfig(__dirname);
config.maxWorkers=1;config.resolver.useWatchman=false;
config.cacheStores=[new FileStore({root:path.join(__dirname,'.metro-cache')})];
config.fileMapCacheDirectory=path.join(__dirname,'.metro-file-map');
module.exports=${profile==='configured'?"require('./siebly-sdk.metro.cjs')(config,__dirname)":'config'};
`);
  await writeFile(path.join(consumer,'index.js'),"import {registerRootComponent} from 'expo';\nimport App from './App';\nregisterRootComponent(App);\n");
  await cp(path.join(root,'compatibility/live-scenario.mjs'),path.join(consumer,'client-scenario.mjs'));
  let collector,metro,timer;
  const log=[];
  try {
    const config={sdk:id,packageName,packageVersion,runId,profile};
    let resolveResult;const received=new Promise(resolve=>{resolveResult=resolve;});
    collector=http.createServer(async(req,res)=>{
      try {const chunks=[];let bytes=0;for await(const c of req){bytes+=c.length;if(bytes>65536)throw Error('Oversized report');chunks.push(c);}
        const report=JSON.parse(Buffer.concat(chunks));
        if(!matchingNativeReport(report,{runId,packageName,packageVersion,platform,profile}))throw Error('Unexpected native report');
        res.end('Recorded',()=>resolveResult(report));
      }catch{res.writeHead(400);res.end();}
    });
    await new Promise((ok,no)=>{collector.once('error',no);collector.listen(0,'127.0.0.1',ok);});
    const host=platform==='ios'?'127.0.0.1':'10.0.2.2';
    const collectorUrl=`http://${host}:${collector.address().port}/`;
    await writeFile(path.join(consumer,'App.js'),`
import React,{useEffect,useState,useRef} from 'react';
import {ScrollView,Text,Platform} from 'react-native';
import {liveScenario} from './client-scenario.mjs';
import * as adapter from './adapter.mjs';
const config=${JSON.stringify(config)};
export default function App(){
 const [checks,setChecks]=useState([]),[status,setStatus]=useState('Running checks'),started=useRef(false);
 useEffect(()=>{if(started.current)return;started.current=true;(async()=>{
  let result;
  try {result=await liveScenario({loadSdk:async()=>require(${JSON.stringify(packageName)}),adapter,importCheck:'native-import',onCheck:value=>setChecks([...value])});}
  catch(error){result=[{id:'native-execution',status:'failed',detail:String(error.stack||error)}];}
  const hermes=!!global.HermesInternal;
  const report={runId:config.runId,packageName:config.packageName,packageVersion:config.packageVersion,profile:config.profile,platform:Platform.OS,osVersion:Platform.Version,hermes,checks:result};
  setChecks(result);
  try{const response=await fetch(${JSON.stringify(collectorUrl)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});setStatus(response.ok?'Complete. Results saved.':'Result recording failed');}catch(error){setStatus(String(error));}
 })();},[]);
 return <ScrollView contentContainerStyle={{padding:24,paddingTop:54,backgroundColor:'#101010',minHeight:'100%'}}><Text style={{fontSize:24,color:'white',marginBottom:16}}>Siebly SDK compatibility</Text><Text style={{color:'white'}}>{config.packageName+'@'+config.packageVersion}</Text><Text style={{color:'white'}}>{Platform.OS+' '+Platform.Version+' | Hermes '+!!global.HermesInternal}</Text><Text style={{color:'#6ce7ff',marginVertical:16}}>{status}</Text>{checks.map(c=><Text key={c.id} style={{color:c.status==='passed'?'#8feaaf':'#ffa6a6',marginVertical:5}}>{c.id+': '+c.status+(c.detail?'\\n'+c.detail:'')}</Text>)}</ScrollView>;
}
`);
    const cli=createRequire(path.join(consumer,'package.json')).resolve('expo/bin/cli');
    const nativeEnv={...env,CI:'1',EXPO_NO_TELEMETRY:'1',EXPO_NO_DOTENV:'1',EXPO_NO_GIT_STATUS:'1',TMPDIR:path.join(consumer,'.tmp'),__UNSAFE_EXPO_HOME_DIRECTORY:path.join(consumer,'.expo-home')};
    await Promise.all([nativeEnv.__UNSAFE_EXPO_HOME_DIRECTORY,nativeEnv.TMPDIR].map(directory=>mkdir(directory,{recursive:true})));
    const bundle=await run(process.execPath,[cli,'export','--platform',platform,'--output-dir',`native-dist-${platform}`],{cwd:consumer,env:nativeEnv,timeout:180000,log:path.join(evidence,`${evidenceId}-native-${platform}-bundle.log`)});
    result.checks.push({id:`native-bundle-${platform}`,status:bundle.code===0?'passed':'failed'});
    result.evidence=path.relative(root,path.join(evidence,`${evidenceId}-native-${platform}-bundle.log`));
    if(bundle.code!==0){result.status='failed';result.reason=`The ${profile==='configured'?'configured':'standard'} Expo consumer failed its ${platform} Metro build. ${summary(bundle.output)}`;result.detail=bundle.output.slice(-6000);return result;}
    let installation,simulator;
    const adbArgs=['-s','emulator-5556'];
    if(platform==='ios') {
      const devices=await run('xcrun',['simctl','list','devices','booted','-j'],{cwd:consumer,timeout:10000});
      if(devices.code!==0)return {...result,status:'build-only',reason:'iOS bundling passed, but the simulator could not be inspected.'};
      const booted=Object.entries(JSON.parse(devices.stdout).devices).flatMap(([runtime,items])=>items.map(device=>({...device,runtime})));
      simulator=process.env.COMPAT_IOS_UDID?booted.find(device=>device.udid===process.env.COMPAT_IOS_UDID):booted.length===1?booted[0]:null;
      if(!simulator)return {...result,status:'build-only',reason:'iOS bundling passed. Boot one iOS simulator or set COMPAT_IOS_UDID to a booted device.'};
      const app=await run('xcrun',['simctl','get_app_container',simulator.udid,'host.exp.Exponent','app'],{cwd:consumer,timeout:10000});
      if(app.code!==0)return {...result,status:'build-only',reason:'iOS bundling passed. Install the matching Expo Go simulator app before running execution checks.'};
      const version=await run('plutil',['-extract','CFBundleShortVersionString','raw','-o','-',path.join(app.stdout.trim(),'Info.plist')],{cwd:consumer,timeout:10000});
      result.expoGoVersion=version.code===0?version.stdout.trim():'unknown';
      result.simulator={udid:simulator.udid,name:simulator.name,runtime:simulator.runtime};
      await writeFile(path.join(evidence,`${evidenceId}-simulator.json`),JSON.stringify(result.simulator,null,2));
    } else {
      try{installation=JSON.parse(await readFile(path.join(process.env.COMPAT_WORK_ROOT,'android/installation.json')));}catch{return {...result,reason:'Android bundling passed, but the emulator installation is not ready.'};}
      const app=await run(installation.adb,[...adbArgs,'shell','pm','path','host.exp.exponent'],{cwd:consumer,env:installation.env,timeout:10000});
      if(app.code!==0||!app.stdout.includes('package:'))return {...result,reason:'Android bundling passed. Start the POC emulator and install Expo Go before running native execution checks.'};
      const appVersion=await run(installation.adb,[...adbArgs,'shell','dumpsys','package','host.exp.exponent'],{cwd:consumer,env:installation.env,timeout:10000});
      result.expoGoVersion=/versionName=([^\s]+)/.exec(appVersion.stdout)?.[1]||'unknown';
    }
    result.executionMode='Expo Go / development server';
    const metroPort=await port();
    metro=spawn(process.execPath,[cli,'start','--localhost','--port',String(metroPort)],{cwd:consumer,env:{...process.env,...nativeEnv},stdio:['ignore','pipe','pipe'],detached:true});
    let startupError;
    metro.once('error',error=>{startupError=error;});metro.stdout.on('data',d=>log.push(d));metro.stderr.on('data',d=>log.push(d));
    const deadline=Date.now()+60000;let ready=false;
    while(Date.now()<deadline){if(startupError)throw startupError;if(metro.exitCode!==null)break;try{const r=await fetch(`http://127.0.0.1:${metroPort}/status`,{signal:AbortSignal.timeout(1000)});if((await r.text()).includes('packager-status:running')){ready=true;break;}}catch{}await pause(250);}
    if(!ready)throw Error('Expo Metro server did not become ready');
    const launchUrl=`exp://${host}:${metroPort}`;
    if(platform==='ios')await run('xcrun',['simctl','terminate',simulator.udid,'host.exp.Exponent'],{cwd:consumer,timeout:10000});
    const launch=platform==='ios'
      ?await run('xcrun',['simctl','openurl',simulator.udid,launchUrl],{cwd:consumer,timeout:15000,log:path.join(evidence,`${evidenceId}-native-launch.log`)})
      :await run(installation.adb,[...adbArgs,'shell','am','start','-a','android.intent.action.VIEW','-d',launchUrl,'host.exp.exponent'],{cwd:consumer,env:installation.env,timeout:10000,log:path.join(evidence,`${evidenceId}-native-launch.log`)});
    if(launch.code!==0)throw Error('Expo Go could not be opened');
    console.log(`    Native app running: ${launchUrl}`);
    const stopped=new Promise(resolve=>metro.once('exit',()=>resolve(null)));
    const report=await Promise.race([received,stopped,new Promise(resolve=>{timer=setTimeout(()=>resolve(null),runtimeTimeout);})]);
    await writeFile(path.join(evidence,`${evidenceId}-native-metro.log`),Buffer.concat(log));
    if(platform==='ios') {
      await pause(500);
      const screenshot=path.join(evidence,`${evidenceId}-screen.png`);
      const captured=await run('xcrun',['simctl','io',simulator.udid,'screenshot',screenshot],{cwd:consumer,timeout:10000});
      if(captured.code===0)result.screenshot=path.relative(root,screenshot);
    }
    if(!report)return {...result,reason:`The ${platform==='ios'?'iOS':'Android'} app did not return a complete result before the deadline.`};
    await writeFile(path.join(evidence,`${evidenceId}-native.json`),JSON.stringify({report},null,2));
    result.evidence=path.relative(root,path.join(evidence,`${evidenceId}-native.json`));
    const passed=completeNativeResult(report,platform);
    result.checks.push(...report.checks);result.status=passed?'passed':'failed';
    result.runtimeVersion+=` / ${platform==='ios'?'iOS':'Android API'} ${report.osVersion} / ${report.hermes?'Hermes':'unknown JS engine'}`;
    result.reason=passed?`The SDK passed live exchange REST and WebSocket checks in Expo Go on the ${platform==='ios'?'iOS simulator':'Android emulator'}. Physical devices, background suspension and custom native development builds are not covered.`:`The SDK failed ${platform==='ios'?'iOS':'Android'} execution checks in Expo Go. See the observed failures below.`;
    return result;
  }finally {
    clearTimeout(timer);
    if(log.length)await writeFile(path.join(evidence,`${evidenceId}-native-metro.log`),Buffer.concat(log));
    if(metro)try{process.kill(-metro.pid,'SIGKILL');}catch{}
    if(collector){collector.closeAllConnections();await new Promise(resolve=>collector.close(resolve));}
  }
}
