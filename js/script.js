const works_swiper = new Swiper('#works_inner', {
  wrapperClass:"list", //슬라이드를 감싸는 영역의 클래스
  slideClass:"item", //각 슬라이드영역의 클래스
  slidesPerView: "auto",
  spaceBetween: 80,
  speed: 900,
  nested:true, //내부 swiper에게 설정

  // [3] 마우스 휠 최적화
  mousewheel: {
    forceToAxis: true,
    enabled: true,
    //forceToAxis: true,    // 가로 휠과 상하 풀페이지 스크롤 간섭 방지
    sensitivity: 0.8,     // 휠 한 번에 훅 넘어가지 않도록 감도 조절 (기본값 1보다 약간 낮게)
    releaseOnEdges: true, // 첫 슬라이드나 끝 슬라이드 도달 시 상/하 풀페이지로 휠 전달
  },

});




Fancybox.bind("[data-fancybox]", {
  // 옵션 (필요 시)
});
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
