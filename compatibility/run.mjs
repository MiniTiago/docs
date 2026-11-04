import { mkdir, mkdtemp, readFile, writeFile, cp, rm, access, rename } from 'node:fs/promises';
import path from 'node:path';
import { root, ids, context } from '../scripts/context.mjs';
import { suiteVersion, runtimeVersions, targets, completeRuntimeResult } from './config.mjs';
import { run, npm } from './process.mjs';

const args = process.argv.slice(2);
let selected = ids, requested = ['node','bun','deno','vite'], installRuntimes = false, keep = false, packageVersion;
for (let i = 0; i < args.length; i++) {
  if (['--sdk','--targets','--package-version'].includes(args[i]) && (!args[i+1] || args[i+1].startsWith('--'))) throw new Error(`Missing value for ${args[i]}`);
  if (args[i] === '--sdk') selected = [args[++i]];
  else if (args[i] === '--package-version') packageVersion = args[++i];
  else if (args[i] === '--targets') requested = args[++i].split(',');
  else if (args[i] === '--install-runtimes') installRuntimes = true;
  else if (args[i] === '--keep') keep = true;
  else throw new Error(`Unknown argument ${args[i]}`);
}
if (selected.some(id => !ids.includes(id)) || !requested.length || requested.some(target => !targets.includes(target))) throw new Error('Unknown SDK or target.');
if (packageVersion && (selected.length !== 1 || !/^(latest|\d+\.\d+\.\d+(?:-[\w.-]+)?)$/.test(packageVersion))) throw new Error('--package-version requires --sdk and an exact version or latest.');
await mkdir(path.join(root, 'tmp'), { recursive: true });
const lock = path.join(root, 'tmp/compat.lock');
try { await mkdir(lock); } catch (error) {
  if (error.code === 'EEXIST') throw new Error('Another compatibility run owns tmp/compat.lock. Wait for it to finish.');
  throw error;
}
await mkdir(path.join(root, 'compatibility/results'), { recursive: true });
await mkdir(path.join(root, 'verification/compatibility'), { recursive: true });
const workRoot = process.env.COMPAT_WORK_ROOT ? path.resolve(process.env.COMPAT_WORK_ROOT) : path.join(root,'tmp');
await mkdir(workRoot,{recursive:true});
const work = await mkdtemp(path.join(workRoot, 'compat-'));
const runId = path.basename(work);
const evidence = path.join(root, 'verification/compatibility', runId);
await mkdir(evidence);
const cache = path.join(work, 'npm-cache');
const env = { npm_config_cache: cache, npm_config_registry: 'https://registry.npmjs.org', npm_config_audit: 'false', npm_config_fund: 'false', npm_config_update_notifier: 'false', DENO_DIR: path.join(work, 'deno-cache'), NEXT_TELEMETRY_DISABLED: '1' };
const binaries = new Map([['node', { binary: process.execPath, version: process.version }]]);
let hasFailure = false;
const emptyTarget = target => ({ target, status: 'not-run', runtimeVersion: null, checks: [], reason: 'Not checked in this run.' });
async function persist(report) {
  const destination = path.join(root, 'compatibility/results', `${report.sdk}.json`);
  await writeFile(`${destination}.next`, JSON.stringify(report, null, 2) + '\n');
  await rename(`${destination}.next`, destination);
}

async function runtime(target, id) {
  if (binaries.has(target)) return binaries.get(target);
  const configured = process.env[`${target.toUpperCase()}_BIN`];
  let binary = configured || target;
  let probe;
  try { probe = await run(binary, ['--version'], { cwd: work, env, timeout: 5000 }); } catch {}
  if (probe?.code !== 0 && installRuntimes && !configured) {
    const platform = process.platform, arch = process.arch;
    const packageName = target === 'bun'
      ? `@oven/bun-${platform === 'win32' ? 'windows' : platform}-${arch === 'arm64' ? 'aarch64' : arch}`
      : `@deno/${platform === 'win32' ? 'win32' : platform}-${arch}`;
    const dir = path.join(work, 'runtimes', target);
    await rm(dir, { recursive: true, force: true });
    await rm(cache, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir,'package.json'), '{"private":true}');
    await npm(['install','--ignore-scripts','--save-exact',`${packageName}@${runtimeVersions[target]}`], { cwd: dir, env, log: path.join(evidence, `${id}-${target}-install.log`) });
    const packageRoot = path.join(dir, 'node_modules', packageName);
    binary = path.join(packageRoot, target === 'bun' ? 'bin/bun' : 'deno');
    if (platform === 'win32') binary += '.exe';
    await access(binary);
    probe = await run(binary, ['--version'], { cwd: work, env, timeout: 5000 });
    await rm(cache, { recursive:true, force:true });
  }
  if (probe?.code !== 0) throw new Error(`${target} is not available. Install it or pass --install-runtimes.`);
  const found = { binary, version: probe.output.trim().split('\n')[0] };
  binaries.set(target, found);
  return found;
}

