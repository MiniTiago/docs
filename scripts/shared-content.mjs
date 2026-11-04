import { cp, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Keep fragments in VitePress's private config directory, outside its page scan.
export async function copySharedContent(root, docs) {
  await cp(path.join(root, 'shared/content'), path.join(docs, '.vitepress/shared'), { recursive: true });
}

// VitePress leaves missing include comments in the output without failing.
// Check the same relative and @/ paths before handing Markdown to VitePress.
export async function validateIncludes(docs) {
  const checked = new Set();
  async function visit(file, parents = []) {
    if (parents.includes(file)) throw new Error(`Circular Markdown include: ${[...parents, file].join(' -> ')}`);
    if (checked.has(file)) return;
    const content = await readFile(file, 'utf8');
    for (const match of content.matchAll(/<!--\s*@include:\s*(.*?)\s*-->/g)) {
      const target = match[1].replace(/(?:#[\w-]+)?(?:\{\d*,\d*\})?$/, '');
      if (!target) throw new Error(`Empty Markdown include in ${file}`);
      const included = target.startsWith('@')
        ? path.join(docs, target.slice(target[1] === '/' ? 2 : 1))
        : path.join(path.dirname(file), target);
      try {
        await visit(included, [...parents, file]);
      } catch (error) {
        throw new Error(`Invalid Markdown include "${match[1]}" in ${file}: ${error.message}`, { cause: error });
      }
    }
    checked.add(file);
  }
  for (const file of await readdir(docs, { recursive: true })) {
    if (file.endsWith('.md')) await visit(path.join(docs, file));
  }
}
