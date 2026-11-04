import { writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import assert from 'node:assert/strict';
import { build as viteBuild } from 'vite';
import { frameworkVersions } from './config.mjs';
import { run, npm } from './process.mjs';

export async function frameworkCheck(target, { id, consumer, evidence, env, packageName }) {
  if (target === 'vite') {
    await writeFile(path.join(consumer,'index.html'), '<!doctype html><html><head><title>SDK live compatibility</title></head><body><pre id="result">Loading</pre><script type="module" src="/browser.js"></script></body></html>');
    await writeFile(path.join(consumer,'browser.js'), `import * as sdk from ${JSON.stringify(packageName)};\nimport * as adapter from './adapter.mjs';\ndocument.getElementById('result').textContent = typeof adapter.client(sdk).constructor;\n`);
    const warnings = [];
    try {
      await viteBuild({ root:consumer, configFile:false, logLevel:'silent', build:{ outDir:'browser-dist', rollupOptions:{ onwarn(warning) { warnings.push(warning.message); } } } });
      await writeFile(path.join(evidence,`${id}-vite.log`),warnings.join('\n'));
      const externalized = [...new Set(warnings.flatMap(warning=>[...warning.matchAll(/Module "([^"]+)" has been externalized/g)].map(match=>match[1])))];
      return { status:'build-only', runtimeVersion:`Vite ${frameworkVersions.vite}`, checks:[{id:'bundle',status:'passed'}], reason:externalized.length ? `A bundle was emitted with Node built-ins externalized: ${externalized.join(', ')}. Browser execution is not verified; these imports need investigation.` : 'Production bundling passed. Execution in a browser, CORS and signing are not verified.', warnings };
    } catch (error) {
      await writeFile(path.join(evidence,`${id}-vite.log`),String(error.stack || error));
      return { status:'failed', runtimeVersion:`Vite ${frameworkVersions.vite}`, checks:[{id:'bundle',status:'failed'}], reason:'The standard Vite consumer could not bundle this package.', detail:String(error.stack || error) };
    }
  }
  await npm(['install','--ignore-scripts','--save-exact',`next@${frameworkVersions.next}`,`react@${frameworkVersions.react}`,`react-dom@${frameworkVersions.react}`], { cwd:consumer,env,timeout:180000,log:path.join(evidence,`${id}-next-install.log`) });
  await cp(path.join(consumer,'package-lock.json'),path.join(evidence,`${id}-next-package-lock.json`));
  await rm(env.npm_config_cache,{recursive:true,force:true});
  // The TypeScript consumer was checked separately. This JavaScript consumer
  // should not make Next install a second compiler and additional type packages.
  await rm(path.join(consumer,'tsconfig.json'),{force:true});
  await rm(path.join(consumer,'types.ts'),{force:true});
  await mkdir(path.join(consumer,'app/api/check'),{recursive:true});
  await writeFile(path.join(consumer,'next.config.mjs'), 'export default { experimental: { cpus: 1 } };\n');
  await writeFile(path.join(consumer,'app/layout.js'), 'export default function Layout({children}) { return <html><body>{children}</body></html>; }\n');
  await writeFile(path.join(consumer,'app/page.js'), 'export default function Page() { return <h1>SDK live compatibility</h1>; }\n');
  await writeFile(path.join(consumer,'app/api/check/route.js'), `import * as sdk from ${JSON.stringify(packageName)};\nimport * as adapter from '../../../adapter.mjs';\nexport const runtime = 'nodejs';\nexport const dynamic = 'force-dynamic';\nexport async function GET() { return Response.json({price:await adapter.read(adapter.client(sdk))}); }\n`);
  const cli = path.join(consumer,'node_modules/next/dist/bin/next');
  const built = await run(process.execPath,[cli,'build','--webpack'],{cwd:consumer,env,timeout:180000,log:path.join(evidence,`${id}-next-build.log`)});
  const result = { status:'failed', runtimeVersion:`Next.js ${frameworkVersions.next} / Node ${process.version}`, checks:[{id:'bundle',status:built.code===0?'passed':'failed'}], reason:'The Next.js server check did not complete.' };
  if (built.code !== 0) { result.detail=built.output.slice(-3000); return result; }
  const probe=net.createServer();
  await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  const child=spawn(process.execPath,[cli,'start','--hostname','127.0.0.1','--port',String(port)],{cwd:consumer,env:{...process.env,...env},stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'});
  const chunks=[];
  let startupError;
  child.once('error',error=>{startupError=error;});
  child.stdout.on('data',d=>chunks.push(d)); child.stderr.on('data',d=>chunks.push(d));
  const closed = new Promise(resolve=>child.once('close',resolve));
  try {
    const deadline=Date.now()+30000;
    let response;
    while(Date.now()<deadline) {
      if(startupError) throw startupError;
      if(child.exitCode!==null) throw new Error('Next.js exited before the route check.');
      try { response=await fetch(`http://127.0.0.1:${port}/api/check`,{signal:AbortSignal.timeout(20000)}); break; } catch {}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert(response?.ok,'Next.js route did not return HTTP 200.');
    const data=await response.json();
    assert(Number.isFinite(Number(data.price)) && Number(data.price)>0,'Live exchange price missing');
    result.observation={price:String(data.price),observedAt:new Date().toISOString()};
    result.checks.push({id:'route',status:'passed'});
    result.status='passed';
    result.reason='Production build and live exchange REST execution in a Node.js Route Handler passed. Client Components and the Edge runtime are not covered.';
  } catch(error) { result.checks.push({id:'route',status:'failed'});result.detail=String(error.stack||error); }
  finally {
    try { process.platform==='win32'?child.kill('SIGKILL'):process.kill(-child.pid,'SIGKILL'); } catch {}
    await closed;
    await writeFile(path.join(evidence,`${id}-next-server.log`),Buffer.concat(chunks));
  }
  return result;
}
