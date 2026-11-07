import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './context.mjs';
import { copySharedContent, validateIncludes } from './shared-content.mjs';

test('shared includes resolve privately and fail on missing or circular dependencies', async () => {
  await mkdir(path.join(root, 'tmp'), { recursive: true });
  const work = await mkdtemp(path.join(root, 'tmp/shared-content-test-'));
  try {
    const docs = path.join(work, 'docs');
    await copySharedContent(root, docs);
    const fragment = '.vitepress/shared/getting-started/runtime-compatibility.md';
    assert.match(await readFile(path.join(docs, fragment), 'utf8'), /Runtime compatibility/);
    await writeFile(path.join(docs, 'index.md'), `<!--@include: @/${fragment}-->`);
    await validateIncludes(docs);

    await writeFile(path.join(docs, 'index.md'), '<!--@include: ./nested.md-->');
    await assert.rejects(validateIncludes(docs), /Invalid Markdown include "\.\/nested.md".*ENOENT/);
    await writeFile(path.join(docs, 'nested.md'), `<!--@include: @/${fragment}-->`);
    await validateIncludes(docs);

    await writeFile(path.join(docs, 'nested.md'), '<!--@include: ./missing.md-->');
    await assert.rejects(validateIncludes(docs), /Invalid Markdown include "\.\/missing.md".*ENOENT/);
    await writeFile(path.join(docs, 'nested.md'), '<!--@include: ./index.md-->');
    await assert.rejects(validateIncludes(docs), /Circular Markdown include/);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});
