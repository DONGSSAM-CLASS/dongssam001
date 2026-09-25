# Codex 인수인계 문서 — 냉전의 목격자

이 폴더(`cold-war-witness/`)는 **「냉전의 목격자 — 감시 속에서 내리는 선택」** 입니다.
중학교 2학년 역사 **6차시 「디지털 인공지능 윤리 콘텐츠 창작 및 발표 수업」** 의 모든 차시에서 쓰는 웹앱이며
(냉전 의사결정 시뮬레이션 + 모둠 AI 윤리 콘텐츠 기획·창작·발표),
2026 인공지능 윤리교육 콘텐츠 공모전(과학기술정보통신부·정보통신정책연구원) 출품작입니다.
개발자: 동쌤 김동은(번동중학교).

**앱 기능은 모두 완성·검증되었고, 남은 핵심 일은 Firebase 새 프로젝트 생성과 배포입니다.** (6장)

---

## 0. 30초 요약

- 6차시 흐름: 1차시 활동 안내·모둠 편성·역할 분담 → 2차시 사건 파일 탐구(시뮬레이션)·기획서 → 3차시 기획서 완성·윤리 점검·동료 검토·교사 승인
  → 4~5차시 창작(스토리보드·AI 활용 기록·출처·최종 점검·링크 제출) → 6차시 발표·루브릭 상호 평가·실천 선언문·인증서.
- 사건 파일: 냉전 시대의 평범한 시민(가상 인물)이 되어 장면 5개에서 선택하고, “실제 역사에서는?” 사실 카드를 본 뒤 AI 시대 연결 성찰을 써서 원칙 카드를 받습니다. 이 사실 카드가 모둠 콘텐츠의 역사 근거가 됩니다.
- 「대한민국 인공지능 윤리원칙」(2026. 8. 21.) 원문(3대 가치·7대 원칙·세부 항목·이용자 역할)을 그대로 싣고, **윤리 점검표의 근거 = 원문의 ‘이용자’ 역할 문장**입니다.
- 교사는 Google 로그인 → 학급 생성(6자리 코드) → ‘지금 차시’ 1~6·모둠 수 → 모둠 현황·기획서 승인·발표 평가·개인 현황·선택 분포·성찰 열람·발표 모드·CSV(학생별·모둠별)·PIN 초기화·학급 삭제.
- 스택: **Vite 6 + React 18 + TypeScript + Tailwind CSS 4 + daisyUI 5(cupcake 테마) + lucide-react + Pretendard(npm 번들)**,
  **Firebase(Authentication · Cloud Firestore · Hosting)** — **Spark(무료) 요금제 전용, Cloud Functions 없음.**
- 권한 통제는 전부 `firestore.rules` 가 합니다. 규칙 테스트 60개, 콘텐츠·단위 테스트 42개, 브라우저 6차시 E2E·키보드·접근성 검사 모두 통과한 상태입니다.

---

## 1. 시작하기

```bash
cd cold-war-witness
npm install                  # Node 20 이상 (개발은 Node 22 로 함)

# 로컬 개발 (Firebase 에뮬레이터 — 실제 프로젝트 없이도 전 기능 동작)
npm run emulators            # 터미널 ① Auth 9099, Firestore 8080 (Java 필요)
npm run dev:emu              # 터미널 ② http://localhost:5173  (.env.emulator 사용)

# 검사
npm test                     # 콘텐츠 구조 + 단위 테스트 (42개)
npm run test:rules           # 보안 규칙 테스트 — 에뮬레이터 자동 기동 (60개)
npm run build                # 타입 검사 + 프로덕션 빌드
npm run e2e                  # (에뮬레이터 + dev:emu 켠 상태에서) 브라우저 전체 흐름 + 키보드 + axe 접근성
                             # 처음 한 번: npx playwright install chromium

# 검토용 문서 다시 만들기
npm run facts:doc            # docs/fact-cards.md
npm run curriculum:doc       # docs/curriculum-map.md
```

- `.env.local`(실제 Firebase 값)은 git 에 없습니다. 6장에서 만듭니다.
- `.env.emulator` 는 데모 값이라 커밋되어 있습니다(저장소 루트 `.gitignore` 가 `.env.*` 를 막아서 `git add -f` 로 넣음).

---

## 2. 폴더 구조

