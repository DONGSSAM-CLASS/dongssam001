# 데이터 구조 설계 — 냉전의 목격자

> Phase 1 설계 문서입니다. 타입 정의는 `src/types/db.ts`(Firestore), `src/types/content.ts`(수업 콘텐츠)에 있습니다.
> 보안 규칙(`firestore.rules`)은 Phase 5 에서 이 문서를 그대로 옮겨 작성합니다.

## 1. 전체 폴더 구조

```
cold-war-witness/
├── README.md                  # 실행·배포 안내 (Phase 6 에서 완성)
├── package.json / vite.config.ts / vitest.config.ts / tsconfig*.json
├── index.html                 # Google Fonts(Noto Sans KR, Nanum Gothic Coding) 연결
├── .env.example               # Firebase 설정값 예시 (.env.local 에 실제 값)
├── firebase.json / .firebaserc / firestore.rules / firestore.indexes.json   # Phase 5
├── docs/
│   ├── data-model.md          # ← 이 문서
│   ├── work-log.md            # 작업 로그, [검증필요] 목록, 결정 사항
│   ├── fact-cards.md          # 사실 카드 검토표 (자동 생성)
│   └── curriculum-map.md      # 교육과정 연계표 (자동 생성)
├── public/favicon.svg
├── src/
│   ├── config.ts              # APP_TITLE, 입력 길이 제한 등 앱 설정
│   ├── main.tsx / App.tsx / index.css
│   ├── types/
│   │   ├── content.ts         # 챕터·장면·사실 카드·원칙·수업 자료 타입
│   │   └── db.ts              # Firestore 문서 타입
│   ├── data/                  # ★ 교사가 문장을 고치는 곳 (코드와 분리)
│   │   ├── scenarios.ts       # 3개 챕터: 인물·인트로·장면 1~5·선택·결과·성찰 질문
│   │   ├── facts.ts           # 사실 카드 (출처 포함)
│   │   ├── principles.ts      # 7대 원칙 · 3대 가치
│   │   ├── curriculum.ts      # 교육과정 원문 (역사 성취기준, K-SEL 4대 역량·성취기준·내용 요소)
│   │   ├── emotions.ts        # 감정 체크 5종
│   │   ├── lessonMaterials.ts # 교수·학습 과정안 · 활동지 · 교사용 가이드
│   │   └── appInfo.ts         # 앱 정보 페이지 (개발자·성취기준·생성형 AI 활용 범위)
│   ├── lib/                   # Phase 3~5: firebase, 저장소 서비스, PIN 해시, CSV
│   ├── components/            # Phase 3~4: 사실 카드, 원칙 카드, 도장 애니메이션 등
│   └── pages/
│       ├── student/           # 입장 → 챕터 선택 → 장면 → 성찰 → 카드 도감 → 선언문
│       ├── teacher/           # 대시보드 → 학급 관리·진행 현황·분포·성찰 열람·CSV
│       └── print/             # 과정안·활동지·가이드 인쇄용 A4 페이지
└── tests/
    ├── content.test.ts        # 콘텐츠 데이터 점검 (장면 수, 선택지 수, 사실 카드 참조, 출처, 교육과정 원문 일치)
    ├── unit.test.ts           # 분포·CSV·진행·코드·해시·조사, 규칙과 데이터 id 목록 일치
    ├── rules.test.ts          # 보안 규칙 에뮬레이터 테스트 (60개)
    └── e2e/                   # 브라우저 전체 흐름·키보드·접근성 (npm run e2e)
```

## 2. 로그인 방식

| 사용자 | 방식 | 규칙에서 구분하는 법 |
|---|---|---|
| 교사 | Google 로그인 | `request.auth.token.firebase.sign_in_provider == 'google.com'` |
| 학생 | 익명 로그인 + 학급 코드 + 번호 + 닉네임 + PIN 4자리 | `sign_in_provider == 'anonymous'` |

- 학생은 실명·이메일·전화번호를 입력하지 않습니다.
- 같은 기기: 익명 계정이 브라우저에 남아 있으므로 그대로 이어서 합니다.
- 다른 기기: `학급 코드 + 번호 + PIN` 으로 기존 기록을 새 익명 계정으로 옮깁니다(아래 4절).

## 3. Firestore 컬렉션

