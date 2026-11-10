import path from 'node:path';

export function codeBlock(filename, content) {
  const extension = path.extname(filename);
  const language = ['.ts', '.mts', '.cts'].includes(extension) ? 'ts'
    : extension === '.jsx' ? 'jsx' : extension === '.html' ? 'html'
      : extension === '.json' ? 'json' : 'js';
  return `\`\`\`${language} [${filename}]\n${content.trimEnd()}\n\`\`\``;
}

const command = value => `\`\`\`sh\n${value}\n\`\`\``;
const purposes = {
  'package.json': 'Declare the SDK dependency and the commands used by this project.',
  'tsconfig.json': 'Enable strict type checking and compile the TypeScript programs into `dist/`.',
  'deno.json': 'Tell Deno to install npm dependencies locally and define the price and stream tasks.',
  'sdk.vite.config.js': 'Resolve the SDK imports that need browser support. Keep this configuration when using the SDK in Vite.',
  'vite.config.js': 'Configure the development server and production build.',
  'App.jsx': 'Build the React screen. The effect makes the REST request, subscribes to prices and closes the WebSocket on unmount.',
  'main.jsx': 'Mount the screen with StrictMode. Pause subscriptions while the browser caches the page, resume them on restoration and clean up when the page or entry module is discarded.',
  'main.js': 'Read the REST price, show WebSocket updates and wire the Stop stream button to connection cleanup.',
  'index.html': 'Create the browser page that loads the application entry module.',
  'app/layout.js': 'Provide the root HTML layout required by the Next.js App Router.',
  'app/api/price/route.js': 'Handle the request on the Node.js server. This file creates the SDK client and requests the current price directly.',
  'app/page.js': 'Add a page with a link to the price endpoint.',
  'app.json': 'Name the Expo app and enable iOS and Android.',
  'siebly-sdk.metro.cjs': 'Resolve Node-style HTTP imports to the configured React Native polyfills.',
  'metro.config.cjs': 'Apply the SDK resolver to Expo’s default Metro configuration.',
  'App.js': 'Build the native screen. Its effect reads the price, subscribes to updates and closes the connection when the price panel unmounts.',
  'index.js': 'Register the native app entry point with Expo.',
};

function fileStep(name, files, number, created = new Set()) {
  const directory = path.posix.dirname(name);
  const createDirectory = directory === '.' || created.has(directory) ? '' : `\n\nCreate its directory first:\n\n${command(`mkdir -p ${directory}`)}`;
  const parts = directory.split('/');
  for (let index = 1; index <= parts.length; index++) created.add(parts.slice(0, index).join('/'));
  return `### ${number}. Create \`${name}\`\n\n${purposes[name]}${createDirectory}\n\n${codeBlock(name, files.get(name))}`;
}

function orderedSteps(names, files) {
  let step = 0;
  const created = new Set();
  return names.filter(name => name === 'install' || files.has(name)).map(name => {
    step++;
    if (name === 'install') {
      return `### ${step}. Install dependencies\n\nRun this after saving \`package.json\`:\n\n${command('npm install')}`;
    }
    return fileStep(name, files, step, created);
  }).join('\n\n');
}

export function guideFields(id, sdk, environment, files) {
  const project = `${id}-${environment}-quickstart`;
  let setup = command(`mkdir ${project}\ncd ${project}`);
  let config = '';
  let app = '';
  let priceFiles = '';
  let streamFiles = '';
  let priceRun = '';
  let streamRun = '';

  if (environment === 'node') {
    setup = command(`mkdir ${project}\ncd ${project}\nnpm init -y\nnpm install ${sdk.packageName}`);
    priceFiles = `For a new project, create \`price.mjs\` with \`import\`. If your project uses \`require\`, choose \`price.cjs\` instead. Create **one** file; both request the price directly.\n\n::: code-group\n${codeBlock('price.mjs', files.get('price.mjs'))}\n${codeBlock('price.cjs', files.get('price.cjs'))}\n:::`;
    streamFiles = `For a new project, create \`stream.mjs\` with \`import\`. If your project uses \`require\`, choose \`stream.cjs\` instead. Create **one** stream file; it closes the client after the first price or a failure.\n\n::: code-group\n${codeBlock('stream.mjs', files.get('stream.mjs'))}\n${codeBlock('stream.cjs', files.get('stream.cjs'))}\n:::`;
    priceRun = `::: code-group\n${command('node price.mjs').replace('```sh', '```sh [price.mjs]')}\n${command('node price.cjs').replace('```sh', '```sh [price.cjs]')}\n:::`;
    streamRun = `::: code-group\n${command('node stream.mjs').replace('```sh', '```sh [stream.mjs]')}\n${command('node stream.cjs').replace('```sh', '```sh [stream.cjs]')}\n:::`;
  } else if (environment === 'typescript') {
    const dev = JSON.parse(files.get('package.json')).devDependencies;
    setup = command(`mkdir ${project}\ncd ${project}\nnpm init -y\nnpm install ${sdk.packageName}\nnpm install --save-dev typescript@${dev.typescript} @types/node@${dev['@types/node']}`);
    config = fileStep('tsconfig.json', files, 1);
    priceFiles = `Create \`price.mts\`. The SDK’s included definitions check the constructor, request parameters and response.\n\n${codeBlock('price.mts', files.get('price.mts'))}`;
    streamFiles = `Create \`stream.mts\` when you want a live update. Its promise resolves to a price string and its \`finally\` block closes the client.\n\n${codeBlock('stream.mts', files.get('stream.mts'))}`;
    priceRun = command('npx tsc --noEmit\nnpx tsc\nnode dist/price.mjs');
    streamRun = command('npx tsc\nnode dist/stream.mjs');
  } else if (environment === 'bun' || environment === 'deno') {
    if (environment === 'bun') {
      setup = command(`mkdir ${project}\ncd ${project}\nbun add ${sdk.packageName}`);
    } else {
      config = [fileStep('package.json', files, 1), fileStep('deno.json', files, 2), `### 3. Install dependencies\n\n${command('deno install')}`].join('\n\n');
    }
    priceFiles = `Create \`price.js\` to make a public REST request.\n\n${codeBlock('price.js', files.get('price.js'))}`;
    streamFiles = `Create \`stream.js\` to receive one WebSocket price and close the connection.\n\n${codeBlock('stream.js', files.get('stream.js'))}`;
    priceRun = command(environment === 'bun' ? 'bun price.js' : 'deno task start');
    streamRun = command(environment === 'bun' ? 'bun stream.js' : 'deno task stream');
  } else {
    const names = environment === 'react'
      ? ['package.json', 'install', 'sdk.vite.config.js', 'vite.config.js', 'App.jsx', 'main.jsx', 'index.html']
      : environment === 'vite'
        ? ['package.json', 'install', 'vite.config.js', 'main.js', 'index.html']
        : environment === 'next'
          ? ['package.json', 'install', 'app/layout.js', 'app/api/price/route.js', 'app/page.js']
          : ['package.json', 'app.json', 'install', 'siebly-sdk.metro.cjs', 'metro.config.cjs', 'App.js', 'index.js'];
    app = orderedSteps(names, files);
  }

  return {
    PROJECT_SETUP: setup,
    CONFIG_FILES: config,
    APP_FILES: app,
    PRICE_FILES: priceFiles,
    STREAM_FILES: streamFiles,
    PRICE_RUN: priceRun,
    STREAM_RUN: streamRun,
  };
}
