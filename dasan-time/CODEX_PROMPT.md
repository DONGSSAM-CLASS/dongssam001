# Codex 입력 프롬프트 — 다산의 시간

## 프로젝트 개요

이 저장소(`dongssam-class/dongssam001`)의 **`dasan-time/`** 폴더에 "다산의 시간"이라는 중학교 3학년 역사 수업용 웹앱이 있습니다. 정약용의 유배 생활과 공부법을 탐구하고, 그것을 근거로 학생이 스스로 스마트폰 사용 규칙을 설계·실천하는 **3차시 교실 수업 + 4주 가정 실천** 프로그램입니다. 학생 화면·교사 화면·체험 모드·PDF 내보내기·보안 규칙까지 **전부 구현되어 검증을 통과한 상태**입니다.

**작업을 시작하기 전에 반드시 `dasan-time/CODEX_HANDOFF.md` 를 먼저 읽고 제약 조건을 숙지하세요.**

### 주의: 이 저장소는 앱이 여러 개입니다

저장소 **루트**의 `CODEX_HANDOFF.md`·`CODEX_PROMPT.md`·`public/` 은 **다른 앱**("아고라의 딜레마")의 것이고 제약 조건이 정반대입니다(빌드 도구·외부 라이브러리 금지). **이 앱은 `dasan-time/` 안에서만 작업하며 Vite·React·npm 을 정상적으로 씁니다.** 두 문서를 섞지 마세요. 다른 하위 폴더(`hansa-suneung/`, `dokdo-necut/`)도 건드리지 마세요.

### 핵심 제약 (어기면 요구사항 위반)

1. **금지어** — 화면·문구·메타태그·주석·README 어디에도 `공모`, `공모전`, `우수사례`, `심사`, `출품`, `응모` 를 쓰지 마세요. 특정 학교 이름·교사 개인 연락처·외부 자문 인물 이름도 금지입니다.
2. **무료 요금제 유지** — Firebase **Storage 와 Cloud Functions 사용 금지**(Blaze 유료 요금제가 필요). Auth + Firestore + Hosting 만 씁니다.
3. **말투** — 모든 학생 안내 문구는 선생님이 학생에게 다정하게 설명하는 말투. 한 문장 25자 안팎, 한 화면 설명 문단 3줄 이하.
4. **어려운 낱말**(사료·초서·유배·주도성·알고리즘·포모 등)은 처음 나올 때 `<HelpTooltip>` 으로 뜻 풀이를 붙입니다.
5. **역사적 사실** — `CODEX_HANDOFF.md` 8장의 범위만 사용하고 **사료 원문·날짜·숫자를 지어내지 마세요.** 불확실하면 `// TODO(교사 확인)` 주석.
6. **개인정보** — 학생 실제 이메일·전화번호 수집 금지. 사용 시간 숫자는 본인과 담당 교사만 볼 수 있어야 합니다.
7. **과장·공포 조장 금지** — 숏폼을 "뇌가 망가진다" 식으로 쓰지 않습니다.
8. **`html2canvas-pro` 를 `html2canvas` 로 되돌리지 마세요.** Tailwind v4·daisyUI v5 의 `oklch()` 색 때문에 구버전은 캡처 중 오류가 납니다.
9. daisyUI 테마는 `cupcake` 하나만. 상태 관리 라이브러리 추가 금지(React Context + 훅만).
10. 명세에 없는 기능을 임의로 추가하지 마세요.

### 구조상 꼭 알아야 할 두 가지

- **학생 화면과 체험 모드는 같은 코드입니다.** 다른 것은 데이터 통로뿐입니다. 화면 코드에서 `firebase/firestore` 를 직접 import 하지 말고 반드시 `useData().api` (`lib/types.ts` 의 `DataApi`)를 거치세요. 새 데이터 동작이 필요하면 `DataApi` 에 메서드를 추가하고 **`lib/db.ts` 와 `lib/localDb.ts` 양쪽에 모두** 구현해야 합니다.
- **학생에게 보이는 모든 문구는 `src/content/lessons.ts` 에 있습니다.** 화면 컴포넌트 안에 문구를 하드코딩하지 마세요.

---

## 앞으로 진행할 작업 (우선순위 순)

### 1. 학급 이름 변경 시 `classCodes` 동기화 (버그, 가장 먼저)

학생은 가입 전(로그인 전)에 학급 코드를 넣고 "○○ 선생님의 3학년 2반이 맞나요?"를 확인합니다. 그때는 `classes/{id}` 를 읽을 권한이 없어서, 학급 이름과 교사 이름을 `classCodes/{code}` 문서에 비정규화해 저장해 두었습니다.

그런데 **지금은 코드를 재발급할 때만 갱신**됩니다. 교사가 학급 이름을 바꾸면 학생 가입 확인 화면에는 옛 이름이 그대로 보입니다.

- `lib/db.ts` 의 `updateClass`(또는 호출하는 쪽)에서 `name` 이 바뀌면 `classCodes/{code}` 의 `className` 도 함께 갱신
- 교사 이름이 바뀌는 경로가 있다면 `teacherName` 도 같이 처리
- `tests/rules.test.ts` 에 교사만 자기 `classCodes` 문서를 고칠 수 있다는 테스트가 이미 있으니 규칙 수정은 필요 없을 가능성이 큽니다. 확인 후 진행하세요.

