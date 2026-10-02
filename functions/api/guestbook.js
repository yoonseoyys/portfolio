const reply = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const local = (request) => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);
const configured = (env) => Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO && env.GITHUB_BRANCH && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
export function handleGet({ request, env }) {
  return reply({ available: configured(env) || (local(request) && env.GUESTBOOK_DEV_MODE === 'true'), siteKey: env.TURNSTILE_SITE_KEY || '', publicStorage: true });
}
export async function handlePost({ request, env }) {
  try {
    const url = new URL(request.url);
    if (request.headers.get('Origin') !== url.origin) return reply({ error: '허용되지 않은 요청입니다.' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'JSON 요청이 필요합니다.' }, 415);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 8192) return reply({ error: '입력 내용이 너무 큽니다.' }, 413);
    let data;
    try { data = JSON.parse(raw); } catch { return reply({ error: '잘못된 요청입니다.' }, 400); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return reply({ error: '잘못된 요청입니다.' }, 400);
    if (data.website) return reply({ error: '요청을 처리할 수 없습니다.' }, 400);
    if (data.consent !== true) return reply({ error: '공개 저장 동의가 필요합니다.' }, 400);
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (!name || !message || [...name].length > 40 || [...message].length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(name + message)) return reply({ error: '이름은 40자, 내용은 500자 이내로 입력해주세요.' }, 400);
    // Local-only dry-run deliberately performs no GitHub write.
    if (local(request) && env.GUESTBOOK_DEV_MODE === 'true') return reply({ ok: true, development: true });
    if (!configured(env)) return reply({ error: '쪽지 전송 설정이 아직 완료되지 않았습니다.' }, 503);
    if (typeof data.token !== 'string' || !data.token || data.token.length > 2048) return reply({ error: '스팸 방지 확인을 완료해주세요.' }, 400);
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: data.token, remoteip: request.headers.get('CF-Connecting-IP') || '' }), signal: AbortSignal.timeout(10000)
    });
    if (!verification.ok) return reply({ error: '스팸 방지 확인을 다시 시도해주세요.' }, 502);
    const check = await verification.json();
    if (!check.success || check.hostname !== url.hostname || check.action !== 'guestbook') return reply({ error: '스팸 방지 확인에 실패했습니다. 다시 시도해주세요.' }, 403);
    const createdAt = new Date().toISOString();
    const path = `content/guestbook/${createdAt.replace(/[:.]/g, '-')}-${crypto.randomUUID()}.json`;
    // JSON stores plain text; no visitor HTML is rendered by this site.
    const bytes = new TextEncoder().encode(JSON.stringify({ name, message, createdAt, approved: false }, null, 2) + '\n');
    const content = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
    const result = await fetch(`https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${path}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'portfolio-guestbook', 'X-GitHub-Api-Version': '2026-03-10' },
      body: JSON.stringify({ message: 'Add guestbook message', content, branch: env.GITHUB_BRANCH }), signal: AbortSignal.timeout(15000)
    });
    if (!result.ok) return reply({ error: '저장하지 못했습니다. 잠시 후 다시 시도해주세요.' }, 502);
    return reply({ ok: true }, 201);
  } catch { return reply({ error: '연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.' }, 502); }
}
export function onRequest(context) {
  if (context.request.method === 'GET') return handleGet(context);
  if (context.request.method === 'POST') return handlePost(context);
  return reply({ error: '허용되지 않은 메서드입니다.' }, 405);
}