```
classCodes/{code}                          학급 코드 → 학급 id (get 만 허용, list 금지)
classes/{classId}                          학급 설정 (교사 소유)
classes/{classId}/members/{uid}            익명 계정 → 학생 기록 id (학급 문서 읽기 권한 확인용)
classes/{classId}/seats/{number}           번호 자리 → 학생 기록 id (번호 중복 방지, 교사만 읽음)
classes/{classId}/students/{studentId}     학생 한 명의 모든 기록 (문서 id = PIN 해시)
classes/{classId}/groups/g{1~8}            모둠 공동 기록 (명단·기획서·점검·제작 기록·제출) — 6차시 프로젝트
classes/{classId}/reviews/{id}             기획서 동료 검토(plan_g{보낸}_g{받는}) · 발표 평가(final_g{받는}_n{번호})
classes/{classId}/public/stats             학급 선택 분포 (숫자만)
classes/{classId}/teacherOnly/highlights   교사가 고른 우수 답변 표시
```

### 3-1. `classCodes/{code}`

| 필드 | 타입 | 설명 |
|---|---|---|
| classId | string | 학급 문서 id |
| className | string | 입장 화면에서 "○○반이 맞나요?" 확인용 |
| teacherUid | string | 코드를 만든 교사 (삭제 권한 확인) |
| createdAt | timestamp | |

- 코드: 6자리, 영문 대문자+숫자에서 헷갈리는 글자(0·O·1·I·L)를 뺀 31자 (`config.ts`).
- 코드가 겹치지 않도록 트랜잭션으로 "없을 때만 만들기".
- **목록 조회(list) 금지** → 코드를 모르면 다른 학급을 찾을 수 없습니다.

### 3-2. `classes/{classId}`

| 필드 | 타입 | 설명 |
|---|---|---|
| name | string (1~30자) | 학급명 |
| code | string (6자) | 학급 코드 |
| teacherUid | string | 만든 교사 |
| session | int 1~6 | 지금 차시. 학생 화면은 이 차시까지의 활동을 연다 (만들 때 1) |
| groupCount | int 0~8 | 모둠 수. `groups/g1 ~ g{groupCount}` 가 쓰인다 |
| showDistribution | bool | 학생에게 선택 분포 공개 |
| createdAt, updatedAt | timestamp | |

- 교사는 `where('teacherUid', '==', uid)` 로 자기 학급 목록을 봅니다.
- 학생은 **자기 members 문서가 있을 때만** 학급 문서를 읽습니다(지금 차시·모둠 수·공개 설정 확인용)
- 교사는 `session`·`groupCount`·`showDistribution` 만 바꿀 수 있습니다. 모둠 수를 늘리면 같은 배치로 빈 모둠 문서를 만듭니다(줄여도 문서는 남고 화면에서만 숨김, 모둠원이 있는 모둠보다 적게는 못 줄임)..

### 3-3. `classes/{classId}/members/{uid}`

| 필드 | 타입 | 설명 |
|---|---|---|
| studentId | string | 이 계정이 쓰는 학생 기록 id |
| number | int | 번호 |
| joinedAt | timestamp | |

- 학생 문서를 만들거나 옮겨 올 때 같은 배치로 만듭니다. 규칙은 `getAfter()` 로 학생 문서의 `uid` 가 본인인지 확인합니다.

### 3-3-1. `classes/{classId}/seats/{number}`

| 필드 | 타입 | 설명 |
|---|---|---|
| studentId | string | 이 번호를 쓰는 학생 기록 id |

- 처음 입장할 때 학생 기록과 같은 배치로 만듭니다. 이미 있으면 만들 수 없으므로(= 덮어쓰기는 거부) **같은 번호로 두 명이 들어올 수 없습니다.**
- 학생은 읽을 수 없습니다(학생 기록 id = PIN 해시를 숨기기 위해). 교사는 PIN 초기화 때 새 id 로 바꿉니다.

### 3-4. `classes/{classId}/students/{studentId}` — 학생 기록

| 필드 | 타입 | 검증 |
|---|---|---|
| uid | string | 지금 이 번호를 쓰는 익명 계정 |
| number | int | 1~99, 문서 id 와 같아야 함 |
| nickname | string | 1~10자 |
| groupNo | int | 0(모둠 없음)~8. 학생은 학급 모둠 수 이하로만, 교사는 이 필드만 고칠 수 있음 |
| progress | map | 키: ch1·ch2·ch3 / 값: `intro, s1~s5, reflect, wrapup, done` |
| choices | map | 키: 장면 id 15개 중 / 값: `a, b, c` |
| emotions | map | 키: 장면 id 15개 중 / 값: `anxious, afraid, angry, hesitant, calm` |
| answers | map | 키: 성찰 문항 id(`ch1-q1`, `ch1-wrap` …) / 값: 문자열 **최대 500자** |
| cards | list | 원칙 id 7개 중, 최대 7개 |
| declaration | map 또는 null | keep ≤30, era ≤40, lesson ≤80, free ≤300, principleId, submittedAt |
| createdAt, updatedAt | timestamp | `updatedAt == request.time` |

