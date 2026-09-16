# 인수인계 — 다산의 시간

**다산의 시간** (부제: 스크롤은 멈추고 GO! 몰입은 배우고 GO!) — 정약용의 유배 생활과 공부법을 탐구하고, 그것을 근거로 학생이 스스로 스마트폰 사용 규칙을 설계·실천하는 중학교 3학년 역사 수업용 웹앱. **3차시 교실 수업 + 4주 가정 실천**("3+1") 구조.

- 저장소: `dongssam-class/dongssam001`, 경로 `dasan-time/`, 브랜치 `main`
- 마지막 커밋: `다산의 시간 — 중학교 역사 수업용 웹앱 추가`
- 배포 대상: Firebase Hosting (무료 Spark 요금제), 관리 계정 `dongssam2021@gmail.com`

> **이 저장소는 앱별 하위 폴더 구조입니다.** 루트의 `CODEX_HANDOFF.md`·`public/` 는 다른 앱("아고라의 딜레마")의 것이고 제약 조건도 완전히 다릅니다(빌드 도구 금지). **이 앱은 `dasan-time/` 안에서만 작업하며, Vite·React·npm 을 정상적으로 씁니다.** 두 문서를 섞지 마세요.

---

## 1. 현재 상태 — 명세 전 항목 구현 완료, 검증 통과

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 1 | 프로젝트 생성 · Tailwind v4 + daisyUI cupcake + Pretendard + lucide · 랜딩 | ✅ |
| 2 | Firebase 연결 · 교사/학생 회원가입·로그인 · 학급 코드 생성·가입 | ✅ |
| 3 | `content/lessons.ts` · 체험 모드(localStorage)로 1·2·3차시·4주 점검 | ✅ |
| 4 | Firestore 연동 (자동 저장, 제출, 모둠 보드, 감정 지도, 갤러리·투표) | ✅ |
| 5 | 교사 대시보드 · 수업 진행 제어 · 결과물 보기·평가 · 통계 | ✅ |
| 6 | PDF (개인·학급 ZIP·활동별) · 가정 안내문 인쇄 | ✅ |
| 7 | 보안 규칙 + 에뮬레이터 테스트 | ✅ |
| 8 | README 작성 · 최종 점검 | ✅ |

**실제로 실행해서 검증한 결과** (추정이 아니라 실행 결과입니다):

| 검증 | 방법 | 결과 |
| --- | --- | --- |
| 보안 규칙 | Firestore 에뮬레이터 + vitest | **31건 전부 통과** |
| 체험 모드 전체 흐름 | Playwright, 360px 뷰포트 | **38건 통과** (1건 실패는 샌드박스가 Pretendard CDN 을 막은 것) |
| Firestore 연동 교사↔학생 왕복 | Playwright + Auth·Firestore 에뮬레이터 | **16건 전부 통과** |
| 한글 PDF | 실제 생성 후 픽셀 확인 | 긴 한글 문서 → **5쪽 분할**, 글자 깨짐 없음 |
| 360px 가로 스크롤 | `scrollWidth` vs `clientWidth` | 모든 학생 화면에서 **360 = 360** |
| 금지어 `공모`/`우수사례`/`심사`/`출품`/`응모` | `grep -rn` 전체 | **0건** |
| `npm run build` | — | **경고·오류 없음** |

소스 56개 파일, 약 9,300줄. `TODO`/`FIXME` 주석 **0건** (역사 서술을 명세 허용 범위 안에서만 써서 확인이 필요한 불확실한 서술이 생기지 않았습니다).

---

## 2. 기술 스택

- **Vite + React 18 + TypeScript** (strict, `noUnusedLocals`/`noUnusedParameters` 켜짐)
- **React Router v6** — `BrowserRouter` + Hosting rewrite (`HashRouter` 아님)
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **daisyUI v5**, 테마는 **`cupcake` 하나만**
- **lucide-react** 아이콘, **Pretendard** 글꼴(CDN)
- **Firebase JS SDK v10** (modular) — **Auth + Firestore + Hosting 만**
- PDF: **`jspdf` + `html2canvas-pro`**, 학급 전체 묶음은 `jszip`
- 교사용 차트: `recharts`
- 상태 관리: **React Context + 커스텀 훅만.** 추가 상태 라이브러리 금지

