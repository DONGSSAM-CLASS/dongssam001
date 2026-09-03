# History Globe · 히스토리 글로브

3D 지구본을 돌리며 특정 연대를 설정하면 그 시점의 왕조·국가와 교과서 핵심 인물을 한눈에 보는 **교실 수업 보조 도구**입니다.
2022 개정 교육과정 중학교 「역사」(①·②), 고등학교 「세계사」, 「동아시아 역사 기행」 수업에서 교사와 학생이 함께 사용합니다.

> 이 저장소에는 기존 미션 게임(`동쌤의 중학교 2학년 세계사 탐험대.html`)도 그대로 남겨 두었습니다. 새 앱과는 별개의 정적 파일입니다.

## 구현 진행 상황

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 1 | 프로젝트 초기화 · Firebase 연결 · Firestore 설계 · Security Rules + 테스트 · 정적 데이터 배치 | ✅ 완료 |
| 2 | 3D 지구본 + 연대 슬라이더 + 샘플 데이터 20개 | ✅ 완료 (`/globe`) |
| 3 | 역사 데이터 전체 입력 + 검색·레이어 | ✅ 완료 (왕조 166 · 인물 218 · 장소 110 · 사건 137 · 교역로 11) |
| 4 | 학생 가입(학급코드) + 마킹·거리·루트 | ✅ 완료 |
| 5 | 교사 가입 + 학급 관리 + 수업 설계 + 성취기준 연동 | ✅ 완료 |
| 6 | 활동지 생성기 + PDF/HTML 다운로드 | ✅ 완료 |
| 7 | 실시간 모니터링 + 따라오기 모드 | ✅ 완료 |
| 8 | 데이터 검수 화면 + 접근성·성능 점검 + 배포 문서 | ✅ 완료 |

## 기술 스택

- 프론트엔드: React 19 + TypeScript + Vite 7, Three.js(react-three-fiber), Zustand, Tailwind CSS 4
- 백엔드: Firebase **Spark(무료) 요금제 범위만** 사용 — Authentication, Cloud Firestore, Hosting
  - Cloud Functions · Cloud Storage · 외부 API 서버 로직은 사용하지 않습니다(Blaze 필요). 서버가 필요해 보이는 작업은 모두 클라이언트에서 처리합니다. 이유와 대안은 `docs/DECISIONS.md` 참고.
- 테스트: Vitest(단위) + `@firebase/rules-unit-testing`(Security Rules, Firestore 에뮬레이터)

## 폴더 구조