```
cold-war-witness/
├── CODEX_HANDOFF.md / CODEX_PROMPT.md   ← 이 문서들
├── README.md                ← 교사용: Firebase 콘솔 설정·배포·수업 운영 안내
├── firebase.json            ← Hosting(SPA rewrite, 보안 헤더·CSP) + Firestore + 에뮬레이터 포트
├── .firebaserc              ← default 프로젝트 id (지금은 자리표시자 "cold-war-witness" → 6장에서 교체)
├── firestore.rules          ← ★ 백엔드 역할. 한국어 주석으로 설계 설명
├── docs/
│   ├── work-log.md          ← 단계별 작업 로그, ★[검증필요] 목록, 결정 사항, 제안(미구현)
│   ├── data-model.md        ← Firestore 구조·권한표·PIN 설계
│   ├── fact-cards.md        ← 사실 카드 23장 검토표 (자동 생성)
│   └── curriculum-map.md    ← 교육과정 연계표 (자동 생성)
├── src/
│   ├── config.ts            ← APP_TITLE, 입력 길이 제한(LIMITS), 안내 문구
│   ├── data/                ← ★ 모든 콘텐츠 (교사가 문장만 고치는 곳)
│   │   ├── project.ts       ← ★ 6차시·활동·역할·형식·기획서 항목·윤리 점검표·제작 단계·AI 활용 기록·루브릭
│   │   ├── scenarios.ts     ← 사건 파일(챕터) 3개: 인물·인트로·장면·선택·결과·성찰 질문·문장 시작 도우미·교육과정 연계
│   │   ├── facts.ts         ← 사실 카드 23장 + 출처
│   │   ├── principles.ts    ← 7대 원칙·3대 가치 (official·aspects 는 원문 그대로 — 고치지 말 것)
│   │   ├── curriculum.ts    ← 2022 개정 역사과 · 한국형 사회정서교육 교육과정 원문 인용 + SESSION_CURRICULUM(차시별 연계)
│   │   ├── lessonMaterials.ts ← 6차시 과정안·활동지·교사용 가이드
│   │   ├── emotions.ts, appInfo.ts
│   ├── types/content.ts, types/db.ts
│   ├── lib/                 ← db.ts(모든 Firestore 읽기·쓰기), hash.ts(PIN 해시), project.ts(차시 열림·검토 짝·점검·평균), progress/stats/csv/josa 등
│   ├── app/                 ← AuthContext, StudentContext(학생·학급·내 모둠 실시간 구독), useGroups
│   ├── components/          ← ui.tsx(공통 부품), project.tsx(공동 편집 칸 SharedText·ChipPicker·StarRadio 등), 카드·차트·아이콘
│   └── pages/               ← student/(project/ 6차시 활동) · teacher/(GroupTabs 모둠 탭) · print/ · LandingPage · AboutPage
└── tests/
    ├── content.test.ts      ← 콘텐츠 구조, 교육과정 원문 일치
    ├── unit.test.ts         ← 계산 함수 + ★규칙의 id 목록이 앱 데이터와 같은지
    ├── rules.test.ts        ← 보안 규칙 (에뮬레이터)
    └── e2e/flow.mjs, keyboard.mjs
```

---

## 3. 반드시 지켜야 할 것

### ① 역사적 정확성 (가장 중요)
- 사건·날짜·수치·실존 인물의 행동은 **`src/data/facts.ts` 의 사실 카드에만** 씁니다. 새 사실을 만들어 넣지 마세요.
  꼭 필요하면 `needsCheck: true` + `docs/work-log.md` 의 [검증필요] 목록에 추가.
- 실존 인물의 말을 따옴표로 직접 인용하지 않습니다(간접 서술만).
- 주인공·주변 인물은 가상 인물입니다. 챕터 화면 하단 안내 문구(`FictionNotice`)를 없애지 마세요.
- **진영 균형**: 동독과 미국 모두의 감시·인권 침해를 다룹니다. 한쪽을 선·악으로 그리지 않습니다.
- `c3-b59` 카드의 “후일 증언에 따르면”, `c2-huac` 카드의 “매카시 상원의원이 아니라 하원 위원회” 표현은 테스트로 고정되어 있습니다.

### ② id 는 세 곳이 함께 움직인다
장면 id(`ch1-s1`), 답변 id(`ch1-q1`, `ch1-wrap`), 단계(`intro…done`), 감정 id, 원칙 id, **사실 카드 id, 세부 항목 태그, 가치 id, 역할 id, 형식 id, 제작 단계 id, 점검 문항 id, 스토리보드 칸 id** 는
`src/data/*` · `firestore.rules`(sceneIds/answerIds/…/factIds/aspectTags/roleIds/formatIds/stageIds/checkIds/cutIds 함수) · 저장된 데이터가 같이 씁니다.
**장면·질문을 추가하거나 id 를 바꾸면 `firestore.rules` 도 고쳐야 하고, `npm test` 가 어긋남을 잡아 줍니다.**
입력 길이 제한도 `config.ts` 의 `LIMITS` 와 규칙이 같아야 합니다(역시 테스트로 확인).