### 바꾸면 안 되는 것 (바꾸면 깨집니다)

1. **`html2canvas-pro` 를 `html2canvas` 로 되돌리지 마세요.** Tailwind v4·daisyUI v5 가 `oklch()` 색을 쓰기 때문에 구버전은 캡처 중 오류가 납니다.
2. **Firebase Storage·Cloud Functions 를 쓰지 마세요.** 둘 다 Blaze(유료) 요금제가 필요합니다. 무료 유지가 요구사항입니다.
3. **daisyUI 테마를 늘리지 마세요.** `cupcake` 하나만 씁니다.
4. **`PassCard` 와 `report/` 안의 색은 daisyUI 색 변수 대신 고정 HEX 로 둔 것입니다.** 캡처 라이브러리가 CSS 변수를 계산하지 못하는 경우를 피하려는 의도이므로 `bg-primary` 같은 것으로 바꾸지 마세요.
5. **`vite.config.ts` 의 `chunkSizeWarningLimit: 800`** — `pdf`/`charts` 청크는 첫 화면에 실리지 않는 지연 로딩 청크입니다. 임의로 낮추면 빌드에 경고가 다시 생깁니다.

---

## 3. 폴더 구조

```
dasan-time/
  index.html                  ← <html lang="ko" data-theme="cupcake">, Pretendard CDN
  vite.config.ts              ← manualChunks(react/firebase/charts/pdf), chunkSizeWarningLimit 800
  firebase.json               ← Hosting dist, SPA rewrite, 캐시·보안 헤더, 에뮬레이터 포트
  firestore.rules             ← 보안 규칙 (아래 6장)
  firestore.indexes.json
  .env.example                ← VITE_FIREBASE_* + VITE_USE_EMULATOR
  README.md                   ← 배포 절차, 요금제 한도, 설계 메모
  src/
    main.tsx  index.css       ← index.css 에 @plugin "daisyui" { themes: cupcake --default; }
    app/
      App.tsx                 ← 라우터. 학생/체험이 같은 하위 라우트를 공유 (studentRoutes())
      Layout.tsx              ← 학생·체험 공통 틀, 체험 배너
      guards.tsx              ← RequireTeacher / RequireStudent / RequireTrial
      AuthContext.tsx         ← 로그인 상태 + 역할 판별 (프로필 재시도 로직 있음, 7장 참고)
      DataContext.tsx         ← 학생·체험용 DataApi 주입, 내 제출물 실시간 구독
      TeacherContext.tsx      ← 교사용 학급/학생/제출물/평가 실시간 구독
    lib/
      firebase.ts             ← 앱 초기화. 키 없으면 체험 모드만 동작. 에뮬레이터 연결 포함
      types.ts                ← DataApi 인터페이스가 여기 있습니다 (중요)
      db.ts                   ← Firestore 구현 + 교사 전용 함수
      localDb.ts              ← 체험 모드 구현 (db.ts 와 같은 DataApi)
      useActivity.ts          ← 활동지 한 장의 상태. 1.5초 자동 저장·제출·잠금
      pdf.ts                  ← 캡처 → A4 분할 → jsPDF. document.fonts.ready 대기
      code.ts                 ← 학급 코드 생성/정규화, 가상 이메일, 갤러리 별칭
      speech.ts  defaults.ts
    content/
      lessons.ts              ← ★ 학생용 문구가 전부 여기 있습니다
      glossary.ts             ← 어려운 낱말 뜻 풀이
      teacherGuide.ts         ← 차시별 지도 안내, 성취기준, 교육과정 연계표
      uiLimits.ts
    components/               ← ActivityShell, AutoSaveField, ThreeColumnSheet, HelpTooltip,
                                ExampleToggle, SentenceStarter, ReadAloudButton, PassCard,
                                WordCloud, RubricCard, StepNav, SaveBadge, States
    pages/
      landing/LandingPage.tsx
      auth/TeacherAuthPage.tsx  auth/StudentAuthPage.tsx
      student/  StudentHome, Session1, Session2, Session3, HomeCheck, SurveyPage
      teacher/  TeacherShell, Dashboard, ClassManage, LiveControl, Results, Stats,
                ExportPage, GuidePage
    report/                   ← StudentReport, ActivityReport, ParentLetter (인쇄·PDF용)
  tests/rules.test.ts         ← 에뮬레이터 보안 규칙 테스트 31건
```

