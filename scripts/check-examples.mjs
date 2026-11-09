import ts from 'typescript';
import path from 'node:path';
import { readdirSync } from 'node:fs';
import { context } from './context.mjs';
import { compilerConfig } from './compiler.mjs';

const { sdk, sdkRoot, content } = await context(process.env.SDK_ID);
const parsed = compilerConfig(sdkRoot, sdk.tsconfig);
const examples = readdirSync(path.join(content, 'examples')).filter((file) => file.endsWith('.ts'));
if (!examples.length) throw new Error('At least one checked example is required.');
const program = ts.createProgram(examples.map((file) => path.join(content, 'examples', file)), {
  ...parsed.options,
  ignoreDeprecations: '6.0',
  rootDir: undefined, outDir: undefined, noEmit: true,
  paths: {
    [sdk.packageName]: [path.join(sdkRoot, sdk.entryPoint)],
    ...Object.fromEntries((sdk.exampleDependencies || []).map((name) =>
      [name, [path.join(sdkRoot, 'node_modules', name)]])),
  },
  typeRoots: [path.join(sdkRoot, 'node_modules/@types')],
});
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => content, getCanonicalFileName: (file) => file, getNewLine: () => '\n',
  }));
}
console.log(`Checked ${examples.length} ${sdk.name} examples. No exchange requests were executed.`);
