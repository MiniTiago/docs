import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { create, list } from 'tar';
import { root } from './context.mjs';
import { frameworkVersions, nativeVersions } from '../compatibility/config.mjs';

export const environments = ['node', 'typescript', 'react', 'vite', 'next', 'expo', 'bun', 'deno'];
export const environmentTitles = { node: 'Node.js / JavaScript', typescript: 'Node.js / TypeScript', react: 'React', vite: 'Vite (plain JavaScript)', next: 'Next.js', expo: 'React Native / Expo', bun: 'Bun', deno: 'Deno' };
const reactPluginVersion = '4.7.0';
const json = value => JSON.stringify(value, null, 2) + '\n';
const source = relative => readFile(path.join(root, relative), 'utf8');
const template = relative => source(`shared/environments/${relative}`);

// These small translations keep the runnable JavaScript, CommonJS and typed
// examples on the same request and subscription implementations.
function commonJs(input) {
  const exported = [...input.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map(match => match[1]);
  const requirePath = value => value.startsWith('.') ? value.replace(/\.js$/, '.cjs') : value;
  const output = input
    .replace(/^import \* as (\w+) from '([^']+)';$/gm, (_, name, target) => `const ${name} = require('${requirePath(target)}');`)
    .replace(/^import (\{[^}]+\}|\w+) from '([^']+)';$/gm, (_, names, target) => `const ${names} = require('${requirePath(target)}');`)
    .replace(/^export /gm, '');
  if (/^(?:import|export) /m.test(output)) throw new Error('Unsupported module syntax in shared JavaScript example.');
  return output.trimEnd() + (exported.length ? `\n\nmodule.exports = { ${exported.join(', ')} };\n` : '\n');
}

function replaceSignature(input, before, after) {
  if (!input.includes(before)) throw new Error(`Missing shared example signature: ${before}`);
  return input.replace(before, after);
}

function typedSources(sdk, market, price, cli) {
  market = `import type * as SDK from '${sdk.packageName}';\ntype Sdk = typeof SDK;\n\n` + market;
  for (const [before, after] of [
    ['client(sdk)', 'client(sdk: Sdk)'],
    ['read(client)', `read(client: InstanceType<Sdk['${sdk.clients[0]}']>)`],
    ['stream(sdk, logger)', "stream(sdk: Sdk, logger?: ConstructorParameters<Sdk['WebsocketClient']>[1])"],
    ['value(message)', 'value(message: any)'],
    ['subscribe(ws)', "subscribe(ws: InstanceType<Sdk['WebsocketClient']>)"],
  ]) market = replaceSignature(market, before, after);
  for (const [before, after] of [
    ['positivePrice(value)', 'positivePrice(value: unknown): string'],
    ['readPrice()', 'readPrice(): Promise<string>'],
    ['watchPrice(onPrice, onError)', 'watchPrice(onPrice: (price: string) => void, onError: (error: unknown) => void): () => void'],
    ['const receive = message =>', 'const receive = (message: Parameters<typeof market.value>[0]) =>'],
    ['const fail = error =>', 'const fail = (error: unknown) =>'],
  ]) price = replaceSignature(price, before, after);
  cli = replaceSignature(cli, 'let stop;', 'let stop: (() => void) | undefined;');
  cli = replaceSignature(cli, 'new Promise(', 'new Promise<string>(');
  return new Map([['market.ts', market], ['price.ts', price], ['prices.ts', cli]]);
}