```
.
├── firebase.json            # Hosting(SPA rewrite) · Firestore rules/indexes · 에뮬레이터 포트
├── .firebaserc              # 기본 프로젝트(demo-history-globe = 에뮬레이터 전용 데모 ID)
├── firestore.rules          # Security Rules (교사/학생/관리자 역할 분리)
├── firestore.indexes.json   # 복합 인덱스
├── .env.example             # Firebase 웹 설정값 템플릿 (실제 값은 .env 에, 커밋 금지)
├── index.html
├── src/
│   ├── main.tsx / App.tsx   # 진입점 · 라우팅
│   ├── index.css            # Tailwind + 문화권 색상 토큰(색약 대응)
│   ├── data/                # 역사 기본 데이터(정적 JSON) — Firestore 에 넣지 않음
│   │   ├── achievement_standards.json   # 성취기준 65개 원문(수정 금지)
│   │   ├── polities.json / figures.json / places.json / events.json / routes.json
│   │   └── index.ts         # 타입이 붙은 로더 + id 맵
│   ├── lib/
│   │   ├── firebase.ts      # Firebase 초기화(.env → 에뮬레이터 연결 · 영속 캐시)
│   │   ├── authService.ts   # 교사/학생 가입·로그인, 프로필 로딩
│   │   ├── workService.ts   # 학생 핀·루트 동기화(디바운스 1.5초, 문서 1개)
│   │   ├── classService.ts  # 학급 개설·코드 재발급·학생 관리(초기화/비활성/이동)
│   │   ├── sessionService.ts# 수업 세션·미션 CRUD, 따라오기, 실시간 리스너
│   │   ├── standards.ts     # 성취기준 트리 + 연대·왕조·인물 자동 추천
│   │   ├── worksheet.ts     # 활동지 문항 자동 생성(학습목표·탐색·비교표·거리·루트·서술형·자기평가)
│   │   ├── worksheetHtml.ts # 인쇄용/오프라인 단일 HTML 렌더러(A4 @page, Noto Sans KR)
│   │   ├── monitor.ts       # 학생별 색상·진행 요약·CSV 내보내기
│   │   ├── exportImage.ts   # 지구본 화면 PNG 저장
│   │   ├── overridesService.ts / mergedData.ts  # 교사 수정본 저장·적용(기본 데이터는 불변)
│   │   ├── overlayCanvas.ts # 오버레이 해상도(저사양 기기 절반)
│   │   ├── studentAuth.ts   # 학급코드·학생 가상 이메일·문서 ID 규칙
│   │   ├── geo.ts           # 위경도↔3D · 폴리곤 판정 · 지오데식 원
│   │   └── history.ts       # 연대 필터링 · Haversine · 루트 길이 · Douglas-Peucker
│   ├── components/
│   │   ├── globe/           # GlobeCanvas(r3f) · GlobeOverlays(합친 캔버스 텍스처) · Markers · UserOverlay · ClassOverlay · pick
│   │   ├── timeline/        # 연대 슬라이더(정밀도·직접 입력·북마크 점프·키보드)
│   │   └── panels/          # DetailPanel · ComparePanel(동시대 비교) · LayerPanel · SearchBox · ListView(접근성 대체)
│   ├── pages/
│   │   ├── LandingPage · GlobePage(자유 탐색) · DevStatusPage
│   │   ├── student/         # StudentJoinPage · StudentHomePage · StudentGlobePage · StudentRecordsPage
│   │   ├── teacher/         # TeacherAuthPage · TeacherDashboardPage · ClassDetailPage · LessonDesignPage · TeacherGlobePage · WorksheetPage · ContentPage
│   │   └── admin/           # DataReviewPage(데이터 검수)
│   ├── store/               # Zustand 스토어 (2단계부터)
│   └── types/               # history.ts(데이터 스키마) · firestore.ts(컬렉션 문서)
├── public/textures/         # NASA Blue Marble 지구 텍스처(2048/1024, 퍼블릭 도메인)
├── public/geo/              # Natural Earth 110m 국경선(경량 JSON, 퍼블릭 도메인)
├── scripts/seed-emulator.ts # 에뮬레이터 시드(교사·학급코드 DEMO24·열린 세션·관리자)
├── scripts/data-src/        # 역사 데이터 원본(조각 .py) + merge.py → src/data/*.json 생성
├── scripts/validate-data.ts # 정적 데이터 스키마·참조·분포 검증
├── scripts/build-geo.mjs    # Natural Earth GeoJSON → 경량 JSON 변환
├── tests/rules/             # Security Rules 테스트
├── docs/
│   ├── FIRESTORE_SCHEMA.md  # 컬렉션 설계와 할당량 절약 전략
│   └── DECISIONS.md         # 요구사항 밖 판단 기록(질문·가정 포함)
├── DATA_NOTES.md            # 역사 데이터 출처·불확실 항목·TODO
└── TEACHER_GUIDE.md         # 교사용 사용 설명서
```

## 설치

```bash
# Node.js 20 이상, Java 11 이상(Firestore 에뮬레이터용)
npm install
cp .env.example .env
```

## Firebase 프로젝트 만들기

1. https://console.firebase.google.com 에서 프로젝트 생성 (요금제는 **Spark** 그대로 둡니다).
2. **Authentication → 로그인 방법**에서 `이메일/비밀번호`와 `Google`을 사용 설정합니다.
   - 학생 계정도 내부적으로는 이메일/비밀번호 방식입니다(`{학급인증접두어}-{번호}@student.local`). 이메일 인증(verify) 기능은 켜지 마세요.
