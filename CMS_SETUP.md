# CMS 설정 안내

기존 HTML/CSS/JS, Swiper, Fancybox 디자인을 유지했습니다. `before-cms-setup-20261002`는 작업 전 백업입니다.

## Pages CMS에서 할 일
1. https://app.pagescms.org 에서 GitHub 로그인 → GitHub App을 `yoonseoyys/portfolio`에 설치합니다.
2. 저장소와 `main`을 선택합니다. `.pages.yml`을 읽으면 Works / Detail Pages / Guestbook 메뉴가 표시됩니다.
3. Works에서 작품명, 카테고리, 연도, 설명, 이미지, 공개 여부, 노출 순서를 관리합니다. 작은 순서부터 표시됩니다. 대표 이미지는 기존 `images`에서 선택하거나 업로드합니다.
4. 테스트 작품을 비공개로 추가해 저장하고 GitHub의 `data/works.json`이 바뀌는지 확인하세요. 필요 없으면 삭제하세요.
5. Guestbook에서 이름·내용·작성일을 읽고 승인 여부를 변경하거나 삭제합니다. 목록은 최신순입니다. 방문자가 보낸 쪽지를 사이트 공개 목록으로 표시하지 않습니다.

`featured`는 관리할 수 있고 카드의 data-featured에 적용됩니다. 기존 사이트에는 별도 대표 작품 영역이 없어 새 영역을 만들지 않았습니다.

## 상세페이지 제작과 연결
GitHub에서 직접 상세 HTML을 만드세요. 예: `details/branding.html`. 기존 상세 HTML 내용은 수정하지 않습니다.
Pages CMS → Detail Pages → 새 항목 → 페이지명과 실제 HTML 경로 입력 → 저장합니다.
Works → 작품 선택 → 상세 페이지에서 해당 항목 선택 → 저장합니다. 경로는 `details/branding.html`처럼 저장소 기준 상대 경로입니다.
외부 사이트나 `../` 경로는 지원하지 않습니다. 기존 Fancybox iframe 방식을 유지합니다.
현재 저장소에는 `index.html` 외 상세 HTML이 없으며, 아래 기존 링크 7개는 파일이 없습니다:
- detail-video.html
- detail-motion.html
- detail-poster.html
- detail-branding.html
- detail-cardnews.html
- detail-brochure.html
- detail-leaflet.html
가짜 상세페이지나 메타데이터는 생성하지 않았습니다. 실제 파일을 만든 후 연결하세요.

## Cloudflare에서 할 일
Workers & Pages → Create application → Pages → Import existing Git repository → `yoonseoyys/portfolio` 선택합니다.

| 설정 | 값 |
| --- | --- |
| Production branch | main |
| Framework preset | None |
| Build command | exit 0 |
| Build output directory | . (저장소 루트) |
| Root directory | 비워 둠 |

GitHub 변경 → Cloudflare Pages 자동 배포입니다. `/functions/api/guestbook.js`가 `/api/guestbook`을 처리합니다. GitHub Pages는 서버 Function을 실행할 수 없으므로 쪽지 기능은 Cloudflare 사이트 주소에서만 작동합니다. 아직 Cloudflare 계정 연결·배포·실제 수신 테스트는 수행하지 않았습니다.

## Variables / Secrets
Cloudflare 프로젝트 → Settings → Variables and Secrets에 아래 값을 등록하고 다시 배포하세요.

| 이름 | 종류 | 입력값 |
| --- | --- | --- |
| GITHUB_TOKEN | Secret | portfolio 저장소만 선택한 Fine-grained PAT. Repository Contents: Read and write, 나머지는 기본 최소 권한. 토큰은 여기에만 저장합니다. |
| GITHUB_OWNER | Variable | yoonseoyys |
| GITHUB_REPO | Variable | portfolio |
| GITHUB_BRANCH | Variable | main |
| TURNSTILE_SITE_KEY | Variable | Cloudflare Turnstile 위젯의 공개 Site Key |
| TURNSTILE_SECRET_KEY | Secret | 같은 위젯의 Secret Key |

Turnstile에서 실제 Cloudflare 사이트 도메인을 허용하세요. 서버는 token, hostname, action=guestbook을 검증합니다. 설정이 없으면 운영에서 전송을 차단합니다. 키나 토큰을 채팅·GitHub 코드에 붙여넣지 마세요.
GitHub PAT 만료/권한 오류, Turnstile 오류, 저장 오류에는 성공 메시지가 표시되지 않으며 작성 내용이 유지됩니다.
추가로 Cloudflare 대시보드에서 `/api/guestbook`에 요청 속도 제한을 설정하는 것이 좋습니다. Turnstile과 honeypot이 적용됐으며 전역 rate limiter는 코드에 포함하지 않았습니다.

## 중요한 공개 저장 정책
쪽지는 **공개 방명록 데이터**입니다. 승인 전에도 공개 GitHub 저장소에서 읽을 수 있습니다. `approved=false`는 접근 제어가 아닙니다. 삭제해도 Git 기록에는 남습니다. 폼은 공개 저장 안내·동의를 받고 이름/닉네임과 메시지만 수집합니다. 비밀 쪽지를 받으려면 별도의 비공개 DB/저장소 구조로 변경해야 합니다.

## 로컬 테스트
Node 18 이상에서 `node --test tests/guestbook.test.mjs`를 실행하세요.
Cloudflare 로컬 Function 테스트는 `npx wrangler pages dev .`로 시작합니다. 로컬 `.dev.vars`에 `GUESTBOOK_DEV_MODE=true`를 넣으면 Turnstile/GitHub 없이 dry-run할 수 있습니다. 이 모드는 localhost에서만 작동하고 파일을 실제 저장하지 않습니다. 운영에는 설정하지 마세요.
실제 확인: Cloudflare 주소의 Contact → 공개 동의 → 스팸 검증 → 쪽지 보내기 → Pages CMS Guestbook에서 신규 항목 확인 → 승인/삭제 테스트.

## 사이트 코드 수정
`index.html`, `css/style.css`, `css/style.scss`, `js/script.js`는 기존 레이아웃/인터랙션입니다. `js/cms.js`는 Works 데이터 연결과 쪽지 제출을 담당합니다. SCSS 변경 시 CSS에도 반영해야 합니다.

공식 문서:
- https://pagescms.org/docs/configuration/content/
- https://pagescms.org/docs/configuration/fields/reference/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
