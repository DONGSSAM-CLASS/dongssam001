# 다산의 시간

> 스크롤은 멈추고 GO! 몰입은 배우고 GO!

중학교 3학년 역사 수업(2022 개정 교육과정, 조선 사회의 변동)에서 학생들이 **정약용의 유배 생활과 공부법**을 탐구하고, 이를 근거로 **자신의 스마트폰 사용 규칙을 스스로 설계·실천**하도록 돕는 수업용 웹앱입니다.

- **구조**: 3차시 교실 수업 + 4주 가정 실천 (“3+1” 구조)
- **대상**: 중학교 3학년 (기초학력이 낮은 학생도 혼자 따라올 수 있도록 설계)
- **배포**: Firebase Hosting (무료 Spark 요금제)

---

## 1. 무엇이 들어 있나요

| 구분 | 내용 |
|---|---|
| 사전·사후 마음 점검 | 같은 문항으로 두 번 응답, 학급 전체 비율로만 통계 표시 |
| 1차시 | 나의 스마트폰 성적표 / 감정 지도 / 「사의재기」 사료 학습지 / 성찰일지 |
| 2차시 | 숏폼의 뇌 vs 다산의 뇌 모둠 탐구표 / 초서 실습 / 시간의 주도성 서답형 / 성찰일지 |
| 3차시 | 나만의 다산초당 출입증 / 갤러리 워크와 동료 평가 / 자기 평가와 성찰일지 |
| 4주 실천 | 주차별 자기점검, 규칙 수정, 보호자 응원 한 줄, 완주 배지 |
| 교사 화면 | 대시보드 · 학급 관리 · 수업 진행(실시간 제어) · 학생 결과물 · 통계 · PDF 내보내기 · 수업 안내 자료 |
| 체험 모드 | 로그인 없이 전체 흐름 체험 (기록은 이 기기의 localStorage 에만 남음) |

---

## 2. 기술 스택

- Vite + React 18 + TypeScript
- React Router v6 (BrowserRouter + Hosting rewrite)
- Tailwind CSS v4 (`@tailwindcss/vite`) + daisyUI v5 (테마는 `cupcake` 하나만)
- lucide-react 아이콘, Pretendard 글꼴(CDN)
- Firebase JS SDK v10 (modular) — **Authentication + Cloud Firestore + Hosting 만 사용**
- PDF: `jspdf` + `html2canvas-pro`, 학급 전체 묶음은 `jszip`
- 교사용 차트: `recharts`
- 상태 관리: React Context + 커스텀 훅 (별도 상태 라이브러리 없음)

> **왜 `html2canvas-pro` 인가요?**
> Tailwind v4·daisyUI v5 는 `oklch()` 색을 쓰기 때문에 기존 `html2canvas` 로는 캡처 중 오류가 납니다.
> 한글이 깨지지 않도록 PDF 는 “A4 리포트 화면을 캡처 → 이미지로 jsPDF 에 넣는” 방식으로 만들고,
> 내용이 길면 A4 높이 기준으로 잘라 여러 쪽으로 저장합니다. 캡처 전에 `document.fonts.ready` 를 기다립니다.

**Storage 와 Cloud Functions 는 쓰지 않습니다.** (둘 다 Blaze 요금제가 필요합니다.)

---

## 3. 처음 실행하기

```bash
cd dasan-time
npm install
cp .env.example .env.local   # 값은 아래 4단계에서 채웁니다
npm run dev
```

`.env.local` 이 비어 있어도 앱은 열립니다. 이때는 랜딩 화면에서 **‘먼저 체험해 보기’** 만 쓸 수 있습니다.

---

## 4. Firebase 설정 (단계별)

### 4-1. 프로젝트 만들기
1. <https://console.firebase.google.com> 에 **dongssam2021@gmail.com** 계정으로 로그인합니다.
2. **프로젝트 추가** → 이름을 정합니다(예: `dasan-time`). Google 애널리틱스는 꺼도 됩니다.

