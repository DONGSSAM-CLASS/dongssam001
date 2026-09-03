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
| 6 | 활동지 생성기 + PDF/HTML 다운로드 | ⏳ |
| 7 | 실시간 모니터링 + 따라오기 모드 | ⏳ |
| 8 | 데이터 검수 화면 + 접근성·성능 점검 + 배포 문서 | ⏳ |

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
│   │   ├── studentAuth.ts   # 학급코드·학생 가상 이메일·문서 ID 규칙
│   │   ├── geo.ts           # 위경도↔3D · 폴리곤 판정 · 지오데식 원
│   │   └── history.ts       # 연대 필터링 · Haversine · 루트 길이 · Douglas-Peucker
│   ├── components/
│   │   ├── globe/           # GlobeCanvas(r3f) · PolityOverlay · RoutesOverlay · BordersOverlay · Markers · pick
│   │   ├── timeline/        # 연대 슬라이더(정밀도·직접 입력·북마크 점프·키보드)
│   │   └── panels/          # DetailPanel · ComparePanel(동시대 비교) · LayerPanel · SearchBox · ListView(접근성 대체)
│   ├── pages/
│   │   ├── LandingPage · GlobePage(자유 탐색) · DevStatusPage
│   │   ├── student/         # StudentJoinPage · StudentHomePage · StudentGlobePage · StudentRecordsPage
│   │   └── teacher/         # TeacherAuthPage · TeacherDashboardPage · ClassDetailPage · LessonDesignPage · TeacherGlobePage
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
  - 실시간 리스너(`onSnapshot`)는 세션이 `open` 인 동안만 켜고 종료 시 해제.
  - Firestore 영속 로컬 캐시를 켜서 재방문·탭 간 중복 읽기 감소.
  - 대략적 하루 사용량(학급 30명, 50분 수업 1회): 학생 쓰기 ≈ 30명 × 20회 = 600, 교사 모니터링 읽기 ≈ 문서 30개 × 변경 20회 = 600 → 한도의 3~4%.

## 지구본 렌더링 설계 (성능)

- 왕조 영역은 정치체마다 메시를 만들지 않고, 활성 정치체를 **등장방형 캔버스 한 장(2048×1024)** 에 그려 반투명 텍스처로 입힙니다. 연대가 바뀌면 캔버스만 다시 그리므로 드로우콜이 늘지 않습니다.
- 인물·장소 마커와 이름표는 DOM 오버레이(drei `Html`)이며, 지구 뒷면 판정은 레이캐스트 대신 법선·카메라 내적으로 처리합니다.
- 저사양 기기(논리 코어 ≤4 또는 메모리 ≤4GB)는 1024px 텍스처를 사용하고, DPR 은 최대 1.5 로 제한합니다.
- **필요할 때만 렌더링(`frameloop="demand"`)**: 조작이나 데이터 변경이 있을 때만 한 프레임을 그립니다. 매 프레임 렌더링하면 저사양·소프트웨어 렌더링 환경에서 메인 스레드가 포화되어 Firestore 응답까지 지연되는 것을 실측으로 확인했습니다(쓰기 9초 타임아웃 → 0.5초).
- 현대 국경선(Natural Earth)은 토글할 때 한 번만 내려받아 별도 캔버스 텍스처로 그립니다.

## 라이선스 · 데이터 출처

역사 데이터의 출처와 불확실한 항목은 `DATA_NOTES.md` 에 정리합니다. 지구 텍스처는 NASA Blue Marble(퍼블릭 도메인, three-globe 저장소 배포본 2048px 축소), 현대 국경선은 Natural Earth 1:110m(퍼블릭 도메인)을 사용합니다.