**왜 문서 id 를 PIN 해시로 했나요?**
문서 id = `SHA-256("cold-war-witness/v1:학급id:번호:PIN")` (16진수 64자). 기기가 바뀌면 익명 계정(uid)이 새로 생기는데, PIN 을 아는 사람만 이 주소를 계산할 수 있으므로 **주소를 아는 것 자체가 PIN 을 안다는 증명**이 됩니다. 그래서 새 기기는 `uid` 필드만 자기 계정으로 바꾸면 됩니다.

> Phase 1 설계(문서 id = 번호, 문서 안에 pinHash 필드)는 버렸습니다. 규칙은 “보낸 필드”와 “원래 있던 필드”를 구분하지 못해서, 공격자가 pinHash 를 **아예 보내지 않고** uid 만 바꾸면 규칙을 통과하는 구멍이 있었기 때문입니다.

**한 문서에 모두 담은 이유**
교사 대시보드가 학생 문서 컬렉션 하나만 실시간으로 구독하면 진행 현황·선택·성찰을 모두 볼 수 있어 읽기 횟수가 줄어듭니다(무료 요금제 범위). 한 학생 기록은 수십 KB 수준이라 문서 크기 제한(1MB)에 여유가 있습니다.

**자동 저장 시점(장면 단위)**
감정 + 선택을 고르면 `choices`, `emotions`, `progress` 를 한 번에 씁니다. 성찰 답변은 "저장" 또는 "다음" 을 누를 때 씁니다. 학생 한 명이 한 챕터에서 쓰는 횟수는 약 10~15번입니다.

**선택은 바꿀 수 없음**
한 번 고른 선택은 다시 고를 수 없습니다(규칙에서 기존 `choices` 값의 변경을 막음). 결과를 본 뒤 선택을 바꾸면 "선택의 무게"를 경험하는 의도가 약해지고, 분포도 흔들리기 때문입니다.

### 3-5. `classes/{classId}/public/stats` — 선택 분포

```json
{ "choices": { "ch1-s1": { "a": 3, "b": 10, "c": 2 }, ... }, "updatedAt": ... }
```

- Cloud Functions 를 쓸 수 없으므로 **교사 대시보드가 학생 문서를 모아 계산해 써 넣습니다.** (대시보드가 열려 있는 동안 값이 바뀌면 자동 갱신)
- 숫자만 있고 번호·닉네임이 없습니다.
- 학생은 학급 문서의 `showDistribution == true` 일 때만 읽을 수 있습니다(규칙에서 확인).

### 3-6. `classes/{classId}/teacherOnly/highlights`

```json
{ "items": { "7:ch1-q1": true, "12:declaration": true }, "updatedAt": ... }
```

- 교사만 읽고 씁니다. 발표 모드에서 하이라이트한 답변만 크게 보여 줄 때 씁니다.

### 3-7. `classes/{classId}/groups/g{no}` — 모둠 공동 기록

| 필드 | 타입 | 검증 |
|---|---|---|
| no | int 1~8 | 문서 id 와 같아야 함 (`g` + no) |
| name | string ≤12 | 모둠 이름 |
| caseId | `ch1`·`ch2`·`ch3`·null | 탐구할 사건 파일 |
| pledge | string ≤200 | 모둠 약속 |
| members | map ≤6칸 | 키: 학생 번호 / 값 `{nickname, roles: 역할 id ≤5}` |
| plan | map (14칸 고정) | title ≤40, audience ≤60, aiCase ≤300, message ≤100, outline ≤500, tools ≤200, aiUse ≤300, schedule ≤300, format(형식 id·null), formatOther ≤20, factIds(사실 카드 id ≤3), principleIds(≤2), aspectTags(원문 세부 항목 ≤3), valueIds(≤3) |
| planChecks, finalChecks | map | 키: 점검 문항 id 18개 중 / 값 bool |
| planStatus | `draft`·`submitted`·`approved`·`revise` | 학생은 draft·submitted 만, 승인·고칠 점은 교사 |
| teacherComment | string ≤300 | 교사만 |
| storyboard | map | 키 `c1`~`c8` / 값 ≤300 |
| stage | `idea`·`storyboard`·`draft`·`revise`·`done` | 제작 단계 |
| aiLog | map `{tools ≤100, where ≤300, human ≤300, label ≤100}` | AI 활용 기록 (투명성) |
| sources | string ≤500 | 출처 |
| submission | null 또는 `{url(https, ≤300), intro 1~300, note ≤300, submittedAt}` | 작품 제출. 파일은 저장하지 않음 |
| createdAt, updatedAt | timestamp | `updatedAt == request.time` |

