import http from 'node:http';
import path from 'node:path';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {build} from 'vite';
import {completeLiveResult} from './live-scenario.mjs';
import {root} from '../scripts/context.mjs';
import {npm} from './process.mjs';

export function completeBrowserResult(checks) { return completeLiveResult(checks); }

export async function browserCheck({id,consumer,evidence,env,packageName,packageVersion,runId,profile='vite'}) {
  const evidenceName=`${id}-${profile==='vite'?'browser':profile==='configured'?'browser-configured':'browser-bundle'}`;
  const browserGlobal=id==='bybit'?'bybitapi':id==='binance'?'binanceapi':null;
  let configFile=false;
  if(profile==='configured') {
    await npm(['install','--ignore-scripts','--save-exact','events@3.3.0'],{cwd:consumer,env,log:path.join(evidence,`${evidenceName}-install.log`)});
    await cp(path.join(consumer,'package-lock.json'),path.join(evidence,`${evidenceName}-package-lock.json`));
    configFile=path.join(consumer,'vite.config.mjs');
    await cp(path.join(root,'compatibility/browser-config',`${id}.mjs`),configFile);
  }
  if(profile==='published-bundle') {
    if(!browserGlobal)return {status:'not-run',checks:[],reason:'This package does not publish a standalone browser bundle. Use its browser-aware module entry point.'};
    await mkdir(path.join(consumer,'public'),{recursive:true});
    try {await cp(path.join(consumer,'node_modules',packageName,'dist',browserGlobal+'.js'),path.join(consumer,'public/sdk-bundle.js'));}
    catch(error) {if(error.code==='ENOENT')return {status:'not-run',checks:[],reason:'This npm package does not contain the expected standalone browser bundle.'};throw error;}
  }
  let server,timer;
  try {
    const config={sdk:id,packageName,packageVersion,runId,profile};
    await cp(path.join(root,'compatibility/live-scenario.mjs'),path.join(consumer,'live-scenario.mjs'));
    await writeFile(path.join(consumer,'index.html'),'<!doctype html><html><meta charset="utf-8"><title>SDK browser compatibility</title><style>body{font:16px system-ui;max-width:900px;margin:3rem auto;padding:1rem}pre{white-space:pre-wrap}li{margin:.5rem 0}</style><h1>SDK browser compatibility</h1><p id="identity"></p><p id="status">Running checks…</p><ul id="checks"></ul><pre id="details"></pre><script type="module" src="/browser-entry.mjs"></script></html>');
    await writeFile(path.join(consumer,'browser-entry.mjs'),`
import {liveScenario} from './live-scenario.mjs';
import * as adapter from './adapter.mjs';
const config=${JSON.stringify(config)};
document.getElementById('identity').textContent=config.packageName+'@'+config.packageVersion+' | '+config.profile+' | '+navigator.userAgent;
const render=checks=>{const list=document.getElementById('checks');list.replaceChildren(...checks.map(c=>{const li=document.createElement('li');li.textContent=c.id+': '+c.status;return li;}));};
let checks;
const loadSdk=${profile!=='published-bundle'?`()=>import(${JSON.stringify(packageName)})`:`()=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/sdk-bundle.js';script.onload=()=>resolve(window[${JSON.stringify(browserGlobal)}]);script.onerror=()=>reject(Error('Published browser bundle did not load'));document.head.append(script);})`};
try {checks=await liveScenario({loadSdk,adapter,onCheck:render});}
catch(error){checks=[{id:'execution',status:'failed',detail:String(error.stack||error)}];}
render(checks);
document.getElementById('details').textContent=checks.filter(c=>c.detail).map(c=>c.id+': '+c.detail).join('\\n');
const report={runId:config.runId,packageName:config.packageName,packageVersion:config.packageVersion,profile:config.profile,userAgent:navigator.userAgent,secureContext:isSecureContext,checks};
const response=await fetch('/__result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
document.getElementById('status').textContent=response.ok?'Complete. Results saved to the local POC.':'Result recording failed.';
`);
    const warnings=[];
    try {
      await build({root:consumer,configFile,logLevel:'silent',build:{target:'es2022',outDir:'browser-check-dist',rollupOptions:{onwarn(w){warnings.push(w.message);}}}});
    } catch(error) {
      await writeFile(path.join(evidence,`${evidenceName}-build.log`),String(error.stack||error));
      return {status:'failed',checks:[{id:'bundle',status:'failed'}],reason:'The default Vite browser consumer could not build.',detail:String(error.stack||error)};
    }
    await writeFile(path.join(evidence,`${evidenceName}-build.log`),warnings.join('\n'));
    let resolveResult;
    const result=new Promise(resolve=>{resolveResult=resolve;timer=setTimeout(()=>resolve(null),180000);});
    let received=false;
    server=http.createServer(async(req,res)=>{
      try {
        const url=new URL(req.url,'http://127.0.0.1');
        if(url.pathname==='/__result'&&req.method==='POST') {
          if(req.headers.origin!==`http://${req.headers.host}`) {res.writeHead(403);res.end();return;}
          const chunks=[];let size=0;
          for await(const chunk of req) {size+=chunk.length;if(size>65536)throw Error('Result too large');chunks.push(chunk);}
          const report=JSON.parse(Buffer.concat(chunks));
          if(received||report.runId!==runId||report.packageName!==packageName||report.packageVersion!==packageVersion||report.profile!==profile||!Array.isArray(report.checks))throw Error('Unexpected report identity');
          received=true;res.end('Recorded',()=>resolveResult(report));return;
        }
        const relative=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
        const directory=path.join(consumer,'browser-check-dist');
        const file=path.resolve(directory,relative);
        if(!file.startsWith(directory+path.sep))throw Error('Invalid asset');
        const body=await readFile(file);
        res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream','Cache-Control':'no-store'});res.end(body);
      }catch{res.writeHead(400);res.end('Invalid request');}
    });
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const url=`http://127.0.0.1:${server.address().port}/`;
    await writeFile(path.join(evidence,`${evidenceName}-url.json`),JSON.stringify({url,runId,packageName,packageVersion,profile}));
    console.log(`    Open browser test: ${url}`);
    const report=await result;
    clearTimeout(timer);
    if(!report)return {status:'not-run',checks:[{id:'bundle',status:'passed'}],reason:'The browser test page was not completed before the deadline.'};
    await writeFile(path.join(evidence,`${evidenceName}.json`),JSON.stringify({report,warnings,profile},null,2));
    const passed=completeBrowserResult(report.checks);
    const version=/Chrome\/([\d.]+)/.exec(report.userAgent)?.[1];
    const description=profile==='vite'?'The default Vite consumer':profile==='configured'?'The Vite consumer with an events polyfill'+(id==='binance'?' and the SDK browser-signing alias':''):'The standalone browser bundle shipped in this npm package';
    return {status:passed?'passed':'failed',runtimeVersion:version?`Chromium ${version}`:report.userAgent,checks:[{id:'bundle',status:'passed'},...report.checks],reason:passed?`${description} passed execution checks in the browser shown here, against the live exchange REST and WebSocket APIs.`:`${description} failed browser execution checks. See the observed failures below.`,userAgent:report.userAgent,secureContext:report.secureContext,warnings,profile};
  }finally{
    clearTimeout(timer);
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  }
}
