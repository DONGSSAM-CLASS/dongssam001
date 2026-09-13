# 인수인계 — 동쌤(김동은) 개인 웹페이지

저장소: `dongssam-class/dongssam001` / 브랜치: `main`
경로: **`dongssam-site/index.html`** (단일 파일 정적 사이트)
기준 커밋: `179561d` — "feat: 동쌤(김동은) 개인 웹페이지 추가"

---

## 1. 이 사이트가 무엇인가

서울 번동중학교 역사 교사이자 에듀테크 교사 연구회(에크연) 대표인 **동쌤(김동은)** 의 개인 웹페이지.
목적은 우선순위 순으로 다음 세 가지다.

1. 직접 개발한 역사·에듀테크 웹앱을 **누적 전시**하고 교실에서 **QR로 즉시 배포**
2. 개인·기관의 **강의/협업 요청**을 자연스럽게 유도하고 안내
3. 운영 중인 SNS 채널 연결

원페이지 스크롤 + 상단 고정 내비. 전부 한국어. `<html lang="ko" data-theme="dark">`.

---

## 2. 현재 상태 (전 구간 구현 완료, 실브라우저 검증 통과)

| 섹션 | 내용 | 상태 |
| --- | --- | --- |
| ① Hero | 이름·태그라인·소속, CTA 2개, 배경 클레이 블롭 3개 | ✅ |
| ② 소개 | 정체성 3문단 + 숫자 카드 3개 | ✅ |
| ③ 이력 | 티끌 프로필 링크 카드 1개 + 배지 3줄 요약 | ✅ |
| ④ 개발 자료실 | 웹앱 7개 카드 그리드 + 분류 필터 칩 7개 (전부 자동 생성) | ✅ |
| ⑤ 연구회 | 가로형 대형 배너 카드 | ✅ |
| ⑥ 전면 QR 모달 | 어느 QR 버튼에서든 열림, 교실 송출용 대형 QR | ✅ |
| ⑦ 운영 채널 | 블로그·인스타·유튜브 카드 3개 | ✅ |
| ⑧ 협업 요청 | 분야 카드 4개 + 체크리스트 5항목 + mailto 템플릿 + 주소 복사 | ✅ |
| ⑨ 푸터 | 저작권·텍스트 링크·맨 위로 버튼 | ✅ |

---

## 3. 기술 스택 (이 조합을 바꾸지 말 것 — 이유 포함)

