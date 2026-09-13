# Codex 입력 프롬프트 — 동쌤 개인 웹페이지

아래 블록을 그대로 Codex에 붙여넣으세요.

---

## 프로젝트 개요

저장소 `dongssam-class/dongssam001` 의 **`dongssam-site/index.html`** 에
"동쌤(김동은) 개인 웹페이지"가 있습니다. 서울 번동중학교 역사 교사이자
에듀테크 교사 연구회(에크연) 대표인 동쌤의 개인 사이트로,
직접 개발한 역사·에듀테크 웹앱을 전시하고 교실에서 QR로 즉시 배포하는 것이 1순위 목적입니다.

원페이지 스크롤 구조이며 9개 섹션(Hero / 소개 / 이력 / 개발 자료실 / 연구회 / QR 모달 /
운영 채널 / 협업 요청 / 푸터)이 모두 구현·검증 완료된 상태입니다.

**작업 전 반드시 `dongssam-site/HANDOFF.md` 를 먼저 읽고 제약 조건을 숙지하세요.**

### 절대 어기면 안 되는 제약

1. **`index.html` 한 파일 구조를 유지할 것.** 빌드 도구·프레임워크·번들러 도입 금지. CDN만 사용.
2. **daisyUI를 v4로 내리지 말 것.** `daisyui@4.12.14/dist/full.min.css` 는 실존하지 않는 경로입니다(404).
   현재의 `daisyui@5/daisyui.css` + `@tailwindcss/browser@4` 조합이 정상 동작함을 실측으로 확인했습니다.
3. **새로 추가하는 CSS를 `@layer` 안에 넣지 말 것.** 커스텀 클레이 CSS가 unlayered이기 때문에
   daisyUI(layered)를 이기고 있습니다. 레이어에 넣는 순간 디자인이 무너집니다.
4. **`localStorage` / `sessionStorage` 사용 금지.**
5. **저장소 루트의 `index.html` 을 건드리지 말 것.** 그건 History Globe(Vite) 앱의 진입점입니다.
6. 디자인 원칙: **납작한 플랫 카드가 하나도 없어야 합니다.** 모든 표면은 클레이(`.clay` 계열).
   포인트 골드(`#f0b429`)는 CTA·배지·아이콘에만 절제해서 씁니다.
7. 모든 UI 텍스트는 한국어. 외부 링크는 전부 `target="_blank" rel="noopener noreferrer"`.

---

## 앞으로 진행할 작업 (우선순위 순)

### 1. 공개 웹앱 개수 불일치 해소 ★먼저 처리

소개 섹션 숫자 카드는 "공개 웹앱 **8**" 인데 `PROJECTS` 배열에는 **7개**만 있습니다.

- 동쌤에게 누락된 8번째 웹앱이 있는지 확인하고, 있으면 `PROJECTS` 에 추가
- 없으면 숫자를 7로 수정
- 어느 쪽이든 **숫자 카드가 `PROJECTS.length` 를 읽어 자동 표시되도록** 바꿀 것.
  그래야 앞으로 자료를 추가해도 다시 어긋나지 않습니다.
- 같은 방식으로 "운영 채널 3" 도 채널 목록 길이에서 파생시킬지 검토

### 2. Firebase Hosting 별도 사이트로 배포

루트 `firebase.json` 은 `public/`(History Globe)을 배포 대상으로 하고
CSP `script-src 'self'` 로 외부 CDN을 전부 막습니다. 그대로 올리면 스타일이 전부 날아갑니다.

- 별도 Hosting 사이트 생성: `firebase hosting:sites:create dongssam-home`
- `firebase.json` 의 `hosting` 을 배열로 바꾸고 타깃 2개 구성
  (기존 History Globe + 신규 `dongssam-site`)
- 신규 타깃 CSP 허용 목록:
  `cdn.jsdelivr.net`, `unpkg.com`, `fonts.googleapis.com`, `fonts.gstatic.com`
  (`script-src` / `style-src` / `font-src` / `img-src data:` 각각 확인)
- **기존 History Globe 배포 설정이 깨지지 않는지 반드시 확인할 것**
- 배포 후 실제 URL에서 클레이 스타일·Lucide 아이콘·QR 생성이 모두 정상인지 육안 확인