### 4-2. Authentication
1. 왼쪽 메뉴 **빌드 → Authentication → 시작하기**
2. **로그인 방법** 탭에서 **이메일/비밀번호** 를 **사용 설정** 합니다.
3. (선택) **설정 → 승인된 도메인** 에 배포 도메인이 들어 있는지 확인합니다.

> 학생은 실제 이메일을 쓰지 않습니다. 앱이 내부적으로 `아이디@students.dasan-time.app` 형태의 가상 이메일로 계정을 만듭니다. 학생 로그인 화면에는 아이디와 비밀번호만 보입니다.

### 4-3. Firestore 데이터베이스
1. **빌드 → Firestore Database → 데이터베이스 만들기**
2. 위치는 **`asia-northeast3` (서울)** 를 고릅니다.
3. 모드는 **프로덕션 모드**로 시작합니다. (규칙은 6단계에서 배포합니다.)

### 4-4. 웹 앱 등록과 환경 변수
1. **프로젝트 설정(톱니바퀴) → 내 앱 → 웹(`</>`)** 으로 앱을 추가합니다.
2. **SDK 설정 및 구성** 에 나오는 값을 `.env.local` 에 옮겨 적습니다.

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env.local` 은 `.gitignore` 에 들어 있어 저장소에 올라가지 않습니다.

### 4-5. CLI 준비

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # 위에서 만든 프로젝트를 고르고 별칭을 default 로 지정
```

---

## 5. 배포

```bash
npm run build
firebase deploy --only hosting,firestore
```

한 번에 하려면:

```bash
npm run deploy
```

`firebase.json` 에는 SPA rewrite(`** → /index.html`)와 정적 파일 캐시 헤더가 들어 있습니다.

---

## 6. 보안 규칙 테스트

```bash
npm run test:rules
```

Firestore 에뮬레이터를 띄워 `firestore.rules` 를 검사합니다. 확인하는 내용:

- 다른 학급 문서 접근 차단
- **다른 학생의 결과물 읽기 차단** (사용 시간이 든 `s1_a1` 포함, 목록 조회도 차단)
- **학생의 `evals`(교사 평가) 읽기·쓰기 차단**
- `editLocked` 가 켜지면 학생 쓰기 차단
- 다른 모둠 보드 쓰기 차단, 남의 투표 읽기·쓰기 차단
- `classCodes` 목록 훑기 차단 (단건 조회만 허용)
- 이미 잡힌 번호를 다른 학생이 가져갈 수 없음, 남의 uid 로 번호를 잡을 수 없음

---

### 설계 메모 — `classCodes` 는 왜 로그인 없이 읽히나요

학생은 **가입하기 전에** 학급 코드를 넣고 “○○ 선생님의 3학년 2반이 맞나요?”를 확인합니다.
그 시점에는 아직 계정이 없으므로, `classCodes/{code}` 문서 **하나**는 로그인 없이 읽을 수 있어야 합니다.
대신 이렇게 막아 두었습니다.

- 목록 훑기(`list`)는 완전히 차단 — 6자리 코드를 모르면 아무것도 알아낼 수 없습니다.
- 이 문서에는 **학급 이름과 교사 이름만** 들어 있습니다. 학생 정보·결과물·사용 시간은 들어 있지 않습니다.
- 가입을 잠그면(`joinOpen: false`) 코드를 알아도 가입할 수 없습니다.

번호 중복 가입도 같은 이유로 `numbers/{번호}` 자리 예약 문서로 막습니다.
학생은 가입 중에 학급 명단을 읽을 권한이 없기 때문에(다른 학생 이름이 새면 안 되므로),
명단을 조회해 비교하는 대신 번호마다 문서를 하나 만들고 **이미 있으면 만들기가 실패하도록** 했습니다.
같은 순간에 두 명이 같은 번호를 잡는 일도 생기지 않습니다.

---

## 7. 개인정보 보호