빌드 도구·프레임워크·번들러 **없음**. CDN만 사용. `index.html` 한 파일에 HTML + CSS + JS 인라인.

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<link href="https://cdn.jsdelivr.net/npm/daisyui@5/daisyui.css" rel="stylesheet" />
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
<!-- Pretendard: cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9 -->
```

### ⚠️ daisyUI v4로 내리지 말 것

작업 중 "밋밋하면 daisyUI v4 CDN(`daisyui@4.12.14/dist/full.min.css`) + Tailwind Play CDN v3로 바꿔보라"는
지시가 있었으나, **실제 패키지를 받아 확인한 결과 그 경로는 존재하지 않는다.**
`daisyui@4.12.14` 패키지의 `dist/` 에는 `full.css` 만 있고 `full.min.css` 는 없다 → 404.

반면 **`daisyui@5/daisyui.css` 는 순수 CSS 번들이라 `<link>` 만으로 정상 동작한다.**
확인된 사실:

- `[data-theme=dark]` 토큰 포함 (`--color-base-100: oklch(25.33% .016 252.42)` 등)
- `.btn` `.card` `.badge` `.modal` `.navbar` `.divider` `.toast` 전부 포함
- 내부적으로 `@layer base` / `@layer daisyui` / `@layer utilities` 로 감싸져 있음

**마지막 항목이 이 사이트 스타일링의 핵심 원리다.** 커스텀 클레이 CSS는 `@layer` 밖(unlayered)에 작성했고,
CSS 캐스케이드 레이어 규칙상 **unlayered 스타일이 layered 스타일을 항상 이긴다.**
따라서 daisyUI 버전 궁합이 어긋나도 클레이 디자인이 무너지지 않는다.

→ 새 CSS를 추가할 때도 **절대 `@layer` 안에 넣지 말 것.** 넣는 순간 daisyUI에 밀린다.

### daisyUI 컴포넌트와 클레이의 병용 방식

마크업에 `class="btn cbtn"`, `class="card clay"`, `class="badge cbadge"` 처럼 **둘을 함께** 붙였다.
daisyUI가 구조(display, flex 방향)를 잡고 클레이 CSS가 표면(배경·그림자·반경)을 덮는다.

다만 daisyUI가 `height`를 CSS 변수로 강제하므로, 아래 방어 선언이 이미 들어가 있다. **지우지 말 것.**

- `.cbtn { height:auto; width:auto }`
- `.cbadge { height:auto }`
- `.fchip { height:auto }`
- `.ctoast { right:auto; inset-inline-end:auto }` (daisyUI `.toast` 가 오른쪽에 붙이는 것 상쇄)
- `.qrbox { max-width: ... }` (daisyUI `.modal-box` 의 `max-width:32rem` 상쇄)

---

## 4. 디자인 시스템 — 입체 클레이(Claymorphism) × 다크

**납작한 플랫 카드가 하나도 없어야 한다.** 이것이 이 사이트의 유일한 시각적 원칙이다.

### 색 토큰 (`:root`)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--bg` | `#151a24` | 바탕 (daisyUI dark보다 한 단계 깊은 네이비) |
| `--clay-a` / `--clay-b` | `#283242` / `#1c232f` | 카드 표면 그라디언트 양 끝 |
| `--gold` / `--gold-2` | `#f0b429` / `#ffc94d` | 포인트 — CTA·배지·아이콘에만 절제해서 |
| `--teal` | `#2E6E8E` | 보조 포인트 — 분류 태그 |
| `--txt` / `--txt-dim` | `#e7ecf3` / `#a8b3c4` | 본문 / 보조 텍스트 |
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | 전 전환 공통 |

### 클레이 유틸

- `.clay` — 반경 28px, 기본 카드
- `.clay-sm` — 반경 18px, 그림자 약하게
- `.clay-lg` — 반경 40px, 그림자 강하게 (이력 카드·연구회 배너·QR 모달·협업 연락처)
- `.clay-hover` — `translateY(-4px)` + 그림자 확장, `.25s var(--ease)`

그림자 공식(4겹): 바깥 어두운 그림자 + 바깥 밝은 하이라이트 + `inset` 밝은 면 + `inset` 어두운 면.
**1px 테두리에 의존하지 말고 그림자로 입체감을 낼 것.**

### 버튼

- `.cbtn` 기본은 볼록(바깥 그림자), `:active` 에서 `inset` 위주로 전환 → 실제로 눌리는 느낌
- `.cbtn-gold` 골드 CTA, `.cbtn-sm` / `.cbtn-lg` 크기 변형
- 모든 버튼 최소 높이 44px (터치 영역)

### 그 외

- 아이콘 배지: `.chip-icon` — 56px 원형 클레이 칩 + 골드 Lucide 아이콘
- 배경 노이즈: `body::before` 에 인라인 SVG `feTurbulence`, `opacity:.03`
- 애니메이션은 **스크롤 페이드인(`.reveal`)과 호버뿐.** `prefers-reduced-motion` 에서 전부 끔
- 본문 16.5px(≥768px에서 17px), 줄간격 1.75
- 섹션 제목 위에 작은 골드 라벨(`.label-gold`, 대문자 + letter-spacing)

---

## 5. 확장 지점 — `PROJECTS` 배열 하나로 전부 자동 생성

`<script>` 맨 위의 `PROJECTS` 배열이 **유일한 데이터 소스**다.
카드 그리드 · 분류 필터 칩 · QR 모달이 전부 여기서 파생된다.

