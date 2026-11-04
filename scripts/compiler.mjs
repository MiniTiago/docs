import ts from 'typescript';
import { createRequire } from 'node:module';
import path from 'node:path';

export function compilerConfig(sdkRoot, filename) {
  const config = ts.readConfigFile(path.join(sdkRoot, filename), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, sdkRoot);
  if (parsed.errors.length) throw new Error(parsed.errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
  const sdkTs = createRequire(path.join(sdkRoot, 'package.json'))('typescript');
  // TypeScript 6 changed the implicit strict default. Preserve the source SDK's
  // compiler semantics while retaining every explicitly configured strict flag.
  const overrides = {
    strict: parsed.options.strict ?? sdkTs.getStrictOptionValue({}, 'strictNullChecks'),
    ignoreDeprecations: '6.0',
  };
  return { options: { ...parsed.options, ...overrides }, overrides };
}
