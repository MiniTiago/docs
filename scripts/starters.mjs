import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogue, root } from './context.mjs';
import { environments, environmentFiles, environmentTitles } from './environments.mjs';

const localDirectories = new Set(['node_modules', 'dist', '.next', '.expo', '.vite', '.turbo', '.metro-cache', '.metro-file-map', 'native-dist-ios', 'native-dist-android', '.git']);
const localFiles = new Set(['package-lock.json', 'npm-shrinkwrap.json', 'bun.lock', 'bun.lockb', 'deno.lock', 'yarn.lock', 'pnpm-lock.yaml', '.npmrc', 'next-env.d.ts']);
const ignoreFile = `${[...localDirectories].map(name => `${name}/`).join('\n')}\n${[...localFiles].join('\n')}\n.env\n.env.*\n.DS_Store\n`;

function readme(sdk, environment) {
  const install = environment === 'bun' ? 'bun install' : environment === 'deno' ? 'deno install' : 'npm install';
  const start = environment === 'bun' ? 'bun run start' : environment === 'deno' ? 'deno task start'
    : ['react', 'vite', 'next'].includes(environment) ? 'npm run dev' : 'npm start';
  const streaming = ['node', 'typescript', 'bun', 'deno'].includes(environment);
  const stream = environment === 'bun' ? 'bun run stream' : environment === 'deno' ? 'deno task stream' : 'npm run stream';
  const prerequisite = environment === 'bun' || environment === 'deno'
    ? `Install ${environmentTitles[environment]} first.` : 'Use Node.js 24 and npm.';
  const native = environment === 'expo' ? '\nOpen the project in a matching Expo Go installation. Press **i** for an iOS simulator or **a** for an Android emulator.\n' : '';
  const controls = ['react', 'vite', 'expo'].includes(environment) ? '\nUse **Stop stream** to close the price subscription.\n' : '';
  const optionalStream = streaming ? `\nTo receive one WebSocket price and close the connection:\n\n\`\`\`sh\n${stream}\n\`\`\`\n` : '';
  const commonjs = environment === 'node' ? '\nFor CommonJS instead, run `node price.cjs` or `node stream.cjs`.\n' : '';
  return `# ${sdk.name}: ${environmentTitles[environment]}\n\nA runnable public-price example using \`${sdk.packageName}\`. No API key is required.\n\n${prerequisite}\n\n## Run\n\nFrom this folder:\n\n\`\`\`sh\n${install}\n${start}\n\`\`\`\n${native}${controls}${optionalStream}${commonjs}\n[Follow the complete step-by-step guide](https://sieblyio.github.io/docs/${sdk.id}/environments/${environment}.html).\n`;
}

export async function starterFiles(id, sdk, environment) {
  return new Map([
    ...await environmentFiles(id, sdk, environment),
    ['README.md', readme({ id, ...sdk }, environment)],
    ['.gitignore', ignoreFile],
  ]);
}

async function expectedTree() {
  const expected = new Map();
  const sdks = await catalogue();
  const rows = sdks.map(sdk => `## ${sdk.name}\n\n${environments.map(environment => `- [${environmentTitles[environment]}](./${sdk.id}/${environment}/)`).join('\n')}`);
  expected.set('README.md', `# Runnable SDK examples\n\nEach folder is a complete project. Open its README for prerequisites and run commands, or follow the linked guide from an empty directory.\n\n${rows.join('\n\n')}\n\n## Maintaining these examples\n\nEdit the maintained sources in \`shared/environments/\`, then run \`npm run starters:generate\` from the repository root. Run \`npm run check:starters\` to check without writing files. Regeneration updates known generated files and never deletes extra files or local build output. The check reports unexpected source files and stale folders for review.\n`);
  for (const sdk of sdks) {
    for (const environment of environments) {
      for (const [name, content] of await starterFiles(sdk.id, sdk, environment)) {
        expected.set(`${sdk.id}/${environment}/${name}`, content);
      }
    }
  }
  return expected;
}

async function ensureDirectory(directory) {
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`Expected a real directory: ${directory}`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(directory);
  }
}

export async function generateStarters(directory = path.join(root, 'starters')) {
  const expected = await expectedTree();
  await ensureDirectory(directory);
  for (const [relative, content] of expected) {
    let parent = directory;
    for (const segment of relative.split('/').slice(0, -1)) {
      parent = path.join(parent, segment);
      await ensureDirectory(parent);
    }
    const filename = path.join(directory, relative);
    try {
      const stat = await lstat(filename);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Refusing to overwrite a non-file: ${relative}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await writeFile(filename, content);
  }
  return { projects: (await catalogue()).length * environments.length, files: expected.size };
}

function localArtifact(relative) {
  const parts = relative.split('/');
  if (parts.at(-1) === '.DS_Store') return true;
  // Ignore installations and build output only inside a recognized project.
  if (parts.length < 3) return false;
  if (localDirectories.has(parts[2])) return true;
  return parts.length === 3 && (localFiles.has(parts[2]) || parts[2] === '.env' || parts[2].startsWith('.env.'));
}

export async function checkStarters(directory = path.join(root, 'starters')) {
  const expected = await expectedTree();
  const directories = new Set();
  for (const name of expected.keys()) {
    const parts = name.split('/');
    for (let count = 1; count < parts.length; count++) directories.add(parts.slice(0, count).join('/'));
  }
  const found = new Set();
  const errors = [];
  async function visit(relative = '') {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (localArtifact(name) && (name.split('/').length < 3 || directories.has(name.split('/').slice(0, 2).join('/')))) continue;
      if (entry.isDirectory() && directories.has(name)) {
        await visit(name);
      } else if (entry.isFile() && expected.has(name)) {
        found.add(name);
        if (await readFile(path.join(directory, name), 'utf8') !== expected.get(name)) errors.push(`Changed generated file: ${name}`);
      } else {
        errors.push(`Unexpected example path: ${name}`);
      }
    }
  }
  await visit();
  for (const name of expected.keys()) {
    if (!found.has(name)) errors.push(`Missing generated file: ${name}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { projects: (await catalogue()).length * environments.length, files: expected.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const command = process.argv[2];
  if (!['generate', 'check'].includes(command) || process.argv.length !== 3) {
    throw new Error('Usage: node scripts/starters.mjs generate|check');
  }
  const result = command === 'generate' ? await generateStarters() : await checkStarters();
  console.log(`${command === 'generate' ? 'Generated' : 'Checked'} ${result.projects} example projects (${result.files} files).`);
}