```js
const PROJECTS = [
  { title:"제목", url:"https://...", desc:"한 줄 설명", category:"역사 게임", icon:"gamepad-2" },
];
```

**객체 한 줄만 추가하면** 카드가 생기고, 새로운 `category` 면 필터 칩도 자동으로 늘어난다.
필터 칩은 `["전체", ...new Set(PROJECTS.map(p => p.category))]` 로 만들어지므로 **칩 목록을 수동으로 건드릴 필요가 없다.**

`icon` 은 [Lucide](https://lucide.dev) 아이콘 이름(케밥케이스).

### 현재 등록된 7개

| 제목 | 분류 | 아이콘 |
| --- | --- | --- |
| 중·고등학생을 위한 세계사 사료 탐구 교실 | 사료 탐구 | `scroll-text` |
| 아고라의 딜레마 | 의사결정 | `scale` |
| 독도네컷 · 독도의 날 인생네컷 | 체험부스 | `camera` |
| History Globe · 히스토리 글로브 | 수업 도구 | `globe` |
| 역사 수능 기출 탐색 | 학습 지원 | `book-open-check` |
| 아직 오지 않은 광복 · 한국광복군 역사 추리 게임 | 역사 게임 | `search-check` |
| 『Let's KOREA TIME』 : 중학생을 위한 고려로의 시간여행 | 역사 게임 | `hourglass` |

### ⚠️ 알려진 불일치 — 반드시 처리할 것

소개 섹션 숫자 카드는 **"공개 웹앱 8"** 이라고 표시하는데, `PROJECTS` 배열에는 **7개**만 있다.
원 작업 지시서가 숫자 8과 자료 7개를 함께 명시했기 때문에 지시대로 두었다.
**둘 중 하나로 정리해야 한다:**

- (A) 8번째 웹앱을 `PROJECTS` 에 추가한다 — 동쌤에게 누락된 앱이 있는지 확인
- (B) 숫자 카드를 7로 고친다 (`index.html` 약 351행 근처)

(A)를 택하면 **숫자 카드를 `PROJECTS.length` 로 자동 계산하도록** 바꾸는 것이 낫다. 다시 어긋나지 않는다.

---

## 6. QR 모달 동작 (교실 송출이 핵심 용도)

`data-qr-url` / `data-qr-title` 속성이 붙은 버튼이면 **무엇이든** 모달을 연다
(자료실 카드 7개 + 연구회 배너 1개). 이벤트는 `document` 위임이라 동적 카드도 자동 지원.

### 크기 규칙

"뷰포트 짧은 변의 60% 이상, 최소 320px" 이 목표. 단 모달 안에 들어가야 하므로
`qrSize()` 가 **원하는 크기와 실제 가용 폭 중 작은 값**을 고른다.

실측 결과:

| 뷰포트 | QR 크기 | 짧은 변의 60% |
| --- | --- | --- |
| 1920×1080 | **648px** | 648 ✅ |
| 1280×900 | **540px** | 540 ✅ |
| 768×1024 | **461px** | 461 ✅ |
| 390×844 | 281px | 234 (기기 폭 한계) |
| 360×740 | 251px | 216 (기기 폭 한계) |

교실 TV·빔프로젝터(데스크톱 해상도)에서는 요구 조건을 정확히 충족한다.
폰에서는 화면 폭이 물리적 상한이라 320px에 못 미치지만, 폰은 송출 용도가 아니므로 문제 없다.

### 그 외 동작

- 닫기: X 버튼 / 배경 클릭 / ESC — 3가지 모두 동작
- 열려 있는 동안 `body.noscroll` 로 배경 스크롤 잠금
- 포커스 트랩(Tab/Shift+Tab 순환), 닫을 때 원래 버튼으로 포커스 복귀
- QR은 흰 배경 + 여백(quiet zone)을 둔 클레이 프레임 안에 배치

### ⚠️ qrcode.js 의 함정

qrcodejs는 `<canvas>` 와 `<img>` **둘 다** 만든 뒤 **canvas를 `display:none` 으로 숨기고 img를 보여준다.**
따라서 QR 크기를 측정·조작할 때 **canvas가 아니라 img를 잡아야 한다.**
`querySelector('#qr-target img')` 를 쓸 것. (개발 중 canvas를 재다 0px이 나와 헤맨 지점)

---

## 7. 접근성·품질 (이미 반영된 것)

- `localStorage` / `sessionStorage` **사용 안 함** (요구사항)
- 시맨틱 태그: `header` / `nav` / `main` / `section` / `footer`
- 모든 아이콘 버튼에 `aria-label`
- 외부 링크 전부 `target="_blank" rel="noopener noreferrer"`
- 필터 칩은 `aria-pressed` 로 상태 전달, 키보드 Enter 동작 확인 완료
- 포커스 링: `outline: 3px solid var(--gold-2)`, `outline-offset: 3px`
- 360px에서 가로 스크롤 없음, 터치 영역 44px 이상
- `prefers-reduced-motion: reduce` 에서 모든 transition·animation 차단
- Open Graph: `og:title` / `og:description` / `og:type` / `og:locale=ko_KR`
- 파비콘은 인라인 data URI (외부 요청 0)

### CDN 로드 실패 폴백

외부 스크립트가 전부 막힌 상태로 테스트했을 때:
카드 7개 정상 렌더 · 링크 정상 · 모달 열림 · URL 텍스트 노출 · 링크 복사 동작 · **JS 에러 0건**.
QR 이미지만 빠지고 나머지는 전부 살아 있다 (`qrFrame.hidden` 처리).

---

## 8. 검증 방법

로컬 서버:

```bash
cd dongssam-site
python3 -m http.server 8080   # http://localhost:8080
```

`verify/` 폴더에 개발 중 사용한 Playwright 스크립트가 들어 있다.

- `verify/check.mjs` — 렌더링·필터·QR·모달·콘솔 에러 종합 점검
- `verify/qrsize.mjs` — 5개 뷰포트에서 QR 실측
- `verify/fallback.mjs` — 외부 CDN 전부 차단 시 폴백 확인

이 저장소 환경은 CDN 아웃바운드가 막혀 있어, 검증 시 `npm pack` 으로 같은 패키지를 받아
`lib/` 로 경로 치환한 사본을 띄워 테스트했다. 인터넷이 되는 환경이라면 그대로 `index.html` 을 열면 된다.

Chromium 실행 경로가 필요하면:
`chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })`

---

## 9. 저장소 안에서의 위치 — 주의

이 저장소 루트는 **History Globe (Vite + React + TS) 앱**이다.
루트 `index.html` 은 그 앱의 Vite 진입점이므로 **덮어쓰면 History Globe가 깨진다.**
그래서 개인 웹페이지를 `dongssam-site/` 하위에 두었다.

또한 루트 `firebase.json` 은

- `public/` 을 배포 대상으로 하고
- CSP `script-src 'self'` / `style-src 'self' 'unsafe-inline'` / `font-src 'self'` 로 **외부 CDN을 전부 차단**한다

이 설정 그대로 개인 웹페이지를 올리면 Tailwind·daisyUI·Lucide·QR·Pretendard가 전부 막혀
스타일이 날아간다. **별도 Hosting 사이트(또는 별도 프로젝트)로 배포해야 한다.**

---

## 10. 파일 목록

```
dongssam-site/
  index.html      ← 사이트 전체 (768행, HTML+CSS+JS 인라인)
  README.md       ← 로컬 실행·자료 추가·배포 요약
HANDOFF.md        ← 이 문서
CODEX_PROMPT.md   ← Codex에 붙여넣을 프롬프트
screenshots/      ← 1280px(7장) / 360px(3장) 실제 렌더 결과
verify/           ← Playwright 검증 스크립트 3종 + 실행 안내
```
