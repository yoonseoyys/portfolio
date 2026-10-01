// 세 섹션의 링크를 일반 스크롤로 연결합니다.
document.querySelectorAll('.frame-one a[href^="#"]').forEach(link => {
 link.addEventListener('click', event => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 });
});
const frameOne = document.querySelector('.frame-one');
new ResizeObserver(() => {
 const width = frameOne.clientWidth;
 frameOne.style.setProperty('--cursor-scale', width <= 760 ? width * .12 * .77 / 24 : width / 1920 * 93.833 / 24);
}).observe(frameOne);
