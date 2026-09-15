# 역사연구팀 웹사이트 인계서

> 마지막 갱신: 2026-09-15 (Asia/Seoul)
> 이어서 작업하는 사람은 이 파일을 먼저 끝까지 읽고 `README.md`, `firestore.rules` 를 확인하세요.

## 1. 프로젝트 개요

- 사이트명: 에듀테크 교사 연구회 역사연구팀 (EDUTECH TEACHERS · HISTORY RESEARCH TEAM)
- 정체성: 에크연 스핀오프 연구회 / 교육부 역사교사학습공동체 — 홈 히어로·`/about` 상단·푸터 세 곳에 노출
- 폴더: `ekyeon-history/` (본원 소스는 레퍼런스로만 읽고 수정하지 않음)
- Firebase 프로젝트 ID(예정): `ekyeon-history`
- **Firebase 콘솔·배포 계정: dongssam2021@gmail.com**
- 문의·협업 메일: dongssam94@gmail.com
- 요금제: **Spark(무료) 유지. 결제 계정 연결 금지.**

## 2. 기술 스택

React 18 + Vite + React Router v6 / Tailwind CSS 3.4 + daisyUI(dark) + Pretendard + lucide-react /
Firebase Auth + Firestore + Hosting / QR 은 `qrcode` 패키지로 캔버스 직접 렌더링.

Cloud Functions·Cloud Storage 미사용. 파일은 외부 공유 URL 링크 방식.

## 3. 파일 지도

| 목적 | 파일 |
| --- | --- |
| 라우팅 | `src/App.jsx` |
| 상단 메뉴 | `src/components/Nav.jsx` |
| 푸터(정체성·메일) | `src/components/Footer.jsx` |
| 전체 스타일 | `src/styles.css` |
| 회원 유형·외부 주소·상수 | `src/lib/constants.js` |
| 인증·권한 상태 | `src/lib/AuthContext.jsx` |
| 화면 접근 권한 | `src/lib/permissions.js` |
| 실제 DB 권한 | `firestore.rules` |
| 색인 | `firestore.indexes.json` |
| 수업 기록 조회 | `src/lib/lessons.js` |
| 수업 기록 등록 폼 | `src/components/LessonComposer.jsx` |
| 웹앱 시드 8건 | `src/data/webapps.js` |
| 웹앱 조회 | `src/lib/webapps.js` |
| 전면 QR | `src/components/QrOverlay.jsx` |
| 협업 알림 웹훅 | `src/lib/notifications.js` |
| 운영 도구 | `src/pages/AdminDashboard.jsx`, `src/components/admin/*` |

## 4. 화면별 메모

- `/lessons` — 비로그인·미승인자는 읽기만 가능하고 등록 폼이 보이지 않습니다. 목록은 연도별 섹션,
  유형·태그 필터 칩, 상단 누적 카운터로 구성됩니다.
- `/dev` — 비밀번호 `2026`(환경변수 `VITE_DEV_SPACE_PASSCODE`). 통과 플래그는 `sessionStorage`
  (`ekyeon-history:dev-space-unlocked`)에 저장되어 탭을 닫으면 해제됩니다.
  **이 잠금은 프런트엔드 수준 제한입니다. 실제 보안은 구글 드라이브 폴더의 공유 권한입니다.**
- `/webapps` — Firestore `webapps` 가 비어 있으면 `src/data/webapps.js` 의 8건을 보여 줍니다.
- `/collaborate` — 제출은 ① mailto 메일 열기 ② 양식 내용 복사 두 가지. 추가로 Firestore
  `collabRequests` 에 접수 기록을 남기고, `VITE_NOTIFICATION_WEBHOOK_URL` 이 있으면 웹훅도 호출합니다.
- `/admin` — 활성 관리자는 4개 탭(승인 대기·회원 목록·수업 기록 관리·웹앱 관리),
  메일 인증된 `staff` 회원은 콘텐츠 2개 탭만 보입니다.

## 5. 인증 흐름