### 구조상 꼭 알아야 할 두 가지

**(1) 학생 화면과 체험 화면은 같은 코드입니다.**
`App.tsx` 의 `studentRoutes()` 를 `/student` 와 `/trial` 두 곳에 똑같이 붙입니다. 다른 것은 `DataContext` 가 주입하는 데이터 통로뿐입니다(`createFirestoreDb` vs `createLocalDb`). **학생 화면에 기능을 추가하면 체험 모드에도 자동으로 반영되어야 합니다.** 화면 코드에서 `firebase/firestore` 를 직접 import 하지 말고 반드시 `useData().api` (= `DataApi`)를 거치세요. 새 데이터 동작이 필요하면 `lib/types.ts` 의 `DataApi` 에 메서드를 추가하고 **`db.ts` 와 `localDb.ts` 양쪽에 모두** 구현해야 합니다. 한쪽만 구현하면 타입 오류로 바로 잡힙니다.

**(2) 학생에게 보이는 모든 문구는 `content/lessons.ts` 에 있습니다.**
선생님이 나중에 화면 코드를 건드리지 않고 문구만 고칠 수 있도록 한 곳에 모았습니다. 새 문구를 화면 컴포넌트 안에 하드코딩하지 마세요.

---

## 4. 반드시 지켜야 할 제약 (원 명세의 "절대 규칙")

1. **외부 행사 관련 표현 금지** — 화면·문구·메타태그·주석·README 어디에도 `공모`, `공모전`, `우수사례`, `심사`, `출품`, `응모` 를 쓰지 마세요. 특정 학교 이름, 교사 개인 연락처, 외부 자문 인물 이름도 금지입니다. (학교 이름은 교사가 가입할 때 입력한 값만 화면에 표시)
   - 작업 후 반드시 확인: `grep -rn -E "공모|우수사례|심사|출품|응모" src public index.html README.md firestore.rules`
2. **말투** — 모든 안내 문구는 선생님이 학생에게 다정하게 설명하는 말투. 예) "지난주에 스마트폰을 얼마나 썼는지 확인해 볼까요?"
3. **쉬운 말** — 한 문장 25자 안팎, 한 화면 설명 문단 3줄 이하. 어려운 낱말(사료·초서·유배·주도성·알고리즘·포모 등)은 처음 나올 때 `<HelpTooltip term="...">` 으로 뜻 풀이를 붙입니다. 뜻 풀이는 `content/glossary.ts` 에 있습니다.
4. **역사적 사실** — 아래 8장의 사실만 사용하고 **사료 원문을 지어내지 마세요.** 학생용 사료는 모두 "쉽게 풀어 쓴 글"로 표시하고 출처를 함께 적습니다.
5. **개인정보 최소 수집** — 학생 실제 이메일·전화번호를 받지 않습니다. 사용 시간 같은 민감한 숫자는 본인과 담당 교사만 볼 수 있어야 합니다.
6. **무료 요금제 유지** — Storage·Functions 금지.
7. **과장·공포 조장 금지** — 숏폼을 설명할 때 "뇌가 망가진다" 같은 표현을 쓰지 않습니다. "스스로 멈추기 어려운 구조예요" 수준으로 씁니다.
8. 명세에 없는 기능을 임의로 추가하지 말고, 모호한 부분은 `// TODO(교사 확인)` 주석으로 남기세요.

---

## 5. 개발·검증 방법

