import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/context.mjs';
import { displayedTarget, resultVersionForPage, generateCompatibility } from './report.mjs';
import { suiteVersion, completeRuntimeResult, runtimeChecks } from './config.mjs';
import {completeBrowserResult} from './browser.mjs';
import {completeNativeResult} from './native.mjs';
const report={schemaVersion:1,suiteVersion,traffic:'live-mainnet',source:'npm',packageName:'example',packageVersion:'1.0.0',packageAvailable:true,targets:{bun:{status:'failed',checks:[]},node:{status:'passed',checks:[]}}};
test('results for another release cannot become a current green badge',()=>assert.equal(displayedTarget(report,'node','example','1.0.1').status,'not-run'));
test('an explicit comparison retains its tested version without certifying the docs version',()=>{
  const comparison={...report,selection:{kind:'explicit',requestedVersion:'latest',documentationVersion:'1.0.1'}};
  assert.equal(resultVersionForPage(comparison,'example','1.0.1'),'1.0.0');
  assert.equal(displayedTarget(comparison,'node','example','1.0.1').status,'not-run');
  assert.equal(resultVersionForPage(comparison,'example','1.0.2'),'1.0.2');
  assert.equal(resultVersionForPage(report,'example','1.0.1'),'1.0.1');
  assert.equal(resultVersionForPage({...comparison,source:'local'},'example','1.0.1'),'1.0.1');
});
test('generated comparison labels both versions without certifying another release',async()=>{
  await mkdir(path.join(root,'tmp'),{recursive:true});
  const work=await mkdtemp(path.join(root,'tmp/report-test-'));
  try {
    await mkdir(path.join(work,'compatibility/results'),{recursive:true});
    const comparison={...report,checkedAt:'2026-11-04T00:00:00Z',platform:'test',selection:{kind:'explicit',requestedVersion:'latest',documentationVersion:'1.0.1'},targets:{bun:{status:'passed',runtimeVersion:'1.4.4',checks:[]}}};
    await writeFile(path.join(work,'compatibility/results/bybit.json'),JSON.stringify(comparison));
    const ctx={id:'bybit',sdk:{name:'Example'},pkg:{name:'example',version:'1.0.1'},docs:work};
    await generateCompatibility(ctx,work);
    const page=await readFile(path.join(work,'compatibility.md'),'utf8');
    assert.match(page,/Tested SDK: `example@1\.0\.0`/);
    assert.match(page,/Test metadata: SDK 1\.0\.0; API reference source 1\.0\.1/);
    ctx.pkg.version='1.0.2';
    await generateCompatibility(ctx,work);
    const newer=await readFile(path.join(work,'compatibility.md'),'utf8');
    assert.match(newer,/No matching live exchange results/);
    assert.doesNotMatch(newer,/Live checks passed|npm install example@1\.0\.0/);
  } finally { await rm(work,{recursive:true,force:true}); }
});
test('a failed check is displayed instead of being promoted to supported',()=>assert.equal(displayedTarget(report,'bun','example','1.0.0').status,'failed'));
test('registry failure invalidates previously green cells',()=>assert.equal(displayedTarget({...report,packageAvailable:false},'node','example','1.0.0').status,'not-run'));
test('local source or obsolete suites cannot certify a released package',()=>{
  assert.equal(displayedTarget({...report,source:'local'},'node','example','1.0.0').status,'not-run');
  assert.equal(displayedTarget({...report,suiteVersion:'old'},'node','example','1.0.0').status,'not-run');
});
test('live reports require the full exchange check set',()=>{
  const checks=['import','rest','websocket','cleanup'].map(id=>({id,status:'passed'}));
  assert.equal(completeBrowserResult(checks),true);
  assert.equal(completeBrowserResult(checks.filter(c=>c.id!=='rest')),false);
  assert.equal(completeBrowserResult([{id:'bundle',status:'passed'}]),false);
  const native={platform:'android',hermes:true,checks:checks.map(c=>c.id==='import'?{...c,id:'native-import'}:c)};
  assert.equal(completeNativeResult(native),true);
  assert.equal(completeNativeResult({...native,hermes:false}),false);
});
test('simulated results cannot be presented as live',()=>{
  assert.equal(displayedTarget({...report,traffic:undefined},'node','example','1.0.0').status,'not-run');
  assert.equal(displayedTarget({...report,suiteVersion:'1'},'node','example','1.0.0').status,'not-run');
});
