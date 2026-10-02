import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
const code = await readFile(new URL('../functions/api/guestbook.js', import.meta.url), 'utf8');
const { handleGet, handlePost } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
globalThis.crypto ??= webcrypto;
const env = { GITHUB_TOKEN: 'test-only', GITHUB_OWNER: 'yoonseoyys', GITHUB_REPO: 'portfolio', GITHUB_BRANCH: 'main', TURNSTILE_SITE_KEY: 'test-site', TURNSTILE_SECRET_KEY: 'test-secret' };
const payload = { name: '방문자', message: '작품 잘 봤습니다! <script>alert(1)</script>', consent: true, token: 'test-token' };
const request = (data = payload, origin = 'https://portfolio.example', url = 'https://portfolio.example/api/guestbook') => new Request(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
test('unconfigured production disables submission', async () => {
 assert.equal((await (handleGet({ request: request(), env: {} })).json()).available, false);
 assert.equal((await handlePost({ request: request(), env: {} })).status, 503);
});
test('rejects cross-origin, empty, overlong, honeypot and missing consent', async () => {
 assert.equal((await handlePost({ request: request(payload, 'https://other.example'), env })).status, 403);
 for (const change of [{ name: '' }, { message: ' ' }, { name: '가'.repeat(41) }, { message: '가'.repeat(501) }, { website: 'bot' }, { consent: false }, { token: '' }]) {
  assert.equal((await handlePost({ request: request({ ...payload, ...change }), env })).status, 400);
 }
});
test('local dry-run is explicit and performs no writes', async () => {
 const result = await handlePost({ request: request(payload, 'http://localhost', 'http://localhost/api/guestbook'), env: { GUESTBOOK_DEV_MODE: 'true' } });
 assert.deepEqual(await result.json(), { ok: true, development: true });
 assert.equal((await handlePost({ request: request(), env: { GUESTBOOK_DEV_MODE: 'true' } })).status, 503);
});
test('Turnstile failure or hostname mismatch prevents GitHub writes', async () => {
 const original = globalThis.fetch;
 try {
  for (const check of [{ success: false }, { success: true, hostname: 'wrong.example', action: 'guestbook' }, { success: true, hostname: 'portfolio.example', action: 'other' }]) {
   let calls = 0;
   globalThis.fetch = async () => { calls++; return Response.json(check); };
   assert.equal((await handlePost({ request: request(), env })).status, 403);
   assert.equal(calls, 1);
  }
 } finally { globalThis.fetch = original; }
});
test('valid message creates Unicode JSON, unapproved, using server credentials only', async () => {
 const original = globalThis.fetch; let saved;
 try {
  globalThis.fetch = async (url, options) => {
   if (url.includes('siteverify')) return Response.json({ success: true, hostname: 'portfolio.example', action: 'guestbook' });
   assert.ok(url.includes('/contents/content/guestbook/'));
   assert.equal(options.headers.Authorization, 'Bearer test-only');
   const body = JSON.parse(options.body);
   assert.equal(body.branch, 'main');
   saved = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
   return Response.json({}, { status: 201 });
  };
  const response = await handlePost({ request: request(), env });
  assert.equal(response.status, 201); assert.deepEqual(await response.json(), { ok: true });
  assert.equal(saved.name, payload.name); assert.equal(saved.message, payload.message); assert.equal(saved.approved, false);
  assert.ok(!('email' in saved)); assert.ok(Date.parse(saved.createdAt));
 } finally { globalThis.fetch = original; }
});
test('GitHub failure never reports success', async () => {
 const original = globalThis.fetch;
 try {
  globalThis.fetch = async url => url.includes('siteverify') ? Response.json({ success: true, hostname: 'portfolio.example', action: 'guestbook' }) : Response.json({}, { status: 403 });
  const response = await handlePost({ request: request(), env });
  assert.equal(response.status, 502); assert.ok((await response.json()).error);
 } finally { globalThis.fetch = original; }
});