- **교사가 만들고 지웁니다.** 만들 때는 모든 칸이 빈 값이어야 합니다.
- **같은 학급 학생은 모두 읽을 수 있고**(동료 검토·발표 평가), **그 모둠 학생만 고칩니다.** 학생의 모둠 = `members/{uid}` → `students/{id}.groupNo` 를 규칙이 두 번 읽어 확인합니다.
- 명단(members)은 **자기 번호 칸만** 넣고·고치고·뺄 수 있고, 넣을 때는 같은 배치가 끝난 뒤 자기 `groupNo` 가 이 모둠이어야 합니다(`getAfter`). 모둠을 옮길 때는 한 배치로 `groupNo` 변경 + 옛 모둠에서 빠지기 + 새 모둠에 들어가기를 합니다.
- 앱은 칸 단위 필드 경로(`plan.title`, `storyboard.c2` …)로 써서, 모둠원이 동시에 다른 칸을 고쳐도 덮어쓰지 않습니다. 목록형 칸(사실 카드·원칙)은 `arrayUnion`/`arrayRemove` 로 씁니다.
- **규칙 계산 한도(요청당 식 1000개)** 때문에, 고칠 때는 바뀐 칸만 검사합니다(`okGroupChange`). 만들 때 모든 칸이 빈 값인지 확인하고, 이후 바뀐 칸마다 검사하므로 늘 올바른 모양이 유지됩니다. 모둠 8개를 한 배치로 만드는 것까지 테스트로 확인했습니다.

### 3-8. `classes/{classId}/reviews/{id}` — 검토·평가

| 종류 | 문서 id | 필드 | 쓰기 | 읽기 |
|---|---|---|---|---|
| 기획서 동료 검토 (3차시) | `plan_g{보낸}_g{받는}` | kind='plan', fromGroup, toGroup, praise ≤200, suggest ≤200, ethics ≤200, authorNumber, updatedAt | 보낸 모둠 학생 (함께 씀, 칸 단위 merge) | 받은 모둠·보낸 모둠·교사 |
| 발표 평가 (6차시) | `final_g{받는}_n{내 번호}` | kind='final', toGroup, scores{ethics, history, creative, delivery: 1~3}, praise ≤150, suggest ≤150, authorNumber, updatedAt | 다른 모둠 학생 (자기 번호 문서만, 자기 모둠 평가 금지) | 받은 모둠·쓴 학생·교사 |

- 학생 화면은 이름을 보여 주지 않지만, 받은 모둠은 문서의 authorNumber 를 읽을 수 있습니다(교사 화면은 번호 표시).
- 학생은 쿼리로 읽습니다: `toGroup == 내 모둠` / `kind == 'plan' && fromGroup == 내 모둠` / `kind == 'final' && authorNumber == 내 번호`.

## 4. PIN 과 기기 바꾸기 (Cloud Functions 없이)

1. 입장할 때 학생이 PIN 4자리를 정하면, 브라우저에서 `SHA-256("cold-war-witness/v1:classId:번호:PIN")` 을 계산해 **학생 기록의 문서 id** 로 씁니다. **PIN 원문은 어디에도 저장하지 않습니다.**
2. 한 배치로 `students/{해시}`(빈 기록) + `seats/{번호}` + `members/{uid}` 를 만듭니다. 번호가 이미 있으면 거부되고, 앱은 같은 PIN 으로 ‘이어 하기’를 한 번 시도합니다(예전에 들어온 학생일 수 있으므로).
3. 다른 기기에서는 새 익명 계정으로 로그인한 뒤, 같은 방식으로 해시를 계산해 그 문서에 `{ uid: 새uid, updatedAt }` 업데이트를 보냅니다. 규칙은 **uid·updatedAt 만 바뀌는 경우에만** 허용합니다. PIN 이 틀리면 주소가 달라서 “문서 없음”으로 실패합니다.
4. 성공하면 같은 배치로 `members/{새uid}` 를 만들고, 그다음부터 새 기기에서 기록을 읽고 씁니다. 옛 기기는 uid 가 달라져 더 이상 읽지 못합니다.