```bash
cd dasan-time
npm install
cp .env.example .env.local     # 키가 없어도 체험 모드로 앱은 열립니다

npm run dev                    # 개발 서버
npm run build                  # 타입 검사 + 빌드 (경고 0건 유지할 것)
npm run test:rules             # 에뮬레이터 보안 규칙 테스트 31건
npm run emulators              # 에뮬레이터 직접 실행
npm run deploy                 # 빌드 후 hosting+firestore 배포
```

**에뮬레이터로 로그인 흐름까지 확인하려면** `.env.local` 에 아무 더미 값과 함께 `VITE_USE_EMULATOR=1` 을 넣고 `npm run emulators` 와 `npm run dev` 를 함께 띄우세요. **배포 전에는 `VITE_USE_EMULATOR` 를 반드시 비워야 합니다.**

```
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_PROJECT_ID=demo-dasan-time
VITE_FIREBASE_APP_ID=1:000000000000:web:demo
VITE_FIREBASE_AUTH_DOMAIN=demo-dasan-time.firebaseapp.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_USE_EMULATOR=1
```

### 각 단계가 끝나면 확인할 것

- [ ] `npm run build` 경고·오류 0건
- [ ] `npm run test:rules` 전부 통과
- [ ] 금지어 `grep` 결과 0건
- [ ] 휴대폰 너비 360px 에서 가로 스크롤 없음
- [ ] 로그인 없이 체험 모드 전체 흐름이 끝까지 동작

> Playwright 로 브라우저 검증을 하려면 `waitUntil: 'networkidle'` 을 쓰지 마세요. Firestore 가 실시간 구독 스트림을 계속 열어 두기 때문에 영원히 기다립니다. `domcontentloaded` + 명시적 대기를 쓰세요.

---

## 6. Firestore 데이터 구조와 보안 규칙

```
users/{uid}                   role, displayName, classId(학생), createdAt
teachers/{uid}                school, name, subject, email, createdAt
classCodes/{code}             classId, teacherUid, className, teacherName, joinOpen
classes/{classId}             teacherUid, name, code, school, teacherName,
                              sessions{pre,s1,s2,s3,home,post}: "locked"|"open"|"closed",
                              editLocked, commonTime{start,end}, voteClosed,
                              statNote{text,source,period}
classes/{classId}/students/{uid}                  name, number, loginId, group, joinedAt, active
classes/{classId}/numbers/{number}                uid  ← 번호 중복 가입 방지 자리 예약
classes/{classId}/submissions/{uid}_{activityId}  ownerUid, activityId, data, status,
                                                  updatedAt, praise(교사 쓰기·학생 읽기)
classes/{classId}/evals/{uid}_{activityId}        ownerUid, activityId, grade, memo ← 교사 전용
classes/{classId}/emotions/{autoId}               word, createdAt, hidden ← 작성자 uid 저장 안 함
classes/{classId}/groupBoards/{activityId}_{group} cells, notes, lastEditor, updatedAt
classes/{classId}/gallery/{uid}                   alias, card, visible, updatedAt
classes/{classId}/votes/{uid}                     picks[2], reason, updatedAt
```

활동 ID: `pre`, `s1_a1`, `s1_a2`, `s1_a3`, `s1_reflect`, `s2_a4_1`(모둠), `s2_a4_2`, `s2_a4_3`, `s2_reflect`, `s3_a5`, `s3_a6`, `s3_self`, `home_w1`~`home_w4`, `post`

### 보안 규칙이 지키는 것

- 교사는 자기 `teacherUid` 인 학급과 그 하위 문서 전체 읽기·쓰기
- 학생은 **자기 `submissions` 만** 읽기·쓰기 (`ownerUid == request.auth.uid`). 그래서 `s1_a1`(사용 시간)도 남이 볼 수 없음. 목록 조회도 `ownerUid` 로 걸러야만 통과
- `editLocked` 가 true 면 학생 쓰기 금지
- 학생은 `evals` 에 아예 접근 불가
- `emotions`/`gallery`/`groupBoards`/`votes` 는 같은 학급 학생만 읽기, 쓰기는 자기 것만 (`groupBoards` 는 같은 모둠만)
- `classCodes` 는 목록 훑기(`list`) 완전 차단
- 한 활동지 칸 개수 40개 제한. 칸별 500자 제한은 규칙 언어로 맵을 훑을 수 없어 클라이언트(`lib/defaults.ts` 의 `MAX_FIELD_LENGTH`)에서 자릅니다. **두 값을 함께 유지하세요.**