- 학생의 **실제 이메일·전화번호를 받지 않습니다.**
- **사용 시간 숫자는 본인과 담당 교사만** 볼 수 있습니다. 감정 지도·갤러리·통계 어디에도 다른 학생에게 노출되지 않습니다.
- 감정 지도에는 **작성자 uid 를 저장하지 않습니다.**
- 갤러리에는 이름 대신 **익명 별칭**(예: “초당 친구 07”)만 나옵니다. 학생이 “갤러리에 올리지 않기”를 고를 수 있습니다.
- 교사 평가 등급과 메모는 별도 컬렉션(`evals`)에 두고 보안 규칙으로 학생 접근을 막습니다. 학생 화면에는 **칭찬 한 줄만** 보입니다.
- PDF 내보내기의 “사용 시간 숫자 포함” 옵션은 **기본값이 제외**입니다.

---

## 8. 무료(Spark) 요금제 한도와 예상 사용량

Spark 요금제의 Firestore 일일 한도는 대략 다음과 같습니다.

| 항목 | 일일 한도 |
|---|---|
| 문서 읽기 | 50,000회 |
| 문서 쓰기 | 20,000회 |
| 문서 삭제 | 20,000회 |
| 저장 용량 | 1GiB |

**한 학급(30명) 기준 한 차시 예상 사용량**

| 동작 | 대략 횟수 |
|---|---|
| 학급 문서·내 결과물 실시간 구독 | 학생 1명당 10~20회 읽기 |
| 자동 저장(1.5초 멈춤 기준) | 학생 1명당 20~40회 쓰기 |
| 감정 지도 실시간 반영 | 학급 전체 200~600회 읽기 |
| 교사 대시보드 실시간 구독 | 교사 1명당 300~800회 읽기 |

→ 한 학급이 한 차시를 진행하면 대체로 **읽기 2,000회 안팎, 쓰기 1,000회 안팎**입니다.
하루에 **여러 학급(5~6개 반)이 연달아 수업해도 무료 한도 안**에 들어옵니다.

읽기를 줄이는 방법:
- 감정 지도·갤러리 프로젝터 모드는 필요한 순간에만 열어 두세요(계속 켜 두면 실시간 구독이 이어집니다).
- 수업이 끝나면 ‘수업 진행’ 화면에서 해당 차시를 **닫음**으로 바꿔 주세요.

---

## 9. 폴더 구조

```
src/
  app/        라우터, 레이아웃, 인증 가드, Context (Auth · Data · Teacher)
  lib/        firebase.ts, db.ts, localDb.ts, pdf.ts, speech.ts, code.ts, useActivity.ts
  content/    lessons.ts(모든 학생용 문구), glossary.ts(뜻 풀이), teacherGuide.ts
  components/ ThreeColumnSheet, HelpTooltip, ExampleToggle, SentenceStarter,
              AutoSaveField, ReadAloudButton, PassCard, WordCloud, StepNav …
  pages/
    landing/  auth/
    student/  StudentHome, Session1, Session2, Session3, HomeCheck, SurveyPage
    teacher/  TeacherShell, Dashboard, ClassManage, LiveControl, Results, Stats, ExportPage, GuidePage
  report/     StudentReport.tsx, ActivityReport.tsx, ParentLetter.tsx (인쇄·PDF용)
tests/        rules.test.ts (에뮬레이터 보안 규칙 테스트)
```

- **학생에게 보이는 문구는 모두 `src/content/lessons.ts` 에 모여 있습니다.** 화면 코드를 건드리지 않고 문구만 고칠 수 있습니다.
- 체험 모드는 `db.ts` 와 같은 인터페이스(`DataApi`)를 가진 `localDb.ts` 로 구현해서, 학생 화면 코드를 그대로 다시 씁니다.

---

## 10. Firestore 데이터 구조

```
users/{uid}                   role, displayName, classId(학생), createdAt
teachers/{uid}                school, name, subject, email, createdAt
classCodes/{code}             classId, teacherUid, className, teacherName, joinOpen
classes/{classId}             teacherUid, name, code, school, teacherName,
                              sessions{pre,s1,s2,s3,home,post}, editLocked,
                              commonTime{start,end}, voteClosed, statNote{text,source,period}
classes/{classId}/students/{uid}                  name, number, loginId, group, joinedAt, active
classes/{classId}/numbers/{number}                uid  ← 번호 중복 가입 방지용 자리 예약
classes/{classId}/submissions/{uid}_{activityId}  ownerUid, activityId, data, status, updatedAt, praise
classes/{classId}/evals/{uid}_{activityId}        ownerUid, activityId, grade, memo  ← 교사 전용
classes/{classId}/emotions/{autoId}               word, createdAt, hidden           ← 작성자 저장 안 함
classes/{classId}/groupBoards/{activityId}_{group} cells, notes, lastEditor, updatedAt
classes/{classId}/gallery/{uid}                   alias, card, visible, updatedAt
classes/{classId}/votes/{uid}                     picks[2], reason, updatedAt
```

