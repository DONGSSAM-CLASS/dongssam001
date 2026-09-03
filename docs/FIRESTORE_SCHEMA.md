# Firestore 컬렉션 설계

모든 규칙은 `firestore.rules`, 문서 타입은 `src/types/firestore.ts`, 테스트는 `tests/rules/firestore.rules.test.ts` 에 있습니다.
역사 기본 데이터(polities/figures/places/events/routes/achievement_standards)는 **Firestore 에 없고** 앱 번들의 정적 JSON(`src/data/`)입니다.

## 역할 판별

| 역할 | 판별 방법 |
| --- | --- |
| 교사 | `users/{uid}.role == 'teacher'` (가입 시 학생 가상 이메일이면 교사 역할 생성 거부) |
| 학생 | `users/{uid}.role == 'student' && active == true`, 가상 이메일 `^[A-Z0-9]{6}-\d{1,3}(-\d{1,3})?@student\.local$` |
| 관리자 | `admins/{uid}` 문서 존재 (커스텀 클레임 대신 — Cloud Functions 없이 콘솔에서 지정 가능) |

## 컬렉션

| 컬렉션 | 문서 ID | 읽기 | 쓰기 | 비고 |
| --- | --- | --- | --- | --- |
| `users` | uid | 본인 · 담당 교사(학생 문서) · 관리자 | 본인 생성(역할 검증) · 본인은 이름류만 수정 · 담당 교사는 active/classId/number 수정 | 삭제는 관리자만 |
| `classes` | 자동 ID | 소유 교사 · 소속 학생 · 관리자 | 소유 교사 (teacherId·authPrefix 불변) | 삭제 금지 → `archived` |
| `class_codes` | **학급코드** | **누구나 get** (list 불가) | 소유 교사 (배치 안에서 `getAfter` 로 학급과 대조) | 로그인 전 학급 찾기용. 코드 자체가 비밀 |
| `class_members` | `{classId}_{number}` | 소유 교사 · 본인 | 교사 사전 등록(uid 없음) / 학생 자가 등록 / 초기화 후 세대 승계 | 번호 중복 방지, uid 와 무관한 학생 식별자 |
| `sessions` | 자동 ID | 소유 교사 · 소속 학생(open/closed 만) | 소유 교사 | `follow` 필드가 따라오기 모드 상태 |
| `student_work` | `{sessionId}_{number}` | 소유 교사 · 본인 | 본인(세션 open 일 때) · 핀 ≤200 · 루트 ≤50 | **학생 1명 = 세션당 문서 1개** |
| `missions` | 자동 ID | 소유 교사 · 소속 학생(published) | 소유 교사 | |
| `submissions` | `{missionId}_{number}` | 소유 교사 · 본인 | 본인(미션 published) · 교사는 feedback/score 만 | |
| `teacher_overrides` | `{teacherId}_{kind}_{targetId}` | 그 교사 · 그 교사 학급의 학생 | 그 교사 | 기본 데이터 보호, 학급별 덮어쓰기 |
| `admins` | uid | 본인(존재 확인) · 관리자 | 관리자 | 최초 1명은 콘솔에서 |
| `data_reviews` | `{kind}_{itemId}` | 교사 · 관리자 | 관리자 | 검수 상태 + 수정 이력 |

## 학생 계정 흐름 (서버 없이)

1. 학생이 학급코드 입력 → `class_codes/{code}` 를 비로그인 get → `classId`, `authPrefix`.
2. 클라이언트가 가상 이메일 `{authPrefix}-{번호}@student.local` 과 비밀번호 `{PIN}#{authPrefix}` 로 `createUserWithEmailAndPassword`.
3. 배치 쓰기: `users/{uid}` (role student) + `class_members/{classId}_{번호}` (uid 기록). 규칙이 이메일 접두어·번호·학급 일치를 검증하므로 다른 학급·다른 번호로는 가입할 수 없습니다.
4. 이후 로그인은 학급코드 + 번호 + PIN → 같은 이메일/비밀번호 조합으로 `signInWithEmailAndPassword`.

**학급코드 재발급**: `classes.code` 만 바뀌고 `authPrefix` 는 고정 → 기존 학생의 이메일은 그대로 유효. 새 코드 문서를 만들고 옛 `class_codes` 문서는 삭제(또는 `active:false`).

**비밀번호 초기화**(Admin SDK 없이): 교사가 `class_members.authGeneration += 1, resetPending = true` → 학생이 새 PIN 으로 `{authPrefix}-{번호}-{세대}@student.local` 계정을 새로 만들고 규칙에 따라 자리를 이어받음. 기록(`student_work`, `submissions`)은 번호 기준 ID 라 그대로 유지. 옛 Auth 계정은 남지만 `class_members.uid` 가 바뀌어 아무 문서에도 접근할 수 없습니다.

## 할당량 절약 전략

- 기본 데이터 정적 JSON → 읽기 0.
- 학생 핀/루트를 문서 1개의 배열로 묶어 쓰기 횟수 최소화(문서 최대 1 MiB; 핀 200개 × ~200 B ≈ 40 KiB).
- `onSnapshot` 은 세션이 `open` 인 동안만. 교사 모니터링은 `student_work where classId == X and sessionId == Y` 단일 쿼리 리스너.
- Firestore 영속 캐시(`persistentLocalCache`)로 재방문 읽기 감소.
- 클라이언트에서 쓰기 디바운스(핀 편집 후 1~2초 뒤 저장) 예정.

## 인덱스

`firestore.indexes.json` 참고: sessions(classId,status,updatedAt) · sessions(teacherId,updatedAt) · class_members(classId,number) · student_work(sessionId,number) · missions(classId,published,createdAt) · submissions(missionId,submittedAt) · teacher_overrides(teacherId,kind) · data_reviews(kind,status).