### 3. OG 이미지 추가

현재 `og:title` / `og:description` / `og:type` / `og:locale` 만 있고 `og:image` 가 없어
카카오톡·슬랙 등에 공유하면 썸네일이 비어 보입니다.

- 1200×630 OG 이미지 제작 (다크 클레이 톤 + 골드 포인트, "동쌤 김동은 / 역사를 코드로 옮기는 교사")
- `og:image`, `og:image:width`, `og:image:height`, `og:url` 추가
- `twitter:card = summary_large_image` 도 함께 추가

### 4. QR 인쇄·저장 기능 (교실 활용도 직결)

QR 모달에 다음을 추가하면 교실에서 훨씬 유용해집니다.

- `[QR 이미지 저장]` — 생성된 img의 data URL을 `<a download>` 로 내려받기
- `[인쇄]` — QR + 제목 + URL만 나오는 인쇄 전용 스타일(`@media print`)
- 학습지·안내장에 붙일 수 있도록 여백(quiet zone)을 넉넉히 유지할 것

### 5. 자료실 검색 + 정렬

자료가 10개를 넘어가면 필터 칩만으로는 부족합니다.

- 제목·설명을 대상으로 하는 실시간 검색 입력(클레이 스타일)
- 결과 없을 때 안내 문구 (이미 `#empty-msg` 가 있으니 재사용)
- `PROJECTS` 에 `date` 필드를 추가해 최신순 정렬 옵션 검토
  (추가할 경우 기존 7개 항목에도 전부 채워 넣을 것)

### 6. 접근성 정밀 점검

기본 사항(시맨틱 태그, `aria-label`, 키보드 조작, 포커스 링, 44px 터치 영역,
`prefers-reduced-motion`)은 이미 반영되어 있습니다. 다음을 추가로 점검하세요.

- 스크린 리더(NVDA / VoiceOver) 실제 통과 테스트
- 색상 대비 WCAG AA 충족 여부 — 특히 `--txt-dim`(`#a8b3c4`) 위 본문과 골드 버튼의 검은 글자
- QR 모달 열릴 때 `aria-live` 로 제목을 읽어주는지 확인
- 모바일 드로어 메뉴 열림 상태에서 배경 요소가 포커스를 받지 않는지 확인

### 7. 성능 정리

`@tailwindcss/browser@4` 는 런타임에 DOM을 스캔해 CSS를 생성하므로 초기 렌더에 비용이 있습니다.
현재 디자인은 대부분 커스텀 CSS라 Tailwind 의존도가 낮습니다.

- 실제로 쓰이는 Tailwind 유틸리티가 있는지 조사
- 거의 없다면 Tailwind browser CDN 제거를 검토 (daisyUI는 순수 CSS라 단독으로 남길 수 있음)
- 제거 시 레이아웃 회귀가 없는지 전 섹션 확인
- Lucide는 `unpkg.com/lucide@latest` 대신 **버전 고정**을 권장 (예: `lucide@0.544.0`)

### 8. 실기기 검증

- 실제 안드로이드/아이폰에서 QR 스캔이 잘 되는지 (모달 QR을 다른 폰으로 촬영)
- 교실 TV·빔프로젝터 해상도에서 QR 가독성 확인
- iOS Safari에서 `backdrop-filter`(내비 블러, 모달 백드롭) 정상 동작 확인
- 모바일에서 `mailto:` 링크가 기본 메일 앱을 제대로 여는지 확인

---

## 작업 방식

- 변경은 전부 `main` 브랜치에서 진행하고, 의미 단위로 커밋 메시지를 한국어로 명확히 작성
- 수정 후에는 반드시 로컬에서 띄워 **콘솔 에러 0건**을 확인할 것
  (`cd dongssam-site && python3 -m http.server 8080`)
- `verify/` 폴더의 Playwright 스크립트를 재사용해 회귀를 확인할 것
  (`check.mjs` 종합 점검 / `qrsize.mjs` QR 실측 / `fallback.mjs` CDN 차단 폴백)
- 1280px과 360px 두 폭에서 레이아웃이 깨지지 않는지 매번 확인
