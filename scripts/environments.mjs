import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { create, list } from 'tar';
import { root } from './context.mjs';
import { frameworkVersions, nativeVersions } from '../compatibility/config.mjs';
import { nativeMetroConfig } from '../compatibility/native-config/recipe.mjs';
import { programFiles, screenFile } from '../shared/environments/direct/render.mjs';
import { exchanges } from '../shared/environments/direct/exchanges.mjs';
import { guideFields } from './environment-guides.mjs';

export const environments = ['node', 'typescript', 'react', 'vite', 'next', 'expo', 'bun', 'deno'];
export const environmentTitles = { node: 'Node.js / JavaScript', typescript: 'Node.js / TypeScript', react: 'React', vite: 'Vite (plain JavaScript)', next: 'Next.js', expo: 'React Native / Expo', bun: 'Bun', deno: 'Deno' };
const reactPluginVersion = '4.7.0';
const json = value => JSON.stringify(value, null, 2) + '\n';
const source = relative => readFile(path.join(root, relative), 'utf8');
const template = relative => source(`shared/environments/${relative}`);

// Each rendered program contains direct SDK imports and calls. Exchange-specific
// fragments are composed here, never copied into public helper modules.
export async function environmentFiles(id, sdk, environment) {
  if (!environments.includes(environment)) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  const files = new Map();
  const copy = async (name, filename) => files.set(name, await template(filename));
  const pkg = {
    name: `${id}-${environment}-quickstart`,
    private: true,
    type: 'module',
    scripts: {},
    dependencies: { [sdk.packageName]: 'latest' },
  };

  if (environment === 'node') {
    for (const [name, content] of await programFiles(id, sdk)) {
      files.set(name, content);
    }
    for (const [name, content] of await programFiles(id, sdk, 'commonjs', 'cjs')) {
      files.set(name, content);
    }
    pkg.scripts = {
      start: 'node price.mjs',
      stream: 'node stream.mjs',
      'start:require': 'node price.cjs',
      'stream:require': 'node stream.cjs',
    };
  } else if (environment === 'typescript') {
    for (const [name, content] of await programFiles(id, sdk, 'typescript', 'mts')) {
      files.set(name, content);
    }
    pkg.scripts = {
      check: 'tsc --noEmit',
      build: 'tsc',
      start: 'npm run build && node dist/price.mjs',
      stream: 'npm run build && node dist/stream.mjs',
    };
    pkg.devDependencies = {
      typescript: JSON.parse(await source('package.json')).devDependencies.typescript,
      '@types/node': '24.13.2',
    };
    files.set('tsconfig.json', json({
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: true,
        outDir: 'dist',
        types: ['node'],
      },
      include: ['*.mts'],
    }));
  } else if (environment === 'bun' || environment === 'deno') {
    for (const [name, content] of await programFiles(id, sdk, 'esm', 'js')) {
      files.set(name, content);
    }
    if (environment === 'bun') {
      pkg.scripts = { start: 'bun price.js', stream: 'bun stream.js' };
    } else {
      delete pkg.scripts;
      const command = 'deno run --allow-net --allow-env --allow-read';
      files.set('deno.json', json({
        nodeModulesDir: 'auto',
        tasks: { start: `${command} price.js`, stream: `${command} stream.js` },
      }));
    }
  } else if (environment === 'vite' || environment === 'react') {
    pkg.scripts = {
      dev: 'vite --host 127.0.0.1',
      build: 'vite build',
      preview: 'vite preview --host 127.0.0.1',
    };
    pkg.devDependencies = { vite: frameworkVersions.vite };
    await copy('index.html', `${environment}/index.html`);
    if (environment === 'react') {
      Object.assign(pkg.dependencies, {
        react: frameworkVersions.react,
        'react-dom': frameworkVersions.react,
      });
      pkg.devDependencies['@vitejs/plugin-react'] = reactPluginVersion;
      files.set('App.jsx', await screenFile(id, sdk, 'react'));
      await copy('main.jsx', 'react/main.jsx');
      const viteConfig = id === 'hyperliquid'
        ? "import react from '@vitejs/plugin-react';\n\nexport default {\n  plugins: [react()],\n};\n"
        : "import { mergeConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport sdkConfig from './sdk.vite.config.js';\n\nexport default mergeConfig(sdkConfig, {\n  plugins: [react()],\n});\n";
      files.set('vite.config.js', viteConfig);
    } else {
      files.set('main.js', await screenFile(id, sdk, 'vite'));
    }
    if (id !== 'hyperliquid') {
      pkg.dependencies.events = '3.3.0';
      files.set(
        environment === 'react' ? 'sdk.vite.config.js' : 'vite.config.js',
        await source(`compatibility/browser-config/${id}.mjs`),
      );
    }
  } else if (environment === 'next') {
    pkg.scripts = {
      dev: 'next dev --webpack',
      build: 'next build --webpack',
      start: 'next start',
    };
    Object.assign(pkg.dependencies, {
      next: frameworkVersions.next,
      react: frameworkVersions.react,
      'react-dom': frameworkVersions.react,
    });
    await copy('app/layout.js', 'next/layout.js');
    await copy('app/page.js', 'next/page.js');
    files.set('app/api/price/route.js', await screenFile(id, sdk, 'next'));
  } else {
    pkg.main = 'index.js';
    pkg.scripts = {
      start: 'expo start',
      ios: 'expo start --ios',
      android: 'expo start --android',
    };
    Object.assign(pkg.dependencies, {
      expo: nativeVersions.expo,
      react: nativeVersions.react,
      'react-native': nativeVersions.reactNative,
    });
    files.set('App.js', await screenFile(id, sdk, 'expo'));
    await copy('index.js', 'expo/index.js');
    files.set('app.json', json({
      expo: {
        name: `${sdk.name} price screen`,
        slug: `${id}-price-screen`,
        version: '1.0.0',
        platforms: ['ios', 'android'],
      },
    }));
    if (id !== 'hyperliquid') {
      Object.assign(pkg.dependencies, JSON.parse(await source('compatibility/native-config/dependencies.json')));
      files.set('siebly-sdk.metro.cjs', await nativeMetroConfig(id));
      files.set('metro.config.cjs', "const { getDefaultConfig } = require('expo/metro-config');\nconst configureSdkMetro = require('./siebly-sdk.metro.cjs');\n\nconst config = getDefaultConfig(__dirname);\n\nmodule.exports = configureSdkMetro(config, __dirname);\n");
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
    const configured = ctx.id !== 'hyperliquid';
    const browser = environment === 'vite' || environment === 'react';
    const substitutions = {
      SDK: ctx.sdk.name, TITLE: environmentTitles[environment], PACKAGE: ctx.sdk.packageName, ENV: environment,
      PRICE_KIND: ctx.id === 'hyperliquid' ? 'Prices are BTC mid prices.' : `Prices are ${exchanges[ctx.id].symbol} last traded prices.`,
      SYMBOL: exchanges[ctx.id].symbol,
      EXAMPLE_URL: `https://github.com/sieblyio/docs/tree/main/starters/${ctx.id}/${environment}`,
      ...guideFields(ctx.id, ctx.sdk, environment, files),
      TYPESCRIPT: JSON.parse(await source('package.json')).devDependencies.typescript, REACT_PLUGIN: reactPluginVersion, VITE: frameworkVersions.vite, NEXT: frameworkVersions.next, REACT: frameworkVersions.react,
      EXPO: nativeVersions.expo, RN: nativeVersions.reactNative, NATIVE_REACT: nativeVersions.react,
      CONFIG_NOTE: configured
        ? browser ? `Keep the supplied Vite config${environment === 'react' ? ' files' : ''}: it resolves the events polyfill${ctx.id === 'binance' ? ' and selects Binance browser support' : ''}.`
          : 'Keep both Metro configuration files and the five polyfill dependencies. See Runtime compatibility for recorded verification of this configuration.'
        : 'No additional SDK polyfill configuration is needed for this recipe.',
      POLYFILL_TROUBLE: configured
        ? browser ? `An \`events\` resolution error means the dependency or Vite config is missing.${ctx.id === 'binance' ? ' Keep the supplied browser-support selection in the same config.' : ''} Copy the config exactly and restart Vite.`
          : 'An unresolved `events`, `https`, `http`, `url` or `buffer` import means a dependency or Metro helper is missing. Install all dependencies and keep `metro.config.cjs` beside `package.json`.'
        : 'If an SDK import fails, run `npm install` in the starter directory and check that the installed package matches the import in the application file.',
      TROUBLE: environment === 'deno'
        ? '- Use `deno task start` to retain the documented permissions. A permission prompt or denial can mean you ran `deno run price.js` directly. Network access is needed for the public exchange; environment and read access support npm dependencies.\n- Keep `nodeModulesDir: "auto"` in `deno.json` and run `deno install` if npm dependencies cannot be resolved.'
        : '- Run `bun install` in the directory containing `package.json` if the SDK import cannot be resolved.',
    };
    const guide = await template(`${runtime ? 'runtime' : environment}/guide.md`);
    let rendered = guide.replace(/@@([A-Z_]+)@@/g, (_, key) => {
      if (!(key in substitutions)) throw new Error(`Missing environment template field: ${key}`);
      return substitutions[key];
    });
    if (ctx.id === 'kraken') {
      rendered = rendered.replace('## Create the project', 'These setup examples have not yet been verified against the live exchange in this environment. See [Runtime compatibility](/compatibility) for the current verification status.\n\n## Create the project');
    }
    await writeFile(path.join(output, `${environment}.md`), rendered);
  }
}