3. **Firestore Database → 데이터베이스 만들기** (프로덕션 모드, 리전은 `asia-northeast3(서울)` 권장).
4. **프로젝트 설정 → 내 앱 → 웹 앱 추가** 후 표시되는 설정값을 `.env` 의 `VITE_FIREBASE_*` 에 넣습니다.
   - Firebase 클라이언트 키는 공개되어도 무방하지만 보안은 전적으로 `firestore.rules` 에 의존합니다. 규칙 테스트를 반드시 통과시킨 뒤 배포하세요.
5. CLI 연결:
   ```bash
   npx firebase login
   npx firebase use --add     # 실제 프로젝트 ID 선택 → .firebaserc 에 alias 추가
   ```
6. **최초 관리자 지정**: Firestore 콘솔에서 `admins/{교사의 uid}` 문서를 만들고 `{ grantedBy: "console", createdAt: <timestamp> }` 를 넣습니다. (Cloud Functions 없이 관리자를 만드는 유일한 경로. 이후 관리자는 앱의 검수 화면에서 다른 관리자를 추가할 수 있습니다.)

## 로컬 개발 (에뮬레이터)

```bash
# 터미널 1: Auth(9099) · Firestore(8080) · Hosting(5000) · UI(4000)
npm run emulators

# 터미널 2: 데모 데이터 넣기 (교사 teacher@example.com / password123, 학급코드 DEMO24, 열린 세션 1개)
npm run seed

# 터미널 2: Vite 개발 서버 (VITE_USE_EMULATORS=true 이면 에뮬레이터에 연결)
npm run dev
```

> 에뮬레이터가 실행 중일 때 `firestore.rules` 를 편집하면 Firebase CLI 가 규칙 재적용에 실패하며 종료될 수 있습니다. 규칙을 고친 뒤에는 에뮬레이터를 다시 시작하세요.

`http://localhost:5173/dev/status` 에서 정적 데이터 로드·Firestore 연결을 확인할 수 있습니다.

