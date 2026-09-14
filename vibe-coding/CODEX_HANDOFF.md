# 인수인계 — 바로 써먹는 바이브코딩 첫 걸음 [기초편]

교사 연수용 **정적 웹페이지 1개**입니다. 코딩 경험이 전혀 없는 현직 교사가 60분 안에
자신만의 웹앱을 만들고 Firebase Hosting에 배포해 QR로 학생에게 공유하기까지 끝내도록
안내하는 워크북 형태의 페이지입니다.

- 제작·운영: 동쌤(김동은) — 에듀테크 교사 연구회 대표 / 번동중학교 역사교사
- 저장소: `dongssam-class/dongssam001`, 브랜치 `main`
- 최초 구현 커밋: `4c13c04` (2026-09-14)

---

## 1. 현재 상태 (구현 완료 · 브라우저 검증 통과)

| 구분 | 내용 | 상태 |
| --- | --- | --- |
| 구조 | 폴더 구조 · `firebase.json` · README | ✅ |
| 메인 | 내비게이션 · 히어로 · STEP 0 도구 선택 · 7단계 실습 코스 | ✅ |
| 기능 | 도구 전환 · 프롬프트 빌더 · 복사 버튼 · 진도 저장 · QR · 메일 도우미 | ✅ |
| 서브 | 동쌤 소개 · 웹앱 갤러리 7종 · 에크연 · SNS · 협업 문의 · 푸터 | ✅ |
| 검증 | Chromium 1280px/375px 실행, 콘솔 에러 0건, 가로 스크롤 0px | ✅ |
| 접근성 | h1 1개, 라벨 없는 버튼 0개, `target="_blank"` 전부 `rel="noopener"` | ✅ |
| 인쇄 | `@media print` — 내비·서브·복사 버튼 숨김, 아코디언 펼침 | ✅ |
| **미확인** | **갤러리 7개 + 에크연의 실제 페이지 제목** | ⚠️ **아래 5장 참조** |
| **미확인** | **qrcodejs 실제 렌더링 (CDN 차단 환경이라 스텁으로만 검증)** | ⚠️ |

---

## 2. 기술 스택 (제약 조건 — 반드시 지킬 것)

- **단일 정적 사이트.** 빌드 도구·번들러·npm 패키지 **사용 금지**. CDN만 사용합니다.
- CDN 구성 (로드 순서 중요):
  1. daisyUI `4.12.24` — **Tailwind CDN 스크립트보다 먼저** 로드
  2. Pretendard Variable `v1.3.9`
  3. Tailwind CSS (`cdn.tailwindcss.com`)
  4. `assets/css/custom.css`
  5. 본문 맨 아래: Lucide → qrcodejs → `assets/js/app.js`
- **테마 `data-theme="cupcake"` 고정.** 다크모드 토글 만들지 말 것.
- 아이콘은 Lucide (`lucide.createIcons()`). **이모지 남발 금지.**
- QR은 클라이언트 라이브러리(qrcodejs)로만 생성. **외부 QR 생성 API 호출 금지**.
- 상태는 `localStorage`만 사용. 서버·로그인·수집·분석·광고 스크립트 **일절 없음**.
- 본문 최소 16px, 명령어 블록 17~18px(데스크톱 18px). 프로젝터 뒷자리 기준.
- 반응형: 375px → 태블릿 → 데스크톱 모두 정상 동작해야 함.

---

## 3. 폴더 구조

```
vibe-coding/                  ← 이 사이트의 루트 (독립 사이트)
  firebase.json               ← public 디렉터리, SPA 아님, 캐시 헤더
  README.md                   ← 배포 3단계 요약
  CODEX_HANDOFF.md            ← 이 문서
  CODEX_PROMPT.md             ← Codex 입력용 프롬프트
  public/
    index.html                ← 전체 마크업 (약 1,550줄)
    assets/css/custom.css     ← cupcake 위에 얹는 커스텀 (약 250줄)
    assets/js/app.js          ← 모든 인터랙션 (약 730줄)
```

