import { readFile } from 'node:fs/promises';
import { exchanges } from './exchanges.mjs';

export function fill(template, values) {
  return template.replace(/@@([A-Z_]+)@@/g, (_, key) => {
    if (!(key in values)) {
      throw new Error(`Missing example field: ${key}`);
    }
    return values[key];
  });
}

export function indent(source, spaces) {
  const padding = ' '.repeat(spaces);
  return source.split('\n').map(line => line ? padding + line : '').join('\n');
}

export async function programFiles(id, sdk, format = 'esm', extension = 'mjs') {
  const exchange = exchanges[id];
  const commonjs = format === 'commonjs';
  const typescript = format === 'typescript';
  const importSdk = name => commonjs
    ? `const { ${name} } = require('${sdk.packageName}');`
    : `import { ${name} } from '${sdk.packageName}';`;
  const requestIndent = commonjs ? 2 : 0;
  const price = fill(await readFile(new URL('./price.tpl', import.meta.url), 'utf8'), {
    IMPORT: importSdk(exchange.restClient),
    OPEN: commonjs ? 'async function main() {\n' : '',
    REQUEST: indent(exchange.request, requestIndent),
    INDENT: ' '.repeat(requestIndent),
    SYMBOL: exchange.symbol,
    CLOSE: commonjs ? `}\n\nmain().catch((error) => {\n  console.error(error);\n  process.exitCode = 1;\n});` : '',
  }).trimEnd() + '\n';
  const stream = fill(await readFile(new URL('./stream.tpl', import.meta.url), 'utf8'), {
    IMPORT: `${importSdk('WebsocketClient')}\n${commonjs ? "const process = require('node:process');" : "import process from 'node:process';"}`,
    WEBSOCKET: exchange.websocket,
    SYMBOL: exchange.symbol,
    TIMEOUT_TYPE: typescript ? ': ReturnType<typeof setTimeout> | undefined' : '',
    PROMISE_TYPE: typescript ? '<string>' : '',
    ERROR_TYPE: typescript ? ': unknown' : '',
    EVENT: exchange.event,
    UPDATE: indent((typescript ? exchange.typescriptGuard || '' : '') + exchange.update, 8),
    SUBSCRIPTION: exchange.subscription,
  });
  return new Map([[`price.${extension}`, price], [`stream.${extension}`, stream]]);
}


export async function screenFile(id, sdk, setup) {
  const exchange = exchanges[id];
  const values = {
    PACKAGE: sdk.packageName,
    REST_CLIENT: exchange.restClient,
    SYMBOL: exchange.symbol,
    WEBSOCKET: exchange.websocket,
    EVENT: exchange.event,
    SUBSCRIPTION: exchange.subscription,
  };
  if (setup === 'react' || setup === 'expo') {
    values.EFFECT = fill(await readFile(new URL('./effect.tpl', import.meta.url), 'utf8'), {
      ...values,
      REQUEST: indent(exchange.request, 6),
      UPDATE: indent(exchange.update, 6),
    }).trimEnd();
  }
  return fill(await readFile(new URL(`./${setup}.tpl`, import.meta.url), 'utf8'), {
    ...values,
    REQUEST: indent(exchange.request, 4),
    UPDATE: indent(exchange.update, 4),
  });
}