**규칙을 고치면 반드시 `npm run test:rules` 를 다시 돌리세요.**

---

## 7. 작업 중 발견해서 고친 문제 3건 (되돌리지 마세요)

이 3건은 원 명세를 그대로 구현했을 때 실제로 동작하지 않아 고친 것입니다. 배경을 모르고 "명세대로" 되돌리면 앱이 깨집니다.

### (1) 가입 직후 로그인 화면으로 튕기던 문제
`onAuthStateChanged` 가 프로필 문서(`users/{uid}`) 저장보다 **먼저** 발화합니다. 한 번 읽어서 없다고 포기하면 방금 가입한 학생이 로그인 화면으로 되돌아갑니다. → `AuthContext.tsx` 의 `roleWithRetry` 로 400ms 간격 5회 재시도합니다.

### (2) `classCodes` 를 로그인 없이 읽도록 연 것 — 명세 문구와 다름
명세 8-1 은 `classCodes` 를 "로그인한 사용자 누구나 `get`" 으로 정했지만, 명세 2-3 의 흐름(학급 코드 먼저 입력 → "○○ 선생님의 3학년 2반이 맞나요?" 확인 → 가입)은 **계정이 생기기 전**에 일어납니다. 두 조항이 충돌합니다. → `get` 만 비로그인 허용하고 `list` 는 완전히 차단했습니다. 이 문서에는 **학급 이름과 교사 이름만** 담고 학생 정보는 넣지 않습니다. 그래서 `classCodes` 에 `className`/`teacherName` 을 비정규화해 저장합니다(학급 이름을 바꾸면 `classCodes` 도 함께 갱신해야 합니다 — 현재 코드는 코드 재발급 시에만 갱신합니다. **개선 여지 있음**).

### (3) 번호 중복 검사를 자리 예약 문서로 바꾼 것
같은 이유로 학생은 가입 중에 학급 명단을 읽을 권한이 없습니다(다른 학생 이름이 새면 안 되므로). 명단을 조회해 비교하는 대신 `numbers/{번호}` 문서를 만들고 **이미 있으면 `create` 가 실패**하게 했습니다. 같은 순간에 두 명이 같은 번호를 잡는 경우까지 막힙니다. 교사가 번호를 바꾸거나 학생을 내보내면 자리도 함께 옮기거나 비웁니다(`ClassManage.tsx`).

---

## 8. 역사 콘텐츠 — 이 범위 밖으로 나가지 마세요

구체적인 날짜·숫자·원문 인용을 **새로 만들어 넣지 마세요.** 확실하지 않으면 `// TODO(교사 확인)` 주석을 답니다.

- 정약용(1762~1836), 호는 다산(茶山). 조선 후기 실학자.
- 1801년 신유박해에 연루되어 유배. 그해 겨울 전라도 강진으로 유배지가 옮겨짐.
- 강진 유배 초기에는 읍내 주막집의 방에서 지냈고, 그 방에 **사의재(四宜齋)** 라는 이름을 붙이고 「사의재기」를 지음. '네 가지를 마땅히 해야 할 방'이라는 뜻. 네 가지 다짐(쉽게 풀어 쓴 글): 생각은 맑게 / 용모(몸가짐)는 단정하게 / 말은 적게 / 행동은 무겁게(신중하게).
- 이후 **다산초당** 으로 거처를 옮겨 제자들과 공부하며 많은 책을 씀. 유배는 1818년에 풀림(약 18년).
- 대표 저술: 『경세유표』, 『목민심서』, 『흠흠신서』. 문집은 『여유당전서』.
- 두 아들에게 보낸 편지에서 **초서(鈔書)** 공부법을 권함.
- 스스로 쓴 묘지명인 「자찬묘지명」에 삶과 저술을 정리함.
- 사료 출처 표기 형식: `출처: 정약용, 「사의재기」, 『여유당전서』 (학생 눈높이에 맞게 쉽게 풀어 씀)`