### 2. 3차시 동료 평가 결과를 학생 화면에도 표시

현재는 투표 마감 뒤 결과를 교사가 프로젝터로만 보여 줍니다(학생은 보안 규칙상 남의 표를 읽을 수 없기 때문). 학생 화면에도 "많이 뽑힌 카드"를 보여 주려면:

- 교사가 `LiveControl` 에서 투표를 마감할 때 집계 결과를 학급 문서(예: `classes/{id}.voteResult`)에 **한 번** 써 주기
- 학생 `Session3` 의 활동 6에서 `voteClosed` 가 true 면 그 집계를 읽어 하이라이트
- **개인이 누구를 골랐는지는 절대 노출하지 마세요.** 카드별 득표 수만 씁니다.
- 보안 규칙에 학생이 `voteResult` 를 읽을 수 있고 쓸 수는 없다는 테스트를 추가하세요.

### 3. 접근성(a11y) 점검 및 개선

`aria-label`·역할 속성은 넣어 두었지만 실제 보조기기로 점검한 적은 없습니다.

- 키보드만으로 학생 전체 흐름(랜딩 → 체험/로그인 → 1·2·3차시 → 4주 실천) 탐색 가능한지
- 스크린 리더 호환성 (`aria-label`, `aria-live`, `role`, `aria-pressed`)
- 색상 대비 WCAG AA 충족 여부 — daisyUI `cupcake` 테마 안에서 해결하세요(테마 추가 금지)
- 색만으로 상태를 구분하는 곳이 없는지 (아이콘+글자를 함께 써야 함)

### 4. 학생 문구 검수

`src/content/lessons.ts` 전체를 훑으며:

- 한 문장 25자 안팎을 지키는지
- 어려운 낱말에 뜻 풀이(`content/glossary.ts`)가 빠짐없이 연결되는지
- 말투가 일관되게 "선생님이 다정하게 설명하는" 톤인지

문구만 고치고 화면 코드는 건드리지 마세요.

### 5. 실기기 점검 지원

디벗(태블릿)·학생 휴대폰에서 확인할 때 나오는 문제를 고칩니다. 특히 360px 너비에서 가로 스크롤이 생기지 않아야 합니다.

---

## 하지 말아야 할 것

- Firebase Storage·Cloud Functions 도입 (유료 전환)
- daisyUI 테마 추가, 상태 관리 라이브러리 추가
- `html2canvas-pro` → `html2canvas` 되돌리기
- `CODEX_HANDOFF.md` 7장에 적힌 3가지 수정(가입 직후 프로필 재시도 / `classCodes` 비로그인 `get` / 번호 자리 예약) 되돌리기
- 4주 실천 푸시 알림 구현 시도 — 무료 요금제에서는 불가능합니다
- `dasan-time/` 밖의 다른 앱 폴더 수정

---

## 작업 방법

명세를 **단계별로** 구현하고, **각 단계가 끝날 때마다** 아래를 모두 확인한 뒤 다음 단계로 넘어가세요.

```bash
cd dasan-time
npm install
cp .env.example .env.local     # 키가 없어도 체험 모드로 앱은 열립니다

npm run build                  # 경고·오류 0건이어야 함
npm run test:rules             # 에뮬레이터 보안 규칙 테스트 (현재 31건 전부 통과)
grep -rn -E "공모|우수사례|심사|출품|응모" src public index.html README.md firestore.rules
                               # 반드시 0건
```

**로그인 흐름까지 실제로 확인하려면** `.env.local` 에 더미 값과 함께 `VITE_USE_EMULATOR=1` 을 넣고 `npm run emulators` 와 `npm run dev` 를 함께 띄우세요. **배포 전에는 `VITE_USE_EMULATOR` 를 반드시 비우세요.**

```
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_PROJECT_ID=demo-dasan-time
VITE_FIREBASE_APP_ID=1:000000000000:web:demo
VITE_FIREBASE_AUTH_DOMAIN=demo-dasan-time.firebaseapp.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_USE_EMULATOR=1
```

> Playwright 로 브라우저 검증을 한다면 `waitUntil: 'networkidle'` 을 쓰지 마세요. Firestore 실시간 구독 스트림이 계속 열려 있어 영원히 기다립니다. `domcontentloaded` + 명시적 대기를 쓰세요.

### 최종 점검 목록 (작업 완료 시 모두 통과해야 함)

- [ ] 금지어 `grep` 결과 0건
- [ ] 모든 학생 안내 문구가 선생님 말투이고, 어려운 낱말에 뜻 풀이가 있음
- [ ] 사용 시간 숫자가 감정 지도·갤러리·통계 어디에도 다른 학생에게 노출되지 않음
- [ ] 한글이 PDF에서 깨지지 않고, 긴 결과물이 여러 쪽으로 나뉘어 저장됨
- [ ] 휴대폰 너비(360px)에서 가로 스크롤이 생기지 않음
- [ ] 로그인 없이 체험 모드 전체 흐름이 끝까지 동작함
- [ ] Storage·Functions 미사용, `npm run build` 경고·오류 없음
- [ ] `npm run test:rules` 전부 통과
