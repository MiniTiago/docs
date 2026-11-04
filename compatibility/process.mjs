import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function run(command, args, { cwd, env = {}, timeout = 120000, log } = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stdout = [], stderr = [];
    let timedOut = false;
    const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore','pipe','pipe'], detached: process.platform !== 'win32' });
    const timer = setTimeout(() => {
      timedOut = true;
      try { process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {}
    }, timeout);
    child.stdout.on('data', data => { chunks.push(data); stdout.push(data); });
    child.stderr.on('data', data => { chunks.push(data); stderr.push(data); });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', async code => {
      clearTimeout(timer);
      const output = Buffer.concat(chunks).toString();
      try {
        if (log) { await mkdir(path.dirname(log), { recursive: true }); await writeFile(log, output); }
        resolve({ code, output, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString(), timedOut });
      } catch (error) { reject(error); }
    });
  });
}

export async function npm(args, options) {
  const result = await run('npm', args, options);
  if (result.code !== 0) throw new Error(`npm ${args[0]} failed: ${result.output.slice(-1800)}`);
  return result;
}