> ⚠️ **중요:** 저장소 **루트의 `firebase.json`과 `public/`은 다른 앱('아고라의 딜레마')이
> 이미 사용 중**입니다. 이 사이트는 충돌을 피하려고 `vibe-coding/` 하위에 독립 사이트로
> 분리했습니다. **반드시 `cd vibe-coding` 후에** `firebase` 명령을 실행하세요.
> 루트에서 실행하면 다른 앱의 배포 설정을 덮어씁니다.

---

## 4. 페이지 구성

### 메인 (분량 약 78%)

1. **상단 고정 내비게이션** — 스크롤 진행률 바(`#vcScrollProgress`) + 진도 배지(`#vcProgressBadge`)
2. **히어로** — 대제목, 결과물 3배지, CTA, 60분 타임라인 미니바(7구간 합계 60분)
3. **STEP 0 · 도구 선택** — Codex / Claude Code 2택, 선택 시 전역 전환
4. **60분 실습 코스 7단계** — 각 단계 공통 구성 7요소:
   ① 번호+제목+소요시간 배지+Lucide 아이콘 ② "이 단계가 끝나면" 1줄
   ③ 번호 매긴 절차(Windows/macOS 분기) ④ 터미널 목업 + 복사 버튼
   ⑤ CSS/SVG 화면 목업(핀·화살표) ⑥ "막히면 여기" 아코디언(오류 3개)
   ⑦ "이 단계 완료" 체크박스
5. **문제 해결 FAQ** — `<details>` 10문항
6. **60분 완주 체크리스트** — 7항목, 전부 체크 시 축하 + 다음 단계 추천

| STEP | 제목 | 시간 | 앵커 |
| --- | --- | --- | --- |
| 1 | 준비물 챙기기 | 5분 | `#step1` |
| 2 | 도구 설치하고 로그인하기 | 8분 | `#step2` |
| 3 | 무엇을 만들지 정하기 | 7분 | `#step3` |
| 4 | 첫 프로토타입 만들기 | 15분 | `#step4` |
| 5 | 말로 고치기 | 10분 | `#step5` |
| 6 | Firebase로 배포하기 | 12분 | `#step6` |
| 7 | 학생에게 나눠주기 | 3분 | `#step7` |

> 참고: 원래 사양서에는 진도 배지가 "n/6단계"로 적혀 있었으나 실제 실습 단계는
> STEP 1~7의 7개이므로 **n/7단계**로 구현했습니다(`TOTAL_STEPS = 7`).

### 서브 (분량 약 22%, 하단 배치)

- 동쌤 소개(이력을 **수상 / 강의·연수 / 연구·기획 / 집필** 4그룹 카드로 재구성)
- 동쌤이 만든 웹앱 갤러리 7종 (바로 열기 + QR 띄우기)
- 에듀테크 교사 연구회 (참여 코드 `dongssam`)
- SNS 3채널 (블로그·인스타그램·유튜브)
- 강의·협업 문의 (mailto + 주소 복사 + 메일 본문 자동 완성 도우미)
- 푸터 (저작자, 활용 안내, 최종 수정일)

---

## 5. ⚠️ 인계받아 가장 먼저 확인해야 할 것

### (1) 갤러리 7개 + 에크연의 실제 페이지 제목 — **미확인**

최초 구현 환경에서 `*.web.app`과 netlify 도메인이 네트워크 정책으로 차단되어
(`EGRESS_BLOCKED`, curl도 `CONNECT tunnel failed, 403`) 실제 페이지를 열지 못했습니다.
**현재 들어간 제목·설명은 제작자가 제공한 초안 그대로입니다.**

Codex에서는 브라우저 접근이 가능하므로, 아래 URL을 열어 `<title>` 또는 대표 제목을
확인하고 다르면 교체해 주세요. 데이터는 `public/assets/js/app.js`의 `GALLERY` 배열에 있습니다.

