import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/context.mjs';
import { matchingReport, displayedTarget, generateCompatibility } from './report.mjs';
import { suiteVersion, completeRuntimeResult, runtimeChecks } from './config.mjs';
import {completeBrowserResult} from './browser.mjs';
import {completeNativeResult,matchingNativeReport} from './native.mjs';
const report={checkedAt:'2026-11-04T00:00:00Z',platform:'test',schemaVersion:1,suiteVersion,traffic:'live-mainnet',source:'npm',packageName:'example',packageVersion:'1.0.0',packageAvailable:true,targets:{bun:{status:'failed',checks:[]},node:{status:'passed',checks:[]}}};
test('recorded results are selected by SDK identity without a documentation version association',()=>{
  assert.equal(matchingReport(report,'example'),true);
  assert.equal(displayedTarget(report,'node','example').status,'passed');
  const comparison={...report,selection:{kind:'explicit',requestedVersion:'latest',documentationVersion:'1.0.1'}};
  assert.equal(displayedTarget(comparison,'node','example').status,'passed');
  assert.equal(displayedTarget(comparison,'node','another-package').status,'not-run');
});
test('generated pages retain recorded results and tested versions across patch, minor and major updates',async()=>{
  await mkdir(path.join(root,'tmp'),{recursive:true});
  const work=await mkdtemp(path.join(root,'tmp/report-test-'));
  try {
    await mkdir(path.join(work,'compatibility/results'),{recursive:true});
    const comparison={...report,selection:{kind:'explicit',requestedVersion:'latest',documentationVersion:'1.0.1'},targets:{
      bun:{status:'passed',runtimeVersion:'1.4.4',checkedAt:'2026-11-03T12:00:00Z',checks:[]},
      node:{status:'failed',checks:[]}, next:{status:'build-only',checks:[]}, deno:{status:'not-run',checks:[]},
    }};
    await writeFile(path.join(work,'compatibility/results/bybit.json'),JSON.stringify(comparison));
    const ctx={id:'bybit',sdk:{name:'Example'},pkg:{name:'example',version:'1.0.1'},docs:work};
    for(const version of ['1.0.1','1.0.2','1.1.0','2.0.0']) {
      ctx.pkg.version=version;
      await generateCompatibility(ctx,work);
      const page=await readFile(path.join(work,'compatibility.md'),'utf8');
      assert.match(page,/Tested SDK: `example@1\.0\.0`/);
      assert.ok(page.includes(`Test metadata: SDK 1.0.0; API reference source ${version}.`));
      assert.match(page,/Last run: \*\*2026-11-04/);
      assert.match(page,/Checked 2026-11-03/);
      assert.match(page,/1\.4\.4 \| Live checks passed/);
      for(const label of ['Checks failed','Build only','Not verified'])assert.ok(page.includes(label));
      assert.doesNotMatch(page,/No recorded live exchange results|npm install example@1\.0\.0/);
    }
    delete comparison.selection;
    await writeFile(path.join(work,'compatibility/results/bybit.json'),JSON.stringify(comparison));
    await generateCompatibility(ctx,work);
    assert.match(await readFile(path.join(work,'compatibility.md'),'utf8'),/Tested SDK: `example@1\.0\.0`/);
  } finally { await rm(work,{recursive:true,force:true}); }
});
test('missing and malformed evidence stays unverified',async()=>{
  for(const value of [undefined,null,{}, {...report,packageVersion:null}, {...report,packageVersion:'unknown'}, {...report,checkedAt:'invalid'}, {...report,targets:null}, {...report,targets:[]}]) {
    assert.equal(matchingReport(value,'example'),false);
    assert.equal(displayedTarget(value,'node','example').status,'not-run');
  }
  for(const target of [null,{status:'passed',checks:null},{status:'passed',checks:[null]},{status:'passed',checks:[],checkedAt:'invalid'},{status:'unknown',checks:[]}]) {
    assert.equal(displayedTarget({...report,targets:{node:target}},'node','example').status,'not-run');
  }
  const work=await mkdtemp(path.join(root,'tmp/report-malformed-test-'));
  try {
    await mkdir(path.join(work,'compatibility/results'),{recursive:true});
    const ctx={id:'bybit',sdk:{name:'Example'},pkg:{name:'example',version:'2.0.0'},docs:work};
    for(const content of [undefined,'{invalid','null',JSON.stringify({...report,packageName:'another-package'})]) {
      if(content!==undefined)await writeFile(path.join(work,'compatibility/results/bybit.json'),content);
      await generateCompatibility(ctx,work);
      const page=await readFile(path.join(work,'compatibility.md'),'utf8');
      assert.match(page,/No recorded live exchange results/);
      assert.doesNotMatch(page,/Live checks passed|Tested SDK:/);
    }
  }finally{await rm(work,{recursive:true,force:true});}
});
test('a failed check is displayed instead of being promoted to supported',()=>assert.equal(displayedTarget(report,'bun','example').status,'failed'));
test('registry failure invalidates previously green cells',()=>assert.equal(displayedTarget({...report,packageAvailable:false},'node','example').status,'not-run'));
test('local source or obsolete suites cannot certify a released package',()=>{
  assert.equal(displayedTarget({...report,source:'local'},'node','example').status,'not-run');
  assert.equal(displayedTarget({...report,suiteVersion:'old'},'node','example').status,'not-run');
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
  assert.equal(displayedTarget({...report,traffic:undefined},'node','example').status,'not-run');
  assert.equal(displayedTarget({...report,suiteVersion:'1'},'node','example').status,'not-run');
});

