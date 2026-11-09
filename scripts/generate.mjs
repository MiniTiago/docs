import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { Application, Comment, CommentTag, ReflectionKind } from 'typedoc';
import { context, root, catalogue } from './context.mjs';
import { compilerConfig } from './compiler.mjs';
import { generateCompatibility } from '../compatibility/report.mjs';
import { copySharedContent, validateIncludes } from './shared-content.mjs';
import { generateEnvironments } from './environments.mjs';
const ctx = await context(process.env.SDK_ID);
const { sdk, sdkRoot, projectRoot } = ctx;
await rm(projectRoot, { recursive: true, force: true });
await mkdir(projectRoot, { recursive: true });
await cp(path.join(ctx.content, 'docs'), ctx.docs, { recursive: true });
await copySharedContent(root, ctx.docs);
await cp(path.join(ctx.content, 'examples'), path.join(projectRoot, 'examples'), { recursive: true });
await cp(path.join(root, 'shared/public'), path.join(ctx.docs, 'public'), { recursive: true });
await generateCompatibility(ctx, root);
await generateEnvironments(ctx);

const pkg = JSON.parse(await readFile(path.join(sdkRoot, 'package.json'), 'utf8'));
if (pkg.name !== sdk.packageName) throw new Error(`Expected ${sdk.packageName}, received ${pkg.name}`);
if (process.env.SDK_VERSION && pkg.version !== process.env.SDK_VERSION) {
  throw new Error(`Source version ${pkg.version} does not match requested release ${process.env.SDK_VERSION}`);
}
const out = path.join(projectRoot, 'docs/api');
const app = await Application.bootstrapWithPlugins({
  entryPoints: [path.join(sdkRoot, sdk.entryPoint)],
  tsconfig: path.join(sdkRoot, sdk.tsconfig),
  plugin: ['typedoc-plugin-markdown'],
  useCustomAnchors: true,
  name: `${sdk.name} API reference`,
  readme: 'none',
  out,
  router: 'member',
  entryFileName: 'index',
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,
  excludeExternals: true,
  disableSources: true,
  disableGit: true,
  compilerOptions: compilerConfig(sdkRoot, sdk.tsconfig).overrides,
  hidePageHeader: true,
  hideBreadcrumbs: true,
  useCodeBlocks: true,
  expandParameters: true,
  parametersFormat: 'table',
  interfacePropertiesFormat: 'table',
  typeAliasPropertiesFormat: 'table',
  validation: { notExported: true, invalidLink: true, notDocumented: false },
});
const project = await app.convert();
if (!project || app.logger.hasErrors()) throw new Error('TypeDoc conversion failed');

// Enrich the documentation model, never the SDK or generated Markdown.
// Exact member checks make renamed or removed methods fail the docs build.
for (const help of sdk.referenceHelp || []) {
  const client = project.children.find((child) => child.name === help.client);
  const member = client?.children?.find((child) => child.name === help.method && child.kind === ReflectionKind.Method);
  if (!member) throw new Error(`Missing documented method: ${help.client}.${help.method}`);
  const targets = member.signatures?.length ? member.signatures : [member];
  for (const target of targets) {
    target.comment = (target.comment || member.comment)?.clone() || new Comment();
    if (help.example) {
      const source = await readFile(path.join(projectRoot, 'examples', help.example), 'utf8');
      target.comment.blockTags.push(new CommentTag('@example', [
        { kind: 'code', text: `\n\`\`\`ts\n${source.trim()}\n\`\`\`\n` },
      ]));
    }
    target.comment.blockTags.push(new CommentTag('@see', [
      { kind: 'text', text: `[${help.title}](${help.guide})` },
    ]));
  }
}
app.validate(project);
await app.generateOutputs(project);
if (app.logger.hasErrors()) throw new Error('TypeDoc generation failed');

