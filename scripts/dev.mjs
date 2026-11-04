import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { root, ids, context } from './context.mjs';

let child, preview, timer, stopped = false;
const pending = new Set();
const watchers = [];
async function rebuild() {
  if (child || stopped) return;
  const targets = [...pending];
  pending.clear();
  const args = targets.length === 1 && targets[0] !== '*' ? ['--sdk', targets[0]] : [];
  await new Promise((resolve, reject) => {
    child = spawn(process.execPath, ['scripts/build.mjs', ...args], { cwd: root, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => { child = undefined; console.log(code === 0 ? 'Preview updated. Refresh the browser.' : 'Build failed; the previous preview is still available.'); resolve(); });
  });
  if (pending.size) await rebuild();
}
function queue(id) {
  pending.add(id);
  clearTimeout(timer);
  timer = setTimeout(() => rebuild().catch(console.error), 350);
}
pending.add('*');
await rebuild();
preview = spawn(process.execPath, ['scripts/preview.mjs'], { cwd: root, stdio: 'inherit' });
for (const id of ids) {
  const ctx = await context(id);
  watchers.push(watch(path.join(ctx.sdkRoot, 'src'), { recursive: true }, () => queue(id)));
  watchers.push(watch(ctx.content, { recursive: true }, () => queue(id)));
  for (const file of await readdir(ctx.sdkRoot)) {
    if (file === 'package.json' || /^tsconfig.*\.json$/.test(file)) watchers.push(watch(path.join(ctx.sdkRoot, file), () => queue(id)));
  }
}
watchers.push(watch(path.join(root, 'shared'), { recursive: true }, () => queue('*')));
watchers.push(watch(path.join(root, 'scripts'), { recursive: true }, () => queue('*')));
watchers.push(watch(path.join(root, 'compatibility'), { recursive: true }, () => queue('*')));
function stop() { stopped = true; clearTimeout(timer); watchers.forEach((w) => w.close()); child?.kill('SIGTERM'); preview?.kill('SIGTERM'); }
preview.on('exit', stop);
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
console.log('Watching SDK source, guides, examples and the shared builder.');
