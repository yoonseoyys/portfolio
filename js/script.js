const gnb_swiper = new Swiper('#gnb', {
  wrapperClass:"menu", //슬라이드를 감싸는 영역의 클래스
  slideClass:"btn", //각 슬라이드영역의 클래스
  slidesPerView:"auto", //버튼의 갯수만큼 설정
});

const wrap_swiper = new Swiper('#wrap', {
  wrapperClass:"container", //슬라이드를 감싸는 영역의 클래스
  slideClass:"section", //각 슬라이드영역의 클래스
  direction: "vertical",
  speed: 600,
  thumbs:{
    swiper:gnb_swiper,
    slideThumbActiveClass:"active",
  },
  navigation: {
    nextEl: ".next",
    prevEl: ".prev"
  },
  pagination: {
    el: ".pager",
    clickable: true,
    bulletActiveClass:'active',
  },
  mousewheel: true
});


const works_swiper = new Swiper('#works_inner', {
  wrapperClass:"list", //슬라이드를 감싸는 영역의 클래스
  slideClass:"item", //각 슬라이드영역의 클래스
  slidesPerView: "auto",
  spaceBetween: 80,
  speed: 900,
  nested:true, //내부 swiper에게 설정

  // [3] 마우스 휠 최적화
  mousewheel: {
    enabled: true,
    //forceToAxis: true,    // 가로 휠과 상하 풀페이지 스크롤 간섭 방지
    sensitivity: 0.8,     // 휠 한 번에 훅 넘어가지 않도록 감도 조절 (기본값 1보다 약간 낮게)
    releaseOnEdges: true, // 첫 슬라이드나 끝 슬라이드 도달 시 상/하 풀페이지로 휠 전달
  },

});




Fancybox.bind("[data-fancybox]", {
  // 옵션 (필요 시)
});
// About 영역의 내부 스크롤과 전체 페이지 Swiper 이동을 함께 지원합니다.
const aboutScroller = document.querySelector('.about-scroll');
aboutScroller.addEventListener('wheel', (event) => {
  const atTop = aboutScroller.scrollTop <= 1;
  const atBottom = aboutScroller.scrollTop + aboutScroller.clientHeight >= aboutScroller.scrollHeight - 1;
  if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) {
    event.stopPropagation();
  }
}, { passive: true });
// 모바일에서는 소개 내용을 손가락으로 스크롤하고 상단 메뉴로 페이지를 이동합니다.
aboutScroller.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch') event.stopPropagation();
});
document.querySelectorAll('.about-nav a:not([data-about-contact])').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    const offset = target.getBoundingClientRect().top - aboutScroller.getBoundingClientRect().top + aboutScroller.scrollTop - 24;
    aboutScroller.scrollTo({ top: offset, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
});
document.querySelectorAll('[data-about-contact]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    wrap_swiper.slideTo(3);
  });
});

// 메인의 폴더를 클릭하면 기존 Works 슬라이드로 이동합니다.
document.querySelector('.main-folder-link').addEventListener('click', (event) => {
 event.preventDefault();
 wrap_swiper.slideTo(2);
});