const clients = sdk.clients.map((name) => {
  const reflection = project.children.find((child) => child.name === name);
  if (!reflection) throw new Error(`Missing exported client: ${name}`);
  return { name, methods: reflection.children.filter((child) => child.kind === ReflectionKind.Method).length };
});
const apiFiles = (await readdir(out, { recursive: true })).filter((name) => name.endsWith('.md')).sort();
if (apiFiles.length === 0) throw new Error('TypeDoc produced no Markdown reference pages');
for (const name of apiFiles) {
  const filename = path.join(out, name);
  const content = await readFile(filename, 'utf8');
  await writeFile(filename, `<!-- Generated from the SDK public exports. Edit source comments, not this file. -->\n\n${content}`);
}
await mkdir(path.join(projectRoot, 'docs/.vitepress'), { recursive: true });
await writeFile(path.join(projectRoot, 'docs/.vitepress/generated.json'), JSON.stringify({
  name: sdk.name,
  packageName: pkg.name,
  tutorial: sdk.tutorial,
  version: pkg.version,
  nodeVersion: pkg.engines?.node || null,
  license: pkg.license || null,
  exportedSymbols: project.children.length,
  referencePages: apiFiles.length,
  clients,
}, null, 2) + '\n');
const snippets = path.join(projectRoot, 'docs/.vitepress/snippets');
await mkdir(snippets, { recursive: true });
const nodeRequirement = pkg.engines?.node
  ? `Node.js version requirement: \`${pkg.engines.node}\`.`
  : '';
await writeFile(path.join(snippets, 'installation.md'), [
  '<!-- Generated from SDK package metadata. -->',
  '',
  [nodeRequirement, 'TypeScript definitions are included.'].filter(Boolean).join(' '),
  '',
  'Install the npm package with your preferred tool:',
  '',
  '::: code-group',
  ...[
    ['npm', `npm install ${pkg.name}`],
    ['pnpm', `pnpm add ${pkg.name}`],
    ['Yarn', `yarn add ${pkg.name}`],
    ['Bun', `bun add ${pkg.name}`],
    ['Deno', `deno add npm:${pkg.name}`],
  ].flatMap(([name, command]) => [
    `\`\`\`sh [${name}]`, command, '\`\`\`',
  ]),
  '\`\`\`text [Other]',
  `Package: ${pkg.name}`,
  `npm: https://www.npmjs.com/package/${pkg.name}`,
  '\`\`\`',
  ':::',
  '',
  'For other npm-compatible tools, use the same package from npm. Runtime-specific setup is covered below.',
  '',
  '<!--@include: @/.vitepress/shared/getting-started/environments.md-->',
  '',
].join('\n'));
console.log(`Generated ${apiFiles.length} reference pages from ${pkg.name}@${pkg.version}.`);

const metadata = JSON.parse(await readFile(path.join(ctx.docs, '.vitepress/generated.json'), 'utf8'));
const data = {
  sdk: { ...sdk, ...metadata, clients: sdk.clients }, siteUrl: ctx.site.href, originUrl: ctx.origin.href,
  indexable: ctx.indexable, catalogue: (await catalogue()).map(({ id, name, packageName, repository, website, tutorial }) =>
    ({ id, name, packageName, repository, website, tutorial })),
};
await writeFile(path.join(ctx.docs, '.vitepress/site.json'), JSON.stringify(data, null, 2));
const configImport = path.relative(path.join(ctx.docs, '.vitepress'), path.join(root, 'shared/config.mjs')).split(path.sep).join('/');
await writeFile(path.join(ctx.docs, '.vitepress/config.mts'), `import createConfig from '${configImport}';
import { fileURLToPath } from 'node:url';
import data from './site.json';
export default createConfig(data, fileURLToPath(new URL('../', import.meta.url)));
`);
await mkdir(path.join(ctx.docs, '.vitepress/theme'), { recursive: true });
const themeImport = path.relative(path.join(ctx.docs, '.vitepress/theme'), path.join(root, 'shared/theme/index.ts')).split(path.sep).join('/');
await writeFile(path.join(ctx.docs, '.vitepress/theme/index.ts'), `export { default } from '${themeImport}';\n`);
await validateIncludes(ctx.docs);