**청소년 스마트폰 과의존 통계는 숫자를 하드코딩하지 않았습니다.** 교사가 '수업 안내 자료' 화면에서 값·출처·발표 시기를 입력하면 1차시 도입에 카드로 나타나고, 비워 두면 숨겨집니다(`classes.statNote`). 이 설계를 유지하세요.

---

## 9. 교육과정 연계 (`content/teacherGuide.ts` 에 구현되어 있음)

2022 개정 중학교 『역사』 (12) 조선 사회의 변동
- **[9역12-02]** 조선 후기 문화에서 나타난 변화를 분석한다.
- **[9역12-03]** 조선 후기 사회적 모순에 대한 여러 세력의 대응을 탐구한다.

평가 기준(학생에게도 미리 공개, `content/lessons.ts` 의 `RUBRIC`):

| 기준 | 학생용 쉬운 말 | 관련 차시 |
| --- | --- | --- |
| 사료 해석의 근거 명확성 | 사료에서 근거를 찾아 말했나요? | 1차시 |
| 주도성 개념 설명의 정확성 | '시간의 주도성'을 내 말로 설명했나요? | 2차시 |
| 산출물의 실행 가능성 | 내가 정한 규칙을 실제로 지킬 수 있나요? | 3차시·4주 |

---

## 10. 남은 일 (우선순위 순)

### A. 선생님이 직접 하셔야 하는 것 (코드 작업 아님)
1. Firebase 콘솔에서 프로젝트 생성 (`dongssam2021@gmail.com`) → Auth 이메일/비밀번호 사용 설정 → Firestore 서울 리전(`asia-northeast3`) 생성
2. `.env.local` 채우기 → `npm run deploy`
3. 배포 후 실제 기기(디벗 태블릿·학생 휴대폰)에서 한 번 훑어보기

절차는 `README.md` 4~5장에 단계별로 적혀 있습니다.

### B. 코드로 개선할 여지가 있는 것
1. **학급 이름 변경 시 `classCodes` 동기화** — 7-(2)에 적은 대로, 현재는 코드 재발급 때만 갱신됩니다. 교사가 학급 이름을 바꿔도 학생 가입 확인 화면에는 옛 이름이 보일 수 있습니다. `updateClass` 에서 `name` 이 바뀌면 `classCodes/{code}` 의 `className` 도 함께 갱신하도록 고치면 좋습니다.
2. **3차시 동료 평가 결과의 학생 화면 표시** — 현재 투표 마감 뒤 결과는 교사가 프로젝터로 보여 주는 방식입니다(학생은 보안 규칙상 남의 표를 읽을 수 없기 때문). 학생 화면에도 "많이 뽑힌 카드"를 보여 주려면 교사가 마감할 때 집계 결과를 학급 문서에 한 번 써 주는 방식이 필요합니다.
3. **접근성 점검** — `aria-label`·역할 속성은 넣어 두었지만, 키보드만으로 전체 흐름 탐색과 스크린 리더 호환성을 실제 보조기기로 점검한 적은 없습니다. 색상 대비(WCAG AA)도 미점검입니다.
4. **문구 검수** — 한 문장 25자 안팎 기준을 모든 문구가 지키는지 선생님과 함께 훑어보면 좋습니다.
5. **4주 실천 알림** — 현재는 학생이 직접 들어와서 기록합니다. 무료 요금제(Functions 금지)에서는 푸시 알림을 만들 수 없으므로, 교사가 수업 시간에 안내하는 방식을 유지해야 합니다.

### C. 하지 말아야 할 것
- Storage·Functions 도입 (유료 전환)
- daisyUI 테마 추가, 상태 관리 라이브러리 추가
- `html2canvas-pro` → `html2canvas` 되돌리기
- 7장의 3가지 수정 되돌리기