## 테스트

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm test               # 단위 테스트(연대 필터링, 거리 계산, 학생 계정 규칙)
npm run test:rules     # Security Rules 테스트 (에뮬레이터를 자동으로 띄웠다 내림)
npm run data:validate  # 정적 데이터 스키마·참조 무결성 검사
```

## 배포 (Firebase Hosting)

```bash
npm run build          # dist/ 생성
npx firebase deploy --only firestore:rules,firestore:indexes   # 규칙·인덱스 먼저
npx firebase deploy --only hosting
```

`.env` 는 빌드 시점에 번들에 포함되므로 배포 환경마다 올바른 값이 들어 있는지 확인하세요.

## 무료 할당량 모니터링

Spark 요금제 Firestore 일일 한도: 읽기 50,000 · 쓰기 20,000 · 삭제 20,000 · 저장 1 GiB.

- 확인: Firebase 콘솔 → **Firestore Database → 사용량** 탭(일별 읽기/쓰기/삭제 그래프), **프로젝트 설정 → 사용량 및 결제**.
- 알림: Google Cloud 콘솔 → **결제 → 예산 및 알림**은 Blaze 전용이므로, Spark 에서는 사용량 탭을 수업 전후로 확인하는 운영 규칙을 권장합니다.
- 앱 차원의 절약 설계(자세히는 `docs/FIRESTORE_SCHEMA.md`):
  - 역사 기본 데이터는 Firestore 에 두지 않고 번들 정적 JSON 으로 로드 → 읽기 0.
  - 학생 핀·루트는 **학생 1명 = 세션당 문서 1개**(배열) → 핀 하나를 찍을 때마다 문서를 만들지 않음.
  - 실시간 리스너(`onSnapshot`)는 교사가 수업 화면에 머무는 동안만 켜고 나갈 때 해제(학생 기록·제출물·미션 3개).
- 따라오기는 연대가 바뀔 때만 700ms 디바운스로 세션 문서 1개를 갱신하며, 같은 연대는 다시 보내지 않는다.
  - Firestore 영속 로컬 캐시를 켜서 재방문·탭 간 중복 읽기 감소.
  - 대략적 하루 사용량(학급 30명, 50분 수업 1회): 학생 쓰기 ≈ 30명 × 20회 = 600, 교사 모니터링 읽기 ≈ 문서 30개 × 변경 20회 = 600 → 한도의 3~4%.

## 접근성 점검 결과

`axe-core` (WCAG 2.1 A/AA) 자동 점검을 랜딩·학생 입장·교사 로그인·대시보드·수업 설계·지구본·목록형 보기 7개 화면에서 실행했고 **위반 0건**입니다(대비 위반 21건을 색상 조정으로 해결).

- 키보드: 연대 슬라이더에서 `←/→`(정밀도 단위), `Shift+←/→`(10배), `PageUp/PageDown`(100년), `Home/End`(양 끝). 모든 조작 버튼은 탭 이동·엔터로 동작합니다.
- 지구본 조작이 어려우면 **목록형 보기**로 같은 정보를 표로 볼 수 있습니다(3D 마커에 의존하지 않도록 루트 만들기도 목록의 `+` 버튼으로 가능).
- 색: 문화권·학생 색상은 색약 대응 팔레트(Okabe–Ito 계열, 황금각 분산)를 쓰고 색만으로 구분하지 않도록 이름·번호·수치를 함께 표시합니다.
- 본문 텍스트 대비는 4.5:1 이상을 유지합니다.

재현: `node` + Playwright 로 각 화면에 axe-core 를 주입해 실행했습니다(스크립트는 저장소에 포함하지 않고 검증용으로만 사용).

## 성능 측정 결과

측정 환경은 GPU 가 없는 컨테이너(Chromium + SwiftShader **소프트웨어 렌더링**)라 실제 크롬북보다 훨씬 불리합니다. 프로덕션 빌드(`vite preview`) 기준입니다.

| 항목 | 값 |
| --- | --- |
| 첫 페인트 / FCP | 44ms / 196ms |
| 지구본 캔버스 표시 | 약 0.55초 |
| 전송량(첫 로드) | 705 KB (three 300KB + firebase 183KB + 앱 70KB + 텍스처 106KB) |
| JS 힙 | 약 16~23 MB |
| 조작(드래그) 중 FPS | 10 (소프트웨어 렌더링 기준. GPU 가 있는 크롬북에서는 이보다 크게 높습니다) |
| 연대 변경 반영 | 약 0.9초 |
| 유휴 시 지구본 렌더링 | 없음(요구 기반 렌더링) |

성능을 위해 한 일:

1. **요구 기반 렌더링**(`frameloop="demand"`) — 조작·데이터 변경이 있을 때만 그립니다. 매 프레임 렌더링하던 때는 같은 페이지의 Firestore 읽기·쓰기가 9초 넘게 지연됐습니다.
2. **오버레이 합치기** — 왕조 영역·교역로·국경선·학생 핀을 각각 반투명 구로 겹치던 것을 캔버스 한 장·구 하나로 합쳤습니다(드래그 FPS 5→10, 연대 변경 1.5초→0.9초).
3. **저사양 기기 대응** — 논리 코어 ≤4 또는 메모리 ≤4GB 이면 지구 텍스처 1024px, 오버레이 캔버스 1024×512 를 씁니다. DPR 은 최대 1.5.
4. **웹폰트 비차단 로딩** — 외부 폰트가 느리거나 막히면 첫 화면이 12초 넘게 지연되던 문제를 해결했습니다(현재 첫 페인트 44ms).
5. 화면별 코드 분할, 폴리곤 단순화(Douglas–Peucker), 연대 필터링은 모두 클라이언트 메모리에서 처리.

## 배포 체크리스트

```bash
npm ci
npm run typecheck && npm run lint && npm test      # 타입·린트·단위 테스트
npm run data:validate                              # 역사 데이터 스키마·참조·분포
npm run test:rules                                 # Security Rules (에뮬레이터 자동 기동)
npm run build                                      # dist/ 생성

