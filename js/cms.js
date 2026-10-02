// Keep repository-relative URLs working on both Pages root and GitHub /portfolio/.
function workURL(value, image = false) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const clean = value.trim();
  if (/^https:\/\//i.test(clean)) return image ? clean : null;
  if (/^(?:[a-z]+:|\/\/)/i.test(clean)) return null;
  const parts = clean.replace(/^\.\//, '').replace(/^\//, '').split('/');
  try { if (parts.some(part => decodeURIComponent(part) === '..')) return null; } catch { return null; }
  return new URL(parts.join('/'), new URL('./', document.baseURI)).href;
}
async function loadWorks() {
  try {
    const response = await fetch(new URL('data/works.json', document.baseURI), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Works data unavailable');
    const works = await response.json();
    if (!Array.isArray(works)) throw new Error('Works must be an array');
    const list = document.querySelector('#works_inner .list');
    const template = list.querySelector('.item');
    if (!template) return;
    const fragment = document.createDocumentFragment();
    works.filter(work => work.published === true).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)).forEach((work, i) => {
      const item = template.cloneNode(true);
      const card = item.querySelector('.work-card');
      const href = workURL(work.detailPage);
      if (href) card.href = href;
      else { card.removeAttribute('href'); card.removeAttribute('data-fancybox'); card.removeAttribute('data-type'); }
      const img = item.querySelector('img');
      const thumbnail = workURL(work.thumbnail, true);
      if (thumbnail) img.src = thumbnail; else img.removeAttribute('src');
      img.alt = String(work.title || '');
      item.querySelector('.index-num').textContent = `No. ${String(i + 1).padStart(2, '0')}`;
      item.querySelector('.category-stamp').textContent = String(work.category || '');
      item.querySelector('.project-title').textContent = String(work.title || '');
      item.querySelector('.project-desc').textContent = String(work.description || '');
      if (work.featured) item.dataset.featured = 'true';
      fragment.append(item);
    });
    list.replaceChildren(fragment);
    works_swiper.update();
    works_swiper.slideTo(0, 0);
  } catch (error) { console.warn('CMS 작품을 불러오지 못해 기존 작품을 표시합니다.'); }
}
loadWorks();

const guestbookForm = document.querySelector('#contact-form');
const guestbookNote = document.querySelector('#contact-form-note');
const guestbookButton = guestbookForm.querySelector('button[type="submit"]');
let guestbookReady = false;
let widgetId = null;
let needsTurnstile = false;
async function initializeGuestbook() {
  try {
    const response = await fetch('/api/guestbook', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unavailable');
    const config = await response.json();
    if (!config.available) throw new Error('Not configured');
    if (config.siteKey) {
      needsTurnstile = true;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.onload = resolve; script.onerror = reject;
        document.head.append(script);
      });
      widgetId = window.turnstile.render('#contact-turnstile', { sitekey: config.siteKey, action: 'guestbook', 'error-callback': () => { guestbookNote.textContent = '스팸 방지 확인을 다시 시도해주세요.'; } });
    }
    guestbookReady = true; guestbookButton.disabled = false;
    guestbookNote.textContent = '쪽지를 작성해 보내주세요.';
  } catch { guestbookNote.textContent = '쪽지 전송은 아직 준비 중입니다. Cloudflare 배포 및 설정 후 이용할 수 있습니다.'; }
}
initializeGuestbook();
guestbookForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guestbookReady || guestbookButton.disabled) return;
  const data = new FormData(guestbookForm);
  const token = needsTurnstile ? window.turnstile.getResponse(widgetId) : '';
  if (needsTurnstile && !token) { guestbookNote.textContent = '스팸 방지 확인을 완료해주세요.'; return; }
  guestbookButton.disabled = true;
  guestbookNote.textContent = '쪽지를 저장하고 있습니다…';
  try {
    const response = await fetch('/api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.get('name'), message: data.get('message'), website: data.get('website'), consent: data.get('consent') === 'on', token }), signal: AbortSignal.timeout(30000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.error || '저장하지 못했습니다. 다시 시도해주세요.');
    guestbookForm.reset();
    guestbookNote.textContent = result.development ? '개발 테스트 완료: 실제로 저장하지 않았습니다.' : '쪽지가 저장되었습니다. 감사합니다!';
  } catch (error) { guestbookNote.textContent = error.name === 'TimeoutError' ? '응답이 늦어지고 있습니다. 중복 전송 전 관리자에게 확인해주세요.' : (error.message || '전송하지 못했습니다. 다시 시도해주세요.'); }
  finally { guestbookButton.disabled = false; if (widgetId !== null) window.turnstile.reset(widgetId); }
});
guestbookForm.addEventListener('pointerdown', event => event.stopPropagation());
document.querySelector('#contact').addEventListener('wheel', event => {
  const section = event.currentTarget;
  if (event.target.closest('.contact-form') || (event.deltaY < 0 && section.scrollTop > 1) || (event.deltaY > 0 && section.scrollTop + section.clientHeight < section.scrollHeight - 1)) event.stopPropagation();
}, { passive: true });