test('native completion requires the expected platform, Hermes and every live check',()=>{
  const report={platform:'ios',hermes:true,checks:['native-import','rest','websocket','cleanup'].map(id=>({id,status:'passed'}))};
  assert.equal(completeNativeResult(report,'ios'),true);
  assert.equal(completeNativeResult({...report,platform:'android'},'ios'),false);
  assert.equal(completeNativeResult(report,'android'),false);
  assert.equal(completeNativeResult({...report,hermes:false},'ios'),false);
  assert.equal(completeNativeResult({...report,checks:report.checks.filter(c=>c.id!=='websocket')},'ios'),false);
  assert.equal(completeNativeResult({...report,checks:[...report.checks,{id:'native-execution',status:'failed'}]},'ios'),false);
});
test('native collector rejects another run, package, profile or platform',()=>{
  const expected={runId:'run-1',packageName:'example',packageVersion:'1.0.0',platform:'ios',profile:'configured'};
  const report={...expected,checks:[]};
  assert.equal(matchingNativeReport(report,expected),true);
  for(const field of Object.keys(expected))assert.equal(matchingNativeReport({...report,[field]:'other'},expected),false);
  assert.equal(matchingNativeReport({...report,checks:null},expected),false);
});

test('iOS pages distinguish simulator execution from bundle-only evidence',async()=>{
  await mkdir(path.join(root,'tmp'),{recursive:true});
  const work=await mkdtemp(path.join(root,'tmp/report-ios-test-'));
  try {
    await mkdir(path.join(work,'compatibility/results'),{recursive:true});
    const ios={status:'passed',reason:'The SDK passed live exchange REST and WebSocket checks in Expo Go on the iOS simulator.',runtimeVersion:'React Native 0.88.1 / Expo 58.0.23 / iOS 26.3.1 / Hermes',checks:['native-bundle-ios','native-import','rest','websocket','cleanup'].map(id=>({id,status:'passed'}))};
    const fixture={...report,checkedAt:'2026-11-04T14:00:00Z',platform:'darwin/arm64',targets:{'react-native-ios':ios}};
    await writeFile(path.join(work,'compatibility/results/hyperliquid.json'),JSON.stringify(fixture));
    const ctx={id:'hyperliquid',sdk:{name:'Example'},pkg:{name:'example',version:'1.0.0'},docs:work};
    await generateCompatibility(ctx,work);
    const live=await readFile(path.join(work,'compatibility.md'),'utf8');
    assert.match(live,/Live checks passed.*The SDK passed live exchange REST/);
    assert.match(live,/shared\/compatibility\/ios-scope.md/);
    assert.doesNotMatch(live,/No iOS simulator or device execution has been performed/);
    fixture.targets['react-native-ios']={status:'build-only',reason:'The iOS Metro bundle passed. No iOS simulator or device execution has been performed.',checks:[{id:'native-bundle-ios',status:'passed'}]};
    await writeFile(path.join(work,'compatibility/results/hyperliquid.json'),JSON.stringify(fixture));
    await generateCompatibility(ctx,work);
    const bundle=await readFile(path.join(work,'compatibility.md'),'utf8');
    assert.match(bundle,/Build only.*No iOS simulator or device execution/);
    assert.doesNotMatch(bundle,/Live checks passed/);
  }finally{await rm(work,{recursive:true,force:true});}
});

test('configured iOS can supply the shared Metro recipe without an Android result',async()=>{
  const work=await mkdtemp(path.join(root,'tmp/report-ios-setup-test-'));
  try {
    await mkdir(path.join(work,'compatibility/results'),{recursive:true});
    const fixture={...report,checkedAt:'2026-11-04T14:00:00Z',platform:'darwin/arm64',targets:{'react-native-ios-configured':{status:'passed',checks:[],consumerDependencies:{events:'3.3.0'}}}};
    const ctx={id:'bybit',sdk:{name:'Example'},pkg:{name:'example',version:'2.0.0'},docs:work};
    await writeFile(path.join(work,'compatibility/results/bybit.json'),JSON.stringify(fixture));
    await generateCompatibility(ctx,work);
    const ios=await readFile(path.join(work,'compatibility.md'),'utf8');
    assert.match(ios,/### Expo and Metro setup/);
    assert.match(ios,/npm install example events@3.3.0/);
    assert.doesNotMatch(ios,/Binance|binanceNodeSupport|binance\/lib/);
    fixture.targets={};
    await writeFile(path.join(work,'compatibility/results/bybit.json'),JSON.stringify(fixture));
    await generateCompatibility(ctx,work);
    const empty=await readFile(path.join(work,'compatibility.md'),'utf8');
    assert.doesNotMatch(empty,/#expo-and-metro-setup/);
  }finally{await rm(work,{recursive:true,force:true});}
});