| # | 현재 제목(초안) | URL |
| --- | --- | --- |
| 1 | 중·고등학생을 위한 세계사 사료 탐구 교실 | https://worldhistorysources-dongssam.netlify.app/ |
| 2 | 아고라의 딜레마 | https://agora-dilemma-class-20260907.web.app/ |
| 3 | 독도네컷 | https://dokdo-necut.web.app/ |
| 4 | 히스토리 글로브 | https://history-globe-psroy.web.app/ |
| 5 | 교과서 단원별 수능 기출 탐색기 | https://suneung-textbook.web.app/ |
| 6 | 광복군 미션 | https://gwangbok-game-20260911.web.app/ |
| 7 | Let's KOREA TIME (고려 시간여행) | https://lets-korea-time-2026.web.app/ |
| — | 에듀테크 교사 연구회 | https://edutech-teachers.web.app/ |

> 2번 '아고라의 딜레마'는 이 저장소 루트 `public/index.html`의 `<title>`과 일치함을
> 확인했습니다. 나머지 7개는 미확인입니다.

### (2) qrcodejs 실제 렌더링 — **미확인**

CDN이 차단된 환경이라 테스트용 스텁으로 **통합 경로만**(모달 열림, canvas 생성,
PNG 저장 경로) 검증했습니다. 라이브러리가 실제로 올바른 QR을 그리는지는 확인하지
못했습니다. 인터넷이 되는 환경에서 STEP 7 위젯에 주소를 넣고 **휴대폰으로 직접 찍어**
확인해 주세요. 라이브러리 로드 실패 시 안내 문구가 뜨는 폴백은 검증 완료입니다.

---

## 6. 검증된 명령어와 출처

본문에 적힌 설치·배포 명령어는 공식 문서로 확인한 값입니다. **수정 시 반드시 재검증**하고,
확실하지 않은 옵션은 쓰지 말고 공식 문서 링크로 대체하세요.

| 항목 | 값 | 출처 |
| --- | --- | --- |
| Codex 설치 | `npm install -g @openai/codex` | https://github.com/openai/codex |
| Codex 실행 | `codex` (ChatGPT 계정 로그인) | 〃 |
| Codex 대안 | `brew install --cask codex` | 〃 |
| Claude Code 설치 | `npm install -g @anthropic-ai/claude-code` (Node 22+) | https://code.claude.com/docs/en/setup |
| Claude Code 실행 | `claude` (브라우저 로그인) | 〃 |
| Firebase CLI | `npm install -g firebase-tools` | https://www.npmjs.com/package/firebase-tools |
| Firebase 로그인 | `firebase login` | https://firebase.google.com/docs/hosting/quickstart |
| Firebase 준비 | `firebase init hosting` | 〃 |
| Firebase 배포 | `firebase deploy` | 〃 |

**요금 수치는 어디에도 적지 않았습니다.** 공식 링크로만 처리했습니다(Firebase 요금제,
Codex/Claude Code 공식 사이트). 이 원칙을 유지해 주세요.

---

## 7. JavaScript 구조 (`public/assets/js/app.js`)

전체가 하나의 IIFE입니다. 번호 주석으로 11개 블록으로 나뉩니다.

| 블록 | 내용 | 핵심 심볼 |
| --- | --- | --- |
| 1 | 도구별 데이터·전역 전환 | `TOOLS`, `applyTool()` |
| 2 | 프롬프트 빌더 | `TEMPLATES`, `buildPrompt()`, `applyTemplate()` |
| 3 | 수정 프롬프트 8개 | `FIX_PROMPTS` |
| 4 | 어휘 20선 | `VOCAB` |
| 5 | 갤러리 | `GALLERY` |
| 6 | 복사 버튼 | `copyText()`, `flash()` |
| 7 | 진행률·진도 | `updateProgressBadge()`, `TOTAL_STEPS` |
| 8 | 완주 체크리스트 | `updateFinish()` |
| 9 | QR | `drawQr()`, `openQrModal()`, `normalizeUrl()` |
| 10 | 메일 도우미 | `buildMail()`, `MAIL_TO` |
| 11 | 초기화 | `applyTool` → `applyTemplate` → `lucide.createIcons()` |