### ③ Firestore 쓰기는 `src/lib/db.ts` 로만, 새 경로는 규칙 먼저
규칙에 없는 경로는 기본 거부입니다. 새 컬렉션·필드는 규칙을 먼저 열고 `tests/rules.test.ts` 에
“되는 경우 / 안 되는 경우” 테스트를 함께 추가하세요.
**모둠 문서 규칙은 요청당 식 1000개 한도에 걸리기 쉽습니다.** 그래서 고칠 때는 바뀐 칸만 검사합니다(`okGroupChange`). 검사를 늘릴 때는 “모둠 8개 한 배치로 만들기” 테스트가 계속 통과하는지 확인하세요.

### ④ PIN 설계를 되돌리지 말 것
학생 기록 문서 id = `SHA-256("cold-war-witness/v1:classId:번호:PIN")`.
PIN 원문은 어디에도 저장하지 않고, 문서 주소를 아는 것이 곧 PIN 증명입니다.
(초기 설계였던 “문서 안 pinHash 필드 비교”는 필드를 아예 안 보내면 규칙을 통과하는 구멍이 있어 버렸습니다 — `docs/data-model.md` 4절)
번호 중복은 `seats/{번호}` 문서로 막습니다. 교사 PIN 초기화는 “새 주소로 기록 복사 + 옛 문서 삭제 + seats 갱신”을 한 배치로 합니다.

### ⑤ 명세에 없는 기능은 만들지 않는다
사용자(교사)의 원칙입니다. 필요해 보이면 “제안”으로만 말하고 확인을 받으세요.
이미 넣은 작은 추가 요소와 그 이유는 `docs/work-log.md` “명세에 없지만 넣은 것” 표에 있습니다.

### ⑥ UI 원칙
- 모든 문구는 한국어, 중학생 눈높이(짧은 문장, 어려운 한자어는 풀어서).
- 본문 16px 이상, 버튼 높이 48px 이상, 명도 대비 WCAG AA, 키보드로 진행 가능, “움직임” 끄기 스위치 유지.
- 디자인: daisyUI **cupcake** 테마 하나, 아이콘은 **lucide-react**(감정 체크 5종만 이모지), 글꼴 **Pretendard**.
  색은 `src/index.css` 에서 `paper/ink/line/stamp/declass` 이름을 cupcake 테마 색에 연결해 둠. 챕터 색은 `[data-chapter]`.
- 외부 분석 도구(GA 등)·외부 AI API 호출 금지. 학생 실명·이메일·전화번호를 받지 않음.

### ⑦ 저장소 범위
이 저장소에는 다른 수업 앱들이 함께 있습니다. **`cold-war-witness/` 밖의 파일은 건드리지 마세요.**

---

## 4. 현재 상태

| 항목 | 상태 |
|---|---|
| Phase 1~6 (세팅·콘텐츠·학생·교사·규칙·점검) | ✅ 완료 |
| 첨부 교육과정 원문 반영 (역사 [9역07-01·02], K-SEL 4대 역량·[9정서] 성취기준) | ✅ |
| 디자인 교체 (daisyUI cupcake · lucide · Pretendard) | ✅ |
| 6차시 모둠 프로젝트로 재구성 + 「대한민국 인공지능 윤리원칙」 원문 반영 | ✅ |
| 테스트: 콘텐츠·단위 42 / 규칙 60 / 6차시 E2E(교사 1·학생 2·모둠 2)·키보드·axe 위반 0 / 360px 가로 넘침 0 | ✅ |
| **Firebase 프로젝트 생성·배포** | ❌ 미완료 (6장) |
| 실제 Google 로그인 팝업 동작 확인 | ❌ 배포 후 확인 필요 |
| [검증필요] 항목(출처 URL 등) 교사 검토 | ⏳ 교사 몫 |

