# 독도네컷 — Codex 인수인계 문서

이 압축 파일은 **독도의 날(10.25) 기념 인생네컷 웹앱 "독도네컷"** 의 현재 소스 전체입니다.
Codex(또는 다른 AI 코딩 도구)에서 이어서 작업하기 위한 안내입니다.

## 1. 이 앱이 무엇인가
- 독도 체험부스에서 학생들이 태블릿(아이패드·갤럭시탭)·노트북으로 쓰는 **순수 정적 웹앱**.
- 빌드 도구·백엔드·DB·로그인 **없음**. `index.html` 을 열면 그대로 동작합니다.
- 촬영·필터·합성·저장까지 **모두 브라우저 안에서만** 처리 → 사진/이름이 서버로 전송되지 않음(개인정보 보호).

## 2. 파일 구조
```
dokdo-necut/
├── index.html          # 화면 마크업 + CSS (6단계: 인트로→이름→인물→스타일→촬영→결과)
├── app.js              # 앱 로직: 화면전환, 카메라(5초 타이머), 이미지 필터,
│                       #   1080x1350 네컷 합성, 굿즈 합성, 저장/공유/SNS/QR
├── figures.js          # 역사 인물 4명 클레이 캐릭터 SVG + 고증 설명 데이터
├── dokdo.js            # 독도 배경 씬 SVG (3D/애니/스케치, 미리보기용 + 배너용)
├── firebase.json       # Firebase Hosting 설정 (이 폴더만 배포, public: ".")
├── .firebaserc         # Firebase 프로젝트 alias (기본값 dokdo-necut)
├── README.md           # 기능·배포 안내
└── CODEX_HANDOFF.md     # (이 문서)

.github/workflows/dokdo-necut-deploy.yml   # main push 시 dokdo-necut/ 만 자동 배포
```

## 3. 핵심 구현 포인트 (수정 시 참고)
- **상태**: `app.js` 의 `State` 객체 (friends, figureId, style, theme, goods, shots).
- **화면 전환**: `App.go('screen이름')` — screen id 는 `s-intro/s-names/s-figure/s-style/s-capture/s-result`.
- **인물 데이터**: `figures.js` 의 `FIGURES` 배열. 각 항목 `{id,name,role,era,fact,costume,svg()}`.
  - `svg()` 는 viewBox 220x300 클레이 캐릭터 문자열을 반환. 새 인물 추가는 이 배열에 push.
- **독도 배경**: `dokdo.js` 의 `dokdoScene(style, layout)`.
  - `layout` 없으면 미리보기(1080x620), `'banner'` 면 네컷 하단용 가로 배너(1080x300).
- **이미지 필터**: `app.js` 의 `applyFilter(canvas, style)` — `3d`(채도·비네트), `anime`(포스터화+외곽선), `sketch`(소벨 엣지 연필). 640x480 캔버스에 적용.
- **네컷 합성**: `App.compose()` — 1080x1350 캔버스에 타이틀→사진 2x2→독도 배너+인물→이름 순서.
- **굿즈**: `App.drawGoods()` — 폰케이스/에코백/머그컵/스티커/키링/포토카드 목업.
- **외부 의존성**: Pretendard 폰트(CDN), QRCode(cdnjs qrcodejs 1.0.0). 인터넷 없으면 폰트는 기본체로,
  QR 은 생략됨. 완전 오프라인이 필요하면 두 리소스를 로컬로 내려받아 포함할 것.

## 4. 로컬 실행/미리보기
```bash
cd dokdo-necut
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
# ※ 카메라(getUserMedia)는 https 또는 localhost 에서만 동작. 카메라 없으면 '사진 올리기' 버튼 사용.
```

## 5. 배포 (Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
cd dokdo-necut
firebase use dokdo-necut     # 또는 firebase use --add 로 실제 프로젝트 선택
firebase deploy --only hosting
```
GitHub 자동 배포: 저장소 Secret `FIREBASE_SERVICE_ACCOUNT_DOKDO` (Firebase 서비스계정 JSON) 등록 후
`dokdo-necut/` 변경을 main 에 push → `https://dokdo-necut.web.app`.

## 6. 알려진 한계 / 개선 여지 (다음 작업 후보)
- 인물 캐릭터는 실제 초상이 아닌 **복식 고증 기반 스타일 일러스트**. 더 정교한 얼굴/복식 디테일 보강 가능.
- "AI 생성"은 개인정보 보호를 위해 **브라우저 내 필터**로 구현(외부 생성형 AI 미사용).
  진짜 생성형 AI 를 붙이려면 API 키 보호용 서버(Cloud Functions 등)가 필요.
- 스케치 필터의 인물/배경 대비, 애니 필터 색 단계 수 등 파라미터 튜닝 여지.
- 인물별 짧은 설명 카드/퀴즈, 배경음, 촬영 효과음, 다국어 등 확장 가능.
- 접근성(키보드 조작, 대비), 저사양 태블릿 성능 점검.

## 7. 주의
- 이 앱은 같은 저장소의 **History Globe(React/Vite 3D 지구본 앱, 저장소 루트)** 와 **완전히 별개**입니다.
  루트의 `package.json`/`firebase.json`/`src/` 등은 그 앱 것이니 독도네컷 작업 중 건드리지 마세요.
- 독도네컷은 빌드 과정이 없으므로 `npm install` 이 필요 없습니다.