// Runtime checks and published starters consume the same exchange adapters and
// resolver configuration. Only the type-check-only fixture is omitted.
export async function environmentFiles(id, sdk, environment) {
  if (!environments.includes(environment)) throw new Error(`Unknown environment: ${environment}`);
  const files = new Map();
  const put = (name, value) => files.set(name, value);
  const copy = async (name, filename) => put(name, await template(filename));
  const pkg = { name: `${id}-${environment}-quickstart`, private: true, type: 'module', scripts: {}, dependencies: { [sdk.packageName]: 'latest' } };
  put('market.js', (await source(`compatibility/adapters/${id}.mjs`)).split('export const typeExample =')[0]);
  put('price.js', (await template('common/price.js')).replaceAll('@@PACKAGE@@', sdk.packageName));
  if (environment === 'node') {
    await copy('prices.js', 'runtime/prices.js');
    for (const name of ['market', 'price', 'prices']) put(`${name}.cjs`, commonJs(files.get(`${name}.js`)));
    pkg.scripts = { start: 'node prices.js', 'start:require': 'node prices.cjs' };
  } else if (environment === 'typescript') {
    const typed = typedSources(sdk, files.get('market.js'), files.get('price.js'), await template('runtime/prices.js'));
    files.clear();
    for (const [name, content] of typed) put(name, content);
    pkg.scripts = { check: 'tsc --noEmit', build: 'tsc', start: 'npm run build && node dist/prices.js' };
    pkg.devDependencies = { typescript: JSON.parse(await source('package.json')).devDependencies.typescript, '@types/node': '24.13.2' };
    put('tsconfig.json', json({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, skipLibCheck: true, outDir: 'dist', types: ['node'] }, include: ['*.ts'] }));
  } else if (environment === 'bun' || environment === 'deno') {
    await copy('prices.js', 'runtime/prices.js');
    if (environment === 'bun') pkg.scripts.start = 'bun prices.js';
    else {
      // npm packages need environment and filesystem access for Node compatibility.
      put('deno.json', json({ nodeModulesDir: 'auto', tasks: { start: 'deno run --allow-net --allow-env --allow-read prices.js' } }));
    }
  } else if (environment === 'vite' || environment === 'react') {
    pkg.scripts = { dev: 'vite --host 127.0.0.1', build: 'vite build', preview: 'vite preview --host 127.0.0.1' };
    pkg.devDependencies = { vite: frameworkVersions.vite };
    await copy('index.html', `${environment}/index.html`);
    if (environment === 'react') {
      Object.assign(pkg.dependencies, { react: frameworkVersions.react, 'react-dom': frameworkVersions.react });
      pkg.devDependencies['@vitejs/plugin-react'] = reactPluginVersion;
      await copy('App.jsx', 'react/App.jsx');
      await copy('main.jsx', 'react/main.jsx');
      const sdkConfig = id === 'hyperliquid' ? 'const sdkConfig = {};' : "import sdkConfig from './sdk.vite.config.js';";
      put('vite.config.js', `import react from '@vitejs/plugin-react';\n${sdkConfig}\nexport default { ...sdkConfig, plugins: [...(sdkConfig.plugins || []), react()] };\n`);
    } else await copy('main.js', 'vite/main.js');
    if (id !== 'hyperliquid') {
      pkg.dependencies.events = '3.3.0';
      put(environment === 'react' ? 'sdk.vite.config.js' : 'vite.config.js', await source(`compatibility/browser-config/${id}.mjs`));
    }
  } else if (environment === 'next') {
    pkg.scripts = { dev: 'next dev --webpack', build: 'next build --webpack', start: 'next start' };
    Object.assign(pkg.dependencies, { next: frameworkVersions.next, react: frameworkVersions.react, 'react-dom': frameworkVersions.react });
    await copy('app/layout.js', 'next/layout.js');
    await copy('app/page.js', 'next/page.js');
    await copy('app/api/price/route.js', 'next/route.js');
  } else {
    pkg.main = 'index.js';
    pkg.scripts = { start: 'expo start', ios: 'expo start --ios', android: 'expo start --android' };
    Object.assign(pkg.dependencies, { expo: nativeVersions.expo, react: nativeVersions.react, 'react-native': nativeVersions.reactNative });
    await copy('App.js', 'expo/App.js');
    await copy('index.js', 'expo/index.js');
    put('app.json', json({ expo: { name: `${sdk.name} BTC price`, slug: `${id}-btc-price`, version: '1.0.0', platforms: ['ios', 'android'] } }));
    if (id !== 'hyperliquid') {
      Object.assign(pkg.dependencies, JSON.parse(await source('compatibility/native-config/dependencies.json')));
      put('siebly-sdk.metro.cjs', await source('compatibility/native-config/metro.cjs'));
      put('metro.config.cjs', "const { getDefaultConfig } = require('expo/metro-config');\nmodule.exports = require('./siebly-sdk.metro.cjs')(getDefaultConfig(__dirname), __dirname);\n");
    }
  }
  return new Map([['package.json', json(pkg)], ...files]);
}

export async function writeEnvironment(directory, files) {
  for (const [name, content] of files) {
    await mkdir(path.dirname(path.join(directory, name)), { recursive: true });
    await writeFile(path.join(directory, name), content);
  }
}

export async function checkStarter(archive, expected) {
  const seen = new Set();
  const pending = [];
  const errors = [];
  await list({ file: archive, strict: true, onReadEntry(entry) {
    const name = entry.path;
    if (entry.type !== 'File' || !expected.has(name) || seen.has(name) || entry.size > 65536) {
      entry.resume();
      errors.push(`Unexpected starter entry: ${name}`);
      return;
    }
    seen.add(name);
    pending.push(new Promise((resolve, reject) => {
      const chunks = [];
      entry.on('data', chunk => chunks.push(chunk));
      entry.on('end', () => {
        if (Buffer.concat(chunks).toString('utf8') !== expected.get(name)) errors.push(`Starter content differs from maintained source: ${name}`);
        resolve();
      });
      entry.on('error', reject);
    }));
  } });
  await Promise.all(pending);
  if (errors.length) throw new Error(errors.join('\n'));
  if (seen.size !== expected.size) throw new Error('Starter is missing required files.');
}