최근 커밋(모두 `main` 에 푸시됨):
```
0ee0a18 6차시 「디지털 인공지능 윤리 콘텐츠 창작 및 발표 수업」으로 재구성
5fc3964 Codex 인수인계 문서와 이어서 작업할 프롬프트 추가
007e15a 디자인 교체 (daisyUI cupcake · lucide · Pretendard)
8f301c7 Phase 6: E2E·접근성·키보드 점검과 수정, 배포 안내
3471e73 Phase 3~5: 학생 화면, 교사 대시보드, 인쇄 자료, 보안 규칙
18165e8 Phase 2 보완: 첨부 교육과정 원문 반영
facc482 Phase 2: 콘텐츠 데이터
b1daaf6 Phase 1: 뼈대·타입·데이터 구조
```

---

## 5. 이전 작업 환경(Claude Code 원격 컨테이너)에서 막혔던 것 — 참고

- 외부 접속 제한으로 **`apis.google.com`, `auth.firebase.tools`, `cdn.jsdelivr.net`, Google Fonts, 사실 카드 출처 사이트**에 접속할 수 없었습니다.
  - 그래서 **`firebase login` 을 할 수 없어 배포를 못 했습니다.** (교사 PC 에서는 문제없음)
  - E2E 의 교사 로그인은 Google 팝업 대신 Auth 에뮬레이터의 테스트용 Google 자격 증명으로 했습니다
    (`tests/e2e/flow.mjs` — dev 서버의 `/src/lib/firebase.ts` 모듈을 불러와 `signInWithCredential`). 실제 팝업은 배포 후 확인 필요.
  - Pretendard 는 CDN 대신 npm 패키지 `pretendard` 를 번들에 포함했습니다(학교망에도 유리). CSP 는 `font-src 'self'`.
- 컨테이너에 UTF-8 로캘이 없어 한글 파일 이름 내려받기가 `download` 로 바뀌었습니다 → E2E 는 브라우저를 `LANG=C.UTF-8` 로 띄웁니다. 앱 문제 아님.
- 배포를 위해 만들었던 OAuth 로그인 링크는 **사용되지 않았고 토큰도 받지 않았습니다.** 폐기할 것 없음.

---

## 6. 남은 작업 ① — Firebase 새 프로젝트 만들고 배포 (계정: dongssamplay@gmail.com)

> 교사 PC 에서 진행하세요. Firebase CLI 는 devDependency 로 들어 있습니다(`npx firebase`).

### 6-1. 로그인 (교사가 직접)
```bash
cd cold-war-witness
npx firebase login            # 브라우저에서 dongssamplay@gmail.com 선택
npx firebase login:list       # 로그인 계정 확인
```

### 6-2. 프로젝트 만들기 (CLI)
```bash
# 프로젝트 id 는 전 세계에서 유일해야 함. 이미 있으면 뒤에 숫자를 붙인다.
npx firebase projects:create cold-war-witness --display-name "냉전의 목격자"
#   (실패 시 예: cold-war-witness-2026, cold-war-witness-dongssam)
```
- Google 애널리틱스는 켜지 않습니다(학생 개인정보). 요금제는 **Spark(무료) 유지**, 결제 계정 연결 금지.
- 프로젝트 수 한도로 실패하면 교사에게 알리고 콘솔에서 만들도록 안내.

### 6-3. `.firebaserc` 교체
```json
{ "projects": { "default": "<만든 프로젝트 id>" } }
```

### 6-4. 웹 앱 등록 → `.env.local`
```bash
npx firebase apps:create WEB "냉전의 목격자" --project <id>
npx firebase apps:sdkconfig WEB <표시된 appId> --project <id>
```
출력값으로 `cold-war-witness/.env.local` 작성 (`.env.example` 참고, `VITE_USE_EMULATOR=` 는 비워 둠):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=<id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<id>
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_EMULATOR=
```

### 6-5. Firestore 데이터베이스 (서울)
```bash
npx firebase firestore:databases:create "(default)" --location=asia-northeast3 --project <id>
```
(CLI 가 지원하지 않으면 콘솔: 빌드 → Firestore Database → 데이터베이스 만들기 → `asia-northeast3` → 프로덕션 모드)

### 6-6. 로그인 방법 켜기 — ★콘솔에서 교사가 클릭해야 함
콘솔 → 빌드 → **Authentication → 시작하기 → 로그인 방법**
- **Google** 사용 설정 (프로젝트 지원 이메일: dongssamplay@gmail.com) ← 웹 OAuth 클라이언트가 자동으로 만들어지므로 콘솔에서만 가능
- **익명** 사용 설정
- 설정 → 승인된 도메인에 `<id>.web.app`, `<id>.firebaseapp.com` 이 있는지 확인

### 6-7. 배포
```bash
npm test                    # 42개 통과
npm run test:rules          # 60개 통과 (Java 필요. 없으면 생략 가능 — 이미 검증됨)
npm run deploy              # 빌드 + Hosting + Firestore 규칙·인덱스 배포
```
→ `https://<id>.web.app`