npx firebase deploy --only firestore:rules,firestore:indexes   # 규칙·인덱스 먼저
npx firebase deploy --only hosting                             # 앱 배포
```

배포 전 확인:

- [ ] `.env` 의 `VITE_FIREBASE_*` 가 배포 대상 프로젝트 값인지 (빌드 시점에 번들에 들어갑니다)
- [ ] `VITE_USE_EMULATORS=false`
- [ ] Authentication 에서 이메일/비밀번호·Google 로그인 사용 설정
- [ ] Firestore 리전 `asia-northeast3(서울)` 권장, 프로덕션 모드
- [ ] `admins/{교사 uid}` 문서로 최초 관리자 지정(데이터 검수 화면 권한)
- [ ] 규칙 테스트 통과 확인 — 학생 데이터 보호는 전적으로 규칙에 달려 있습니다

## 지구본 렌더링 설계 (성능)

- 왕조 영역은 정치체마다 메시를 만들지 않고, 활성 정치체를 **등장방형 캔버스 한 장(2048×1024)** 에 그려 반투명 텍스처로 입힙니다. 연대가 바뀌면 캔버스만 다시 그리므로 드로우콜이 늘지 않습니다.
- 인물·장소 마커와 이름표는 DOM 오버레이(drei `Html`)이며, 지구 뒷면 판정은 레이캐스트 대신 법선·카메라 내적으로 처리합니다.
- 저사양 기기(논리 코어 ≤4 또는 메모리 ≤4GB)는 1024px 텍스처를 사용하고, DPR 은 최대 1.5 로 제한합니다.
- **필요할 때만 렌더링(`frameloop="demand"`)**: 조작이나 데이터 변경이 있을 때만 한 프레임을 그립니다. 매 프레임 렌더링하면 저사양·소프트웨어 렌더링 환경에서 메인 스레드가 포화되어 Firestore 응답까지 지연되는 것을 실측으로 확인했습니다(쓰기 9초 타임아웃 → 0.5초).
- 현대 국경선(Natural Earth)은 토글할 때 한 번만 내려받아 별도 캔버스 텍스처로 그립니다.

## 활동지 출력 방식 (서버 없음)

- **인쇄 / PDF로 저장(기본)**: 활동지만 담은 새 창을 열고 `window.print()` 를 호출합니다. `@page { size: A4; margin: 12mm }` 규칙이 적용되고 글자가 벡터로 남아 가장 선명합니다. 크롬의 인쇄 대화상자에서 "대상 → PDF로 저장"을 고르면 됩니다.
- **PDF 파일(보조)**: `html2pdf.js`(jsPDF + html2canvas)로 A4 PDF를 바로 내려받습니다. 화면을 이미지로 굽기 때문에 용량이 크고 글자 선택이 안 되지만, 인쇄 대화상자를 쓰기 어려운 환경에서 유용합니다.
- **HTML 다운로드**: 단일 파일이며 인터넷 없이 열립니다. 학생이 브라우저에서 직접 입력할 수 있고, 입력 내용은 그 브라우저(localStorage)에 저장됩니다. 한글 폰트는 Noto Sans KR 웹폰트를 불러오되 실패하면 시스템 한글 글꼴로 대체됩니다.
- 미리보기는 iframe 으로 띄워 앱의 스타일이 섞이지 않으므로 내려받은 결과와 똑같이 보입니다.

## 라이선스 · 데이터 출처

역사 데이터의 출처와 불확실한 항목은 `DATA_NOTES.md` 에 정리합니다. 지구 텍스처는 NASA Blue Marble(퍼블릭 도메인, three-globe 저장소 배포본 2048px 축소), 현대 국경선은 Natural Earth 1:110m(퍼블릭 도메인)을 사용합니다.