const fence = (name, content) => `### \`${name}\`\n\n\`\`\`${name.endsWith('.json') ? 'json' : name.endsWith('.html') ? 'html' : name.endsWith('.ts') ? 'ts' : name.endsWith('.jsx') ? 'jsx' : 'js'}\n${content.trimEnd()}\n\`\`\``;
export async function generateEnvironments(ctx) {
  const output = path.join(ctx.docs, 'environments');
  const downloads = path.join(ctx.docs, 'public/starters');
  await mkdir(output, { recursive: true });
  await mkdir(downloads, { recursive: true });
  for (const environment of environments) {
    const files = await environmentFiles(ctx.id, ctx.sdk, environment);
    const directory = path.join(ctx.projectRoot, 'examples/environments', environment);
    await writeEnvironment(directory, files);
    // Explicit file names prevent caches, local configuration or dependencies
    // from being published when a generated consumer has also been exercised.
    const archive = path.join(downloads, `${environment}.tar.gz`);
    await create({ file: archive, cwd: directory, gzip: true, portable: true }, [...files.keys()]);
    await checkStarter(archive, files);
    const runtime = ['bun', 'deno'].includes(environment);
    const setup = environment === 'bun' ? 'bun install' : environment === 'deno' ? 'deno install' : 'npm install';
    const run = environment === 'bun' ? 'bun run start' : environment === 'deno' ? 'deno task start' : environment === 'expo' ? 'npm start' : 'npm run dev';
    const configured = ctx.id !== 'hyperliquid';
    const browser = environment === 'vite' || environment === 'react';
    const substitutions = {
      SDK: ctx.sdk.name, TITLE: environmentTitles[environment], PACKAGE: ctx.sdk.packageName, ENV: environment,
      PRICE_KIND: ctx.id === 'hyperliquid' ? 'Prices are BTC mid prices.' : 'Prices are BTCUSDT last traded prices.',
      SETUP: `\`\`\`sh\nmkdir ${ctx.id}-${environment}-quickstart\ncd ${ctx.id}-${environment}-quickstart\n\`\`\`\n\nCopy the files below, or extract the downloaded archive into this directory (adjust the download path if needed):\n\n\`\`\`sh\ntar -xzf ~/Downloads/${environment}.tar.gz\n\`\`\`\n\nInstall the dependencies after saving or extracting the files:\n\n\`\`\`sh\n${setup}\n\`\`\``,
      RUN: `\`\`\`sh\n${run}\n\`\`\``, FILES: [...files].map(([name, content]) => fence(name, content)).join('\n\n'),
      TYPESCRIPT: JSON.parse(await source('package.json')).devDependencies.typescript, REACT_PLUGIN: reactPluginVersion, VITE: frameworkVersions.vite, NEXT: frameworkVersions.next, REACT: frameworkVersions.react,
      EXPO: nativeVersions.expo, RN: nativeVersions.reactNative, NATIVE_REACT: nativeVersions.react,
      CONFIG_NOTE: configured
        ? browser ? `Keep the supplied Vite config${environment === 'react' ? ' files' : ''}: it resolves the events polyfill${ctx.id === 'binance' ? ' and selects Binance browser support' : ''}.`
          : 'Keep both Metro configuration files and the five polyfill dependencies. They are the same resolver configuration used in the native checks.'
        : 'No additional SDK polyfill configuration is needed for this recipe.',
      POLYFILL_TROUBLE: configured
        ? browser ? `An \`events\` resolution error means the dependency or Vite config is missing.${ctx.id === 'binance' ? ' Keep the supplied browser-support selection in the same config.' : ''} Copy the config exactly and restart Vite.`
          : 'An unresolved `events`, `https`, `http`, `url` or `buffer` import means a dependency or Metro helper is missing. Install all dependencies and keep `metro.config.cjs` beside `package.json`.'
        : 'If an SDK import fails, run `npm install` in the starter directory and check that the installed package matches the import in `price.js`.',
      TROUBLE: environment === 'deno'
        ? '- Use `deno task start` to retain the documented permissions. A permission prompt or denial can mean you ran `deno run prices.js` directly. Network access is needed for the public exchange; environment and read access support npm dependencies.\n- Keep `nodeModulesDir: "auto"` in `deno.json` and run `deno install` if npm dependencies cannot be resolved.'
        : '- Run `bun install` in the directory containing `package.json` if the SDK import cannot be resolved.',
    };
    const guide = await template(`${runtime ? 'runtime' : environment}/guide.md`);
    const rendered = guide.replace(/@@([A-Z_]+)@@/g, (_, key) => {
      if (!(key in substitutions)) throw new Error(`Missing environment template field: ${key}`);
      return substitutions[key];
    });
    await writeFile(path.join(output, `${environment}.md`), rendered);
  }
}
