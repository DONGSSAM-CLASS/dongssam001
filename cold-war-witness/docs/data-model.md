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
    └── rules.test.ts          # Phase 5: 보안 규칙 에뮬레이터 테스트
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
classes/{classId}/members/{uid}            익명 계정 → 번호 (학급 문서 읽기 권한 확인용)
classes/{classId}/students/{number}        학생 한 명의 모든 기록 (문서 id = 번호)
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
| unlocked | map `{ch1, ch2, ch3, finale: bool}` | 챕터 잠금 해제 |
| showDistribution | bool | 학생에게 선택 분포 공개 |
| createdAt, updatedAt | timestamp | |

- 교사는 `where('teacherUid', '==', uid)` 로 자기 학급 목록을 봅니다.
- 학생은 **자기 members 문서가 있을 때만** 학급 문서를 읽습니다(잠금 상태·공개 설정 확인용).

### 3-3. `classes/{classId}/members/{uid}`

| 필드 | 타입 | 설명 |
|---|---|---|
| number | int | 이 계정이 쓰는 번호 |
| joinedAt | timestamp | |

- 학생 문서를 만들거나 옮겨 올 때 같은 배치로 만듭니다. 규칙은 `getAfter()` 로 학생 문서의 `uid` 가 본인인지 확인합니다.

### 3-4. `classes/{classId}/students/{number}` — 학생 기록

| 필드 | 타입 | 검증 |
|---|---|---|
| uid | string | 지금 이 번호를 쓰는 익명 계정 |
| number | int | 1~99, 문서 id 와 같아야 함 |
| nickname | string | 1~10자 |
| pinHash | string | 16진수 64자 |
| progress | map | 키: ch1·ch2·ch3 / 값: `intro, s1~s5, reflect, wrapup, done` |
| choices | map | 키: 장면 id 15개 중 / 값: `a, b, c` |
| emotions | map | 키: 장면 id 15개 중 / 값: `anxious, afraid, angry, hesitant, calm` |
| answers | map | 키: 성찰 문항 id(`ch1-q1`, `ch1-wrap` …) / 값: 문자열 **최대 500자** |
| cards | list | 원칙 id 7개 중, 최대 7개 |
| declaration | map 또는 null | keep ≤30, era ≤40, lesson ≤80, free ≤300, principleId, submittedAt |
| createdAt, updatedAt | timestamp | `updatedAt == request.time` |

**왜 문서 id 를 번호로 했나요?**
기기가 바뀌면 익명 계정(uid)이 새로 생깁니다. 기록을 uid 아래에 두면 옮기기가 어렵기 때문에, 번호 자리에 기록을 두고 `uid` 필드만 새 계정으로 바꿉니다.

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

## 4. PIN 과 기기 바꾸기 (Cloud Functions 없이)

1. 입장할 때 학생이 PIN 4자리를 정하면, 브라우저에서 `SHA-256("cold-war-witness/v1:classId:번호:PIN")` 을 계산해 `pinHash` 로 저장합니다. **PIN 원문은 어디에도 저장하지 않습니다.**
2. 다른 기기에서는 새 익명 계정으로 로그인한 뒤, 같은 방식으로 해시를 계산해 학생 문서에 `{ uid: 새uid, pinHash: 계산값 }` 업데이트를 보냅니다.
3. 규칙은 **보낸 pinHash 가 저장된 pinHash 와 같고, uid·updatedAt 만 바뀌는 경우에만** 허용합니다. 새 계정은 문서를 읽을 수 없으므로, PIN 을 알아야만 같은 해시를 만들 수 있습니다.
4. 성공하면 같은 배치로 `members/{새uid}` 를 만들고, 그다음부터 새 기기에서 기록을 읽고 씁니다.

**교사 PIN 초기화**: 교사 화면에서 새 임시 PIN 4자리를 만들어 보여 주고, 그 해시를 `pinHash` 에 씁니다. 학생은 임시 PIN 으로 기기를 옮긴 뒤 원하면 새 PIN 으로 바꿉니다.

**알려진 한계**: PIN 이 4자리라서 같은 반 학생이 작정하고 1만 번을 시도하면 뚫릴 수 있습니다(서버 기능 없이 시도 횟수를 막을 방법이 없음). 대신 기기 이동 시각(`updatedAt`)과 uid 변화를 교사 화면에서 볼 수 있고, 교사가 언제든 PIN 을 초기화할 수 있습니다. README 에 이 한계를 적어 둡니다.

## 5. 권한 요약 (Phase 5 규칙의 목표)

| 문서 | 학생(본인) | 학생(다른 사람) | 교사(학급 주인) | 다른 교사 |
|---|---|---|---|---|
| classCodes/{code} | get ✅ list ❌ | get ✅ | 생성·삭제 ✅ | get ✅ 삭제 ❌ |
| classes/{id} | 읽기 ✅(멤버일 때) | ❌ | 읽기·쓰기·삭제 ✅ | ❌ |
| members/{uid} | 본인 것 생성·읽기 | ❌ | 읽기·삭제 ✅ | ❌ |
| students/{n} | 읽기·쓰기(uid 일치) | ❌ | 읽기 ✅, pinHash 만 수정, 삭제 ✅ | ❌ |
| public/stats | 읽기(공개 ON 일 때) | — | 읽기·쓰기 ✅ | ❌ |
| teacherOnly/* | ❌ | ❌ | 읽기·쓰기 ✅ | ❌ |

- 모든 쓰기에서 필드 이름·타입·길이를 검증합니다(서술형 최대 500자).
- 학급 삭제(데이터 파기): 교사 화면에서 학생·멤버·통계·하이라이트·학급 코드·학급 문서를 배치로 모두 지웁니다(두 번 확인).

## 6. 무료 요금제(Spark) 사용량 어림

- 학생 30명 × 챕터 1개 ≈ 쓰기 450회, 교사 대시보드 실시간 구독 읽기 ≈ 쓰기 횟수만큼.
- 하루 한도(읽기 5만, 쓰기 2만) 안에서 여러 학급이 동시에 써도 충분합니다.
- 외부 분석 도구(GA 등)는 넣지 않습니다.