1. 회원: 가입 → 메일 인증 → `pending` → 운영진 승인 → `member`/`guest` 권한
2. 관리자: `/admin/login` 에서 아이디·비밀번호(1단계) → `dongssam94@gmail.com` 으로 오는
   승인 링크 클릭(2단계) → `admins/{uid}.verifiedUntil` 이 12시간 뒤로 갱신됨
3. 메일 인증 직후에는 ID 토큰의 `email_verified` 클레임이 옛 값일 수 있어
   `AuthContext` 에서 토큰을 한 번 강제 갱신합니다(이 처리를 지우면 운영진 쓰기가 막힙니다).

## 6. 검증 현황 (2026-09-15)

- `npm run build` 성공
- Firestore 에뮬레이터 기반 보안 규칙 테스트 **42개 전 항목 통과**
  (미승인·참관 회원 쓰기 차단, 소유권 위조 차단, 자가 승격 차단, 관리자 문서 생성 차단 등)
- 브라우저 실동작 확인: 가입→승인→등록→수정→삭제, 필터·카운터, 비공개 글 숨김,
  QR 8건 전면 송출·주소 복사·3가지 닫기, 개발 공간 게이트, 협업 양식 복사·접수,
  운영 도구 승인·웹앱 시드 등록
- 모바일 가로 360px 에서 내비·카드·QR 오버레이 깨짐 없음(가로 스크롤 없음)

규칙 테스트 스크립트는 저장소에 포함하지 않았습니다. 다시 돌리려면 Java 와
`firebase-tools`, `@firebase/rules-unit-testing` 이 필요합니다.

## 7. 남은 작업 후보

- 히어로에 쓸 역사연구팀 로고 이미지(현재는 텍스트+뱃지 구성)
- `/lessons` 글이 많아지면 연도 섹션별 '더 보기' 접기
- 운영 도구에 협업 요청 열람 탭(현재 규칙상 운영진 읽기는 열려 있음)

## 8. 지켜야 할 조건

1. 콘솔에서 직접 해야 하는 작업은 우회하지 않고 멈춘 뒤 메뉴 경로를 안내합니다.
2. 결제 계정을 연결하지 않습니다(Blaze 전환 전제 기능 금지).
3. 오류가 나도 보안 규칙을 느슨하게 바꾸지 않습니다.
4. 링크·비밀번호·메일 주소는 오타 없이 그대로 유지합니다.
5. 확인되지 않은 이력·실적은 싣지 않습니다.

---

## 9. 배포 전 콘솔 작업 (직접 누르셔야 합니다)

아래는 모두 **무료 범위**입니다. 결제 계정은 연결하지 마세요.

### 9-1. Firebase 프로젝트 만들기

1. <https://console.firebase.google.com> 에 **dongssam2021@gmail.com** 으로 로그인
2. **프로젝트 추가** → 프로젝트 이름 `ekyeon-history` 입력
   → 프로젝트 ID 가 `ekyeon-history` 로 잡히는지 확인(이미 쓰이고 있으면 뒤에 숫자가 붙습니다.
   그 경우 실제 ID 를 `.env` 와 `.firebaserc` 에 그대로 넣어 주세요)
3. Google 애널리틱스: **사용 안 함** 선택 후 **프로젝트 만들기**
4. 왼쪽 아래 요금제가 **Spark** 인지 확인 (업그레이드 버튼을 누르지 마세요)

### 9-2. 웹 앱 등록과 설정값 복사

1. 프로젝트 개요 화면에서 **웹 아이콘 `</>`** 클릭
2. 앱 닉네임 `ekyeon-history-web` 입력 → **Firebase 호스팅 설정** 체크는 하지 않고 **앱 등록**
3. 화면에 나오는 `firebaseConfig` 값을 프로젝트 폴더의 `.env` 에 옮겨 적기
   (`.env.example` 을 복사해 `.env` 로 만든 뒤 값만 채우면 됩니다)
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
4. 나중에 다시 볼 때는 **⚙️ 프로젝트 설정 → 일반 → 내 앱 → SDK 설정 및 구성**

### 9-3. Authentication 켜기