**교사 PIN 초기화**: 교사 화면에서 새 임시 PIN 4자리를 만들고, 그 PIN 으로 계산한 새 주소에 기록을 복사한 뒤 옛 문서를 지우고 번호 자리(seats)를 새 주소로 바꿉니다(한 배치). 임시 PIN 을 학생에게 알려 주면 학생은 ‘이어 하기’로 들어옵니다. (학생이 PIN 을 스스로 바꾸는 기능은 명세에 없어 만들지 않았습니다.)

**알려진 한계**: PIN 이 4자리라서 같은 반 학생이 작정하고 1만 번을 시도하면 뚫릴 수 있습니다(서버 기능 없이 시도 횟수를 막을 방법이 없음). 대신 기기 이동 시각(`updatedAt`)과 uid 변화를 교사 화면에서 볼 수 있고, 교사가 언제든 PIN 을 초기화할 수 있습니다. README 에 이 한계를 적어 둡니다.

## 5. 권한 요약 (Phase 5 규칙의 목표)

| 문서 | 학생(본인) | 학생(다른 사람) | 교사(학급 주인) | 다른 교사 |
|---|---|---|---|---|
| classCodes/{code} | get ✅ list ❌ | get ✅ | 생성·삭제 ✅ | get ✅ 삭제 ❌ |
| classes/{id} | 읽기 ✅(멤버일 때) | ❌ | 읽기·쓰기·삭제 ✅ | ❌ |
| members/{uid} | 본인 것 생성·읽기 | ❌ | 읽기·삭제 ✅ | ❌ |
| seats/{n} | 입장할 때 생성만 | ❌ | 읽기·쓰기·삭제 ✅ | ❌ |
| students/{id} | 읽기·쓰기(uid 일치), PIN 으로 uid 옮기기 | ❌ | 읽기 ✅, PIN 초기화(옮기기)·삭제 ✅, 답변 수정 ❌ | ❌ |
| public/stats | 읽기(공개 ON 일 때) | — | 읽기·쓰기 ✅ | ❌ |
| teacherOnly/* | ❌ | ❌ | 읽기·쓰기 ✅ | ❌ |
| groups/g{n} | 읽기 ✅(같은 학급), 고치기(내 모둠만, 명단은 내 칸만, 승인 ❌) | 읽기 ✅ | 생성·삭제, 이름·명단·승인·교사 의견 ✅, 기획서 내용 수정 ❌ | ❌ |
| reviews/* | 위 표 3-8 | — | 읽기·삭제 ✅ | ❌ |

- 모든 쓰기에서 필드 이름·타입·길이를 검증합니다(서술형 최대 500자).
- 한 번 고른 선택·감정은 학생도 바꾸거나 지울 수 없습니다.
- 학급 삭제(데이터 파기): 교사 화면에서 학생·자리·멤버·모둠·검토·평가·통계·하이라이트·학급 코드·학급 문서를 배치로 모두 지웁니다(두 번 확인).
- 규칙 테스트: `tests/rules.test.ts` (60개, `npm run test:rules`)

## 6. 무료 요금제(Spark) 사용량 어림

- 사건 파일 체험: 학생 30명 × 사건 파일 1개 ≈ 쓰기 450회, 교사 대시보드 실시간 구독 읽기 ≈ 쓰기 횟수만큼.
- 모둠 기록: 입력을 멈추고 **2초 뒤** 저장. 학생은 **자기 모둠 문서 하나만** 늘 실시간으로 받고, 다른 모둠 문서는 모둠 고르기·검토·발표 화면에 있을 때만 받습니다. 모둠 쓰기 1회 ≈ 읽기 (모둠원 수 + 교사 1)회.
- 어림: 30명(6모둠) 기획·창작 한 차시 ≈ 쓰기 1,500회 · 읽기 1만 회. 하루 한도(읽기 5만, 쓰기 2만) 안에서 하루 3~4개 학급이 무리 없고, 그보다 많으면 한도에 가까워질 수 있습니다.
- 외부 분석 도구(GA 등)는 넣지 않습니다.
