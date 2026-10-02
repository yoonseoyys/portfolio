import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../js/cms.js', import.meta.url), 'utf8');
const context = vm.createContext({ document: { baseURI: 'https://example.com/portfolio/index.html' }, URL });
vm.runInContext(source.slice(0, source.indexOf('async function loadWorks')), context);
test('CMS paths preserve subdirectory and reject executable/external detail URLs', () => {
 assert.equal(context.workURL('details/branding.html'), 'https://example.com/portfolio/details/branding.html');
 assert.equal(context.workURL('/images/test.png', true), 'https://example.com/portfolio/images/test.png');
 for (const bad of ['javascript:alert(1)', '//evil.example', '../secret', '%2e%2e/secret', 'https://evil.example/detail.html']) assert.equal(context.workURL(bad), null);
 assert.equal(context.workURL('https://picsum.photos/900/620', true), 'https://picsum.photos/900/620');
});