try {
  for (const id of selected) {
    const ctx = await context(id);
    const reportPath = path.join(root, 'compatibility/results', `${id}.json`);
    let previous;
    try { previous = JSON.parse(await readFile(reportPath, 'utf8')); } catch {}
    const requestedVersion = packageVersion || ctx.pkg.version;
    const report = {
      schemaVersion: 1, suiteVersion, sdk: id, packageName: ctx.pkg.name, packageVersion: ctx.pkg.version,
      source: 'npm', traffic:'live-mainnet', packageAvailable: false, platform: `${process.platform}/${process.arch}`,
      runId, checkedAt: new Date().toISOString(),
      ...(packageVersion ? { selection: { kind:'explicit', requestedVersion, documentationVersion:ctx.pkg.version } } : {}),
      targets: Object.fromEntries(targets.map(target => [target, emptyTarget(target)])),
    };
    // Clear requested cells before any work. An interrupted or failed attempt
    // cannot leave a green result from an earlier attempt in those cells.
    for (const target of requested) report.targets[target] = emptyTarget(target);
    await persist(report);
    console.log(`Resolving ${ctx.pkg.name}@${requestedVersion}`);
    const metadataResult = await run('npm', ['view', `${ctx.pkg.name}@${requestedVersion}`, '--json'], { cwd: work, env, log: path.join(evidence, `${id}-registry.log`) });
    if (metadataResult.code !== 0) {
      report.reason = /E404|No match found/.test(metadataResult.output) ? 'This exact package version is not available from npm.' : 'The npm registry check did not complete.';
      for (const target of targets) report.targets[target] = { ...emptyTarget(target), reason: report.reason };
      await persist(report); hasFailure = true;
      console.log(`  ${report.reason}`);
      continue;
    }
    const metadata = JSON.parse(metadataResult.stdout);
    if (metadata.name !== ctx.pkg.name || (requestedVersion !== 'latest' && metadata.version !== requestedVersion) || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(metadata.version)) throw new Error('npm returned a different package identity.');
    report.packageVersion = metadata.version;
    const sameRelease = previous?.schemaVersion === 1 && previous?.suiteVersion === suiteVersion && previous?.traffic === 'live-mainnet' && previous?.packageName === ctx.pkg.name && previous?.packageVersion === metadata.version && previous?.source === 'npm' && previous.packageAvailable;
    report.targets = Object.fromEntries(targets.map(target => [target, sameRelease && !requested.includes(target) ? previous.targets?.[target] || emptyTarget(target) : emptyTarget(target)]));
    report.packageAvailable = true;
    console.log(`Checking published ${ctx.pkg.name}@${report.packageVersion}`);
    // npm validates this registry integrity value during installation. It is
    // artifact integrity evidence, not an additional semantic identity scheme.
    report.artifact = { tarball: metadata.dist.tarball, integrity: metadata.dist.integrity };
    await persist(report);
    const consumer = path.join(work, id);
    await mkdir(consumer);
    await writeFile(path.join(consumer, 'package.json'), JSON.stringify({ name: `docs-compat-${id}`, private: true, type: 'module' }));
    try {
      await npm(['install','--ignore-scripts','--save-exact',`${ctx.pkg.name}@${report.packageVersion}`], { cwd: consumer, env, log: path.join(evidence, `${id}-install.log`) });
      const installed = JSON.parse(await readFile(path.join(consumer, 'node_modules', ctx.pkg.name, 'package.json'), 'utf8'));
      if (installed.name !== ctx.pkg.name || installed.version !== report.packageVersion) throw new Error('Installed package identity mismatch.');
      await cp(path.join(consumer, 'package-lock.json'), path.join(evidence, `${id}-package-lock.json`));
      await rm(cache, { recursive:true, force:true });
      await cp(path.join(root, 'compatibility/consumer.mjs'), path.join(consumer, 'consumer.mjs'));
      await cp(path.join(root,'compatibility/live-scenario.mjs'),path.join(consumer,'live-scenario.mjs'));
      await writeFile(path.join(consumer,'live-config.json'),JSON.stringify({packageName:ctx.pkg.name}));
      await cp(path.join(root, 'compatibility/adapters', `${id}.mjs`), path.join(consumer, 'adapter.mjs'));
      const adapter = await import(`./adapters/${id}.mjs`);
      await writeFile(path.join(consumer, 'types.ts'), adapter.typeExample);
      await writeFile(path.join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, skipLibCheck: true, noEmit: true }, files: ['types.ts'] }));
      const typeCheck = await run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'], { cwd: consumer, env, log: path.join(evidence, `${id}-types.log`) });
      for (const target of requested) {
        const cell = report.targets[target] = { ...emptyTarget(target), checkedAt: report.checkedAt, platform: report.platform };
        await persist(report);
        console.log(`  ${target}`);
        if (['vite','browser','browser-configured','browser-bundle','next','react-native','react-native-ios','react-native-configured','react-native-ios-configured'].includes(target)) {
          try {
            if (target === 'next' && !keep) { await rm(path.join(work,'runtimes'), {recursive:true,force:true}); binaries.delete('bun'); binaries.delete('deno'); await rm(cache,{recursive:true,force:true}); }
            const options = { id, consumer, evidence, env, packageName:ctx.pkg.name, packageVersion:report.packageVersion, runId };
            if (target.startsWith('browser')) {
              const { browserCheck } = await import('./browser.mjs');
              Object.assign(cell, await browserCheck({...options,profile:target==='browser-bundle'?'published-bundle':target==='browser-configured'?'configured':'vite'}));
            } else if (target.startsWith('react-native')) {
              const { nativeCheck } = await import('./native.mjs');
              Object.assign(cell, await nativeCheck({...options,platform:target.includes('-ios')?'ios':'android',profile:target.endsWith('-configured')?'configured':'default'}));
            } else {
              const { frameworkCheck } = await import('./frameworks.mjs');
              Object.assign(cell, await frameworkCheck(target, options));
            }
          } catch (error) { cell.status = 'not-run'; cell.reason = /ENOSPC/.test(String(error)) ? 'The check environment could not be installed because the local volume ran out of space.' : 'The framework check environment could not be prepared. See the local run log.'; cell.detail = String(error.stack || error); }
        } else {
          try {
            const installedRuntime = await runtime(target, id);
            cell.runtimeVersion = installedRuntime.version;
            await rm(path.join(consumer, 'result.json'), { force:true });
            const cliArgs = target === 'deno' ? ['run','--no-prompt','--allow-net',`--allow-read=${consumer}`,`--allow-write=${path.join(consumer,'result.json')}`, '--allow-env', '--node-modules-dir=manual','consumer.mjs'] : ['consumer.mjs'];
            const execution = await run(installedRuntime.binary, cliArgs, { cwd:consumer, env, timeout:60000, log:path.join(evidence, `${id}-${target}.log`) });
            try { cell.checks = JSON.parse(await readFile(path.join(consumer,'result.json'),'utf8')); } catch { cell.checks.push({id:'execution',status:'failed',detail:'The runtime did not produce a complete check report.'}); }
            cell.checks.push({ id:'types', status:typeCheck.code === 0 ? 'passed' : 'failed', ...(typeCheck.code ? {detail:typeCheck.output.slice(-2500)} : {}) });
            if (execution.timedOut) cell.checks.push({id:'cleanup', status:'failed', detail:'Consumer did not exit naturally before the deadline.'});
            cell.status = completeRuntimeResult(cell.checks, execution) ? 'passed' : 'failed';
            cell.reason = cell.status === 'failed' ? 'One or more package checks failed. See the individual checks below.' : 'The package checks listed below passed against the live exchange APIs.';
            cell.detail = execution.output.slice(-3000);
          } catch (error) { cell.status = 'not-run'; cell.reason = 'The runtime or live exchange check could not be started.'; cell.detail = String(error.stack || error); }
          finally {
            if (!keep && ['bun','deno'].includes(target)) {
              await rm(path.join(work,'runtimes',target), {recursive:true,force:true});
              await rm(cache, {recursive:true,force:true});
              binaries.delete(target);
            }
          }
        }
        if (cell.status === 'failed' || cell.status === 'not-run') hasFailure = true;
        console.log(`    ${cell.status}${cell.checks.length ? ': '+cell.checks.filter(c=>c.status!=='passed').map(c=>c.id).join(', ') : ''}`);
        await persist(report);
      }
    } catch (error) {
      report.reason = 'The clean package installation or consumer setup failed.';
      report.detail = String(error.stack || error); hasFailure = true;
      for (const target of requested) report.targets[target] = { ...emptyTarget(target), reason:report.reason };
    } finally { await persist(report); if (!keep) await rm(consumer,{recursive:true,force:true}); }
    await rm(cache,{recursive:true,force:true});
  }
} finally {
  if (!keep) await rm(work, { recursive:true, force:true });
  await rm(lock, {recursive:true,force:true});
}
console.log(`Compatibility results: compatibility/results/. Evidence: verification/compatibility/${runId}/`);
// Fail CI for failed/requested checks, while preserving a report that the docs
// can render. Documentation generation itself does not need a green matrix.
if (hasFailure) process.exitCode = 1;
