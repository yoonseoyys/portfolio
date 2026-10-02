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

// Native validation runs before submit; the visitor sends the message in their mail app.
const contactForm = document.querySelector('#contact-form');
contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = data.get('name').trim();
  const email = data.get('email').trim();
  const message = data.get('message').trim();
  if (!name || !message) {
    document.querySelector('#contact-form-note').textContent = '이름과 메시지에 내용을 입력해주세요.';
    return;
  }
  const subject = `[포트폴리오 문의] ${name.replace(/[\r\n]/g, ' ')}`;
  const body = `이름: ${name}\n회신 이메일: ${email}\n\n${message}`;
  document.querySelector('#contact-mail-app').href = `mailto:yoonseo0915@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector('#contact-draft').value = `받는 사람: yoonseo0915@naver.com\n제목: ${subject}\n\n${body}`;
  const options = document.querySelector('#contact-send-options');
  options.hidden = false;
  options.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  document.querySelector('#contact-mail-app').focus({ preventScroll: true });
  document.querySelector('#contact-form-note').textContent = '메일을 아직 전송하지 않았습니다. 아래에서 전송 방법을 선택해주세요.';
});
// Allow editing and scrolling within Contact without triggering the page slider.
contactForm.addEventListener('pointerdown', (event) => event.stopPropagation());
document.querySelector('#contact').addEventListener('wheel', (event) => {
  const section = event.currentTarget;
  const atTop = section.scrollTop <= 1;
  const atBottom = section.scrollTop + section.clientHeight >= section.scrollHeight - 1;
  if (event.target.closest('.contact-form') || (event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) event.stopPropagation();
}, { passive: true });

// Clipboard errors leave a selectable draft available for manual copying.
document.querySelector('#contact-copy-draft').addEventListener('click', async () => {
  const draft = document.querySelector('#contact-draft');
  const note = document.querySelector('#contact-form-note');
  try {
    await navigator.clipboard.writeText(draft.value);
    note.textContent = '메일 내용을 복사했습니다. 웹메일에서 받는 사람·제목·본문을 입력한 후 전송해주세요.';
  } catch {
    draft.focus();
    draft.select();
    note.textContent = '복사할 내용을 선택했습니다. Ctrl+C 또는 길게 눌러 복사해주세요.';
  }
});