### 6-8. 배포 후 확인 (실제 브라우저)
1. 선생님 로그인(Google 팝업) 성공 — **이전 환경에서 확인 못 한 부분**
2. 학급 만들기 → 코드 발급 → 모둠 수 2개
3. 시크릿 창/다른 기기에서 학생 입장 → 모둠 고르기·역할 → 교사 ‘모둠 현황’에 보이는지
4. ‘지금 차시’ 2 → 학생 사건 파일 장면 1 저장 → 기획서 한 칸 쓰기 → 다른 창의 같은 모둠 학생 화면에 반영되는지
5. 선택 분포 공개 켜기 → 학생 사건 파일 마무리 화면에 분포가 보이는지
6. Pretendard 글꼴이 적용되는지, 콘솔(F12)에 CSP 오류가 없는지
7. 확인이 끝나면 테스트용 학급은 ‘학급 관리 → 학급 삭제’로 지우기

### 6-9. (선택 — 교사가 원할 때만) GitHub Actions 자동 배포
저장소의 `.github/workflows/tycoon-deploy.yml` 과 같은 방식으로 `cold-war-witness-deploy.yml` 을 만들 수 있습니다.
명세에 없으므로 **교사에게 먼저 물어보고** 진행하세요. (필요 Secret: 서비스 계정 JSON, VITE_FIREBASE_* 값)

---

## 7. 남은 작업 ② — 교사 검토 대기 (코드로 해결 불가, 요청 시 반영)

`docs/work-log.md` 의 **[검증필요] 목록**:
- A. 명세에 출처 URL 이 없는 사실 카드 10장 (화면에 “출처 확인 중”) → 교사가 URL 을 주면 `facts.ts` 의 `source` 채우고 `needsCheck` 제거
- B. 기관명만 있어 같은 기관 URL 을 붙인 카드 (JFK 도서관·Levin Center 등) → 해당 페이지에 내용이 있는지 확인
- C. 명세 밖 일반 배경 문장(인트로 첫 문장 등) 확인
- D. ~~윤리원칙 원문 대조~~ → 첨부 PDF 원문으로 해결. 학생용 풀이(description)가 원문 뜻과 맞는지만 교사 확인.
- 참고 블로그 4곳·KISDI 공모 페이지는 이전 환경에서 열리지 않아 수업 형식을 일반 프로젝트 수업 형식으로 만듦 → 교사가 양식을 주면 맞춰 수정.

교사가 문장을 고쳐 달라고 하면: `src/data/` 만 수정 → `npm test` → `npm run facts:doc` / `curriculum:doc` → 배포.

---

## 8. 제안만 하고 만들지 않은 것 (교사 승인 시에만 구현)

- **학생 기록 삭제**: 번호를 잘못 골라 들어온 학생의 자리를 교사가 비우는 기능. 지금은 그 번호를 다른 학생이 쓸 수 없음.
  구현 시: 규칙상 교사는 이미 `students/*`, `seats/*`, `members/*` 삭제 가능 → `db.ts` 에 삭제 함수 + ‘학급 관리’ 탭 버튼(두 번 확인) + 규칙 테스트 추가.
- 로그인 없는 체험 모드(심사위원용), 발표 동의 표시, 활동지 출처 QR, 선언문 1주 실천 점검(K-SEL [9정서01-01] 연계).
- 작품 파일 업로드(Blaze 요금제 필요 — 무료 원칙과 충돌), 모둠 칸 편집 중 표시, 교사가 동료 검토 짝 지정.

---

## 9. 알려진 한계 (README 8장과 같음)

- PIN 4자리 → 작정한 1만 번 대입은 막을 수 없음(서버 기능 없이 시도 횟수 제한 불가). 교사 PIN 초기화로 대응.
- 선택 분포 학생 공개는 교사 대시보드가 열려 있는 동안 갱신(교사 화면이 숫자를 모아 `public/stats` 에 씀).
- [9역07-01] 의 ‘제3 세계 등장’ 부분은 앱에서 다루지 않음(명세에 사실 없음) — 교사용 가이드에 교과서 보완 안내.
- 모둠원이 같은 칸을 동시에 고치면 나중 저장이 남음(칸 단위 저장). 무료 한도: 하루 3~4개 학급 동시 프로젝트까지 여유(docs/data-model.md 6장).