1. 왼쪽 메뉴 **빌드 → Authentication → 시작하기**
2. **Sign-in method** 탭 → **이메일/비밀번호** 클릭 → 사용 설정 **켜기**
   → 같은 화면에서 **이메일 링크(비밀번호 없는 로그인)** 도 **켜기** → 저장
   (이메일 링크는 관리자 2단계 승인에 사용됩니다)
3. **Settings(설정) → 승인된 도메인** 에 아래가 있는지 확인하고 없으면 **도메인 추가**
   - `localhost`
   - `ekyeon-history.web.app`
   - `ekyeon-history.firebaseapp.com`
   - (커스텀 도메인을 쓰면 그 도메인도 추가)

### 9-4. Firestore 만들기

1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
2. 위치 **asia-northeast3 (서울)** 선택
3. **프로덕션 모드에서 시작** 선택 → 사용 설정
   (규칙은 곧 `npm run deploy:rules` 로 덮어씁니다)

### 9-5. 관리자 계정 만들기 (가입 화면으로는 만들 수 없습니다)

1. **Authentication → Users → 사용자 추가**
   - 이메일: `ekadmin@admin.ekyeon.kr` (실제 수신 주소가 아니어도 됩니다.
     도메인은 `.env` 의 `VITE_ADMIN_ID_DOMAIN` 과 같아야 합니다)
   - 비밀번호: 16자 이상 무작위로 지정해 안전한 곳에 보관
   - → 여기서 **관리자 아이디는 `ekadmin`** 이 됩니다
2. 생성된 사용자 행의 **UID 복사**
3. **Firestore Database → 데이터 → 컬렉션 시작**
   - 컬렉션 ID: `admins`
   - 문서 ID: **2번에서 복사한 UID**
   - 필드 1: `adminId` / 타입 `string` / 값 `ekadmin`
   - 필드 2: `verifiedUntil` / 타입 `timestamp` / 값 **과거 날짜**(예: 2020-01-01)
   - 저장
4. 이후 관리자는 `/admin/login` 에서 아이디·비밀번호를 넣고,
   **dongssam94@gmail.com** 으로 오는 승인 링크를 눌러야 로그인이 완료됩니다.
   승인 링크는 **다른 브라우저나 휴대폰**에서 여는 것을 권합니다.

### 9-6. 배포

터미널에서(이 폴더 안에서):

```bash
npm install -g firebase-tools
firebase login                  # dongssam2021@gmail.com 으로 로그인
firebase use ekyeon-history     # 9-1에서 만든 실제 프로젝트 ID
npm run build
npm run deploy:rules            # 규칙·색인 먼저
npm run deploy:hosting          # 화면 배포
```

배포 후 <https://ekyeon-history.web.app> 에서 확인합니다.

### 9-7. (선택) App Check 와 협업 알림 웹훅

- **빌드 → App Check → 앱 등록 → reCAPTCHA v3** 로 사이트 키를 발급받아
  `.env` 의 `VITE_RECAPTCHA_SITE_KEY` 에 넣으면 외부 스크립트의 무단 호출을 줄일 수 있습니다.
- 협업 요청을 메일로도 받고 싶으면 Google Apps Script 웹 앱을 만들어 그 URL 을
  `VITE_NOTIFICATION_WEBHOOK_URL` 에 넣습니다. 비워 두면 조용히 건너뜁니다.

### 9-8. 배포 후 점검 목록

1. 홈·소개·푸터에 스핀오프 연구회 / 교육부 역사교사학습공동체 문구가 보이는지
2. `/webapps` 카드 8건 모두에서 QR 전면 송출과 주소 복사가 되는지
3. `/dev` 가 비밀번호 `2026` 입력 후에만 드라이브 버튼을 보여 주는지
4. 새 계정으로 가입 → `pending` 상태 확인 → 운영 도구에서 승인 → 수업 기록 등록
5. 미승인 계정으로 수업 기록 등록이 막히는지(보안 규칙 차단 메시지)
6. 휴대폰(가로 360px)에서 내비·카드·QR 오버레이가 깨지지 않는지