활동 ID: `pre`, `s1_a1`, `s1_a2`, `s1_a3`, `s1_reflect`, `s2_a4_1`(모둠), `s2_a4_2`, `s2_a4_3`, `s2_reflect`, `s3_a5`, `s3_a6`, `s3_self`, `home_w1`~`home_w4`, `post`

---

## 11. 명령어

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 검사 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리 보기 |
| `npm run deploy` | 빌드 후 Hosting·Firestore 배포 |
| `npm run test:rules` | 에뮬레이터로 보안 규칙 테스트 |
| `npm run emulators` | 에뮬레이터 직접 실행 |

에뮬레이터로 개발하려면 `.env.local` 에 `VITE_USE_EMULATOR=1` 을 넣고 `npm run emulators` 와 `npm run dev` 를 함께 띄우세요. **배포할 때는 이 값을 반드시 비워 두세요.**

---

## 12. 수업 운영 순서 (요약)

1. 교사가 회원가입하고 학급을 만듭니다. → 6자리 학급 코드가 생깁니다.
2. ‘수업 진행’에서 **사전 점검**을 엽니다. 학급 코드를 **크게 보기**로 띄워 학생 가입을 안내합니다.
3. ‘학급 관리’에서 모둠(1~8)을 배정합니다.
4. 차시를 하나씩 **열림**으로 바꿔 수업을 진행합니다. 수업이 끝나면 **닫음**으로 바꿉니다.
5. 3차시가 끝나면 **4주 실천**을 엽니다. 가정 안내문을 인쇄해 보냅니다.
6. 4주 뒤 **사후 점검**을 열고, ‘통계’에서 사전·사후를 비교합니다.
7. ‘PDF 내보내기’에서 개인 포트폴리오나 학급 전체 ZIP 을 받습니다.

> 통계 화면에는 “비교 집단이 없는 학급 단위 결과라서, 변화의 원인을 수업 하나로만 단정하기는 어려워요.”라는 안내가 항상 함께 표시됩니다.

---

## 13. 역사 콘텐츠 범위

앱에 담긴 역사 서술은 다음 범위로 한정했습니다. 사료 원문을 지어내지 않았고, 학생용 사료는 모두 **“쉽게 풀어 쓴 글”**로 표시하고 출처를 함께 적었습니다.

- 정약용(1762~1836), 호는 다산(茶山). 조선 후기 실학자.
- 1801년 신유박해에 연루되어 유배. 그해 겨울 전라도 강진으로 유배지가 옮겨짐.
- 강진 유배 초기에는 읍내 주막집의 방에서 지냈고, 그 방에 **사의재(四宜齋)** 라는 이름을 붙이고 「사의재기」를 지음. 네 가지 다짐: 생각은 맑게 / 용모는 단정하게 / 말은 적게 / 행동은 무겁게.
- 이후 **다산초당**으로 거처를 옮겨 제자들과 공부하며 많은 책을 씀. 유배는 1818년에 풀림(약 18년).
- 대표 저술: 『경세유표』, 『목민심서』, 『흠흠신서』. 문집은 『여유당전서』.
- 두 아들에게 보낸 편지에서 **초서(鈔書)** 공부법을 권함.
- 스스로 쓴 묘지명인 「자찬묘지명」에 삶과 저술을 정리함.

청소년 스마트폰 이용 통계는 **앱에 숫자를 넣어 두지 않았습니다.** ‘수업 안내 자료’ 화면에서 선생님이 값·출처·발표 시기를 직접 입력하시면 1차시 도입 화면에 카드로 나타나고, 비워 두시면 카드가 숨겨집니다.