### localStorage 키

| 키 | 값 |
| --- | --- |
| `vc.tool` | `codex` 또는 `claude` |
| `vc.template` | `quiz` / `tools` / `cards` |
| `vc.steps` | 완료한 단계 번호 CSV (예: `1,2,3`) |
| `vc.finish` | 완주 체크리스트 인덱스 CSV |
| `vc.builder` | 빌더 입력값 JSON |

### 도구 전환 메커니즘 (HTML 훅)

`applyTool(key)`가 아래 속성을 가진 요소를 전부 갱신합니다. **새 단계를 추가할 때
같은 속성을 쓰면 자동으로 전환 대상이 됩니다.**

| 속성 | 동작 |
| --- | --- |
| `data-vc-cmd="install"` / `"run"` | 해당 도구의 설치/실행 명령어로 `textContent` 교체 |
| `data-vc-toolname` | 도구 이름으로 교체 |
| `data-vc-text="키"` | `TOOLS[도구][키]` 문자열로 교체 |
| `data-vc-link="docs"` | 공식 문서 `href`와 링크 문구 교체 |
| `data-vc-if-no-tool` | 도구 미선택 시에만 노출 |

### 복사 버튼 규약

`.vc-copy` 클래스 + 둘 중 하나:
- `data-copy-target="요소id"` — 그 요소의 `textContent`(또는 input의 `value`)를 복사
- `data-copy-text="문자열"` — 문자열을 그대로 복사

클립보드 API 실패 시 `textarea` + `execCommand` 폴백이 있고, 성공하면 버튼에
"복사되었습니다"가 1.6초 표시됩니다(`data-copied` 속성 → CSS로 색 변경).

### QR 모달 규약

`data-qr-url="주소"` + `data-qr-title="제목"` 속성을 가진 버튼이면 어디에 두든
document 레벨 위임 핸들러가 잡아 전면 모달을 엽니다. ESC·바깥 클릭으로 닫힙니다.

---

## 8. 로컬 실행 및 테스트

```bash
cd vibe-coding/public
python3 -m http.server 8765    # 또는 npx serve .
# http://127.0.0.1:8765 접속
```

인터넷이 되는 환경이면 CDN이 그대로 로드되므로 추가 설정이 필요 없습니다.

### 변경 후 반드시 확인할 항목

1. **콘솔 에러 0건** (1280px, 375px 양쪽)
2. **가로 스크롤 0px** — `document.documentElement.scrollWidth - clientWidth === 0`
3. 도구 전환 — Codex/Claude Code 클릭 시 STEP 2·4의 명령어가 함께 바뀌는지
4. 프롬프트 빌더 — 5요소(`[역할] [대상과 목적] [필수 기능] [지켜야 할 조건] [결과물 형식]`) 모두 출력되는지
5. 새로고침 후 진도·도구 선택이 유지되는지
6. `Ctrl+P` 인쇄 미리보기 — 내비·서브·복사 버튼이 숨고 실습 코스만 나오는지

---

## 9. 작업 원칙 (문체·내용)

- **문체는 존댓말로 통일.** 반말·개발자 은어 금지.
- 모든 설명의 기준: **"코딩을 처음 하는 50대 선생님도 이해할 수 있는가."**
- 스크린샷 이미지 파일을 쓰지 말고 **CSS/SVG 목업**으로 화면을 그릴 것.
- 외부 폼·분석·광고 스크립트 금지. 개인정보 수집 금지.
- **확인되지 않은 수치를 지어내지 말 것** (요금, 통계, 수상 내역 추가 등).
- **수정 요청을 받으면 지시한 요소만 변경하고, 언급하지 않은 부분은 그대로 둘 것.**
