# Codex 인수인계 문서

이 폴더(`tycoon/`)는 **「동쌤의 교실 국가 타이쿤」** 입니다.
1단계가 끝난 상태이며, 2단계부터 이어서 작업하면 됩니다.

## 0. 30초 요약

- 중학교 담임교사가 학급을 '국가'처럼 운영하는 교실 경제 웹앱입니다.
- React 19 + Vite + TS + Tailwind 4 + Firebase.
- **Firebase Spark(무료) 요금제 전용입니다. Cloud Functions 를 쓸 수 없습니다.**
  그래서 `firestore.rules` 가 백엔드 역할을 하며, 코인 무결성을 규칙이 강제합니다.
- 1단계(세팅·인증·학급·명단·원장 엔진)는 완료되어 빌드·테스트가 모두 통과합니다.

## 1. 시작하기

```bash
cd tycoon
npm ci --legacy-peer-deps     # ★ 이 플래그 없으면 npm 이 edgesOut 오류로 죽습니다
cp .env.example .env          # VITE_USE_EMULATOR=1 그대로 두면 로컬 에뮬레이터 사용

npm run emulators             # 터미널 ①
npm run dev                   # 터미널 ②  → http://localhost:5173

npm run test:all              # 단위 + Security Rules 테스트
npx tsc -b --noEmit           # 타입 체크
npm run build                 # 프로덕션 빌드
```

데모 데이터: 에뮬레이터를 켠 상태에서 `npx tsx scripts/seed-demo.ts`
(학급코드 `DEMO24`, 학생 25명, 부처 12개, 국고 200,000코인)

## 2. 반드시 지켜야 할 3가지

### ① 코인은 `moveCoins()` 로만 움직인다

```ts
import { moveCoins } from '../lib/ledger';

await moveCoins({
  classId, actorUid,
  type: 'PAYROLL',          // 거래 유형
  from: 'TREASURY', to: 'S07',
  amount: 500,              // 양의 정수만
  reason: '2026년 10월 월급',
  extra: (tx, txId) => {    // 같은 원자 단위에 함께 쓸 문서가 있으면 여기서
    tx.set(slipRef, { ... });
  },
});
```

`accounts` 문서를 직접 `updateDoc` 하면 규칙이 무조건 거부합니다.
거래 문서 없이 잔액만 바꾸거나 한쪽만 늘리는 것도 전부 막혀 있습니다.
(테스트로 고정되어 있으니 확인해 보세요: `tests/rules/ledger.test.ts`)

### ② 새 거래 유형·새 컬렉션은 규칙을 먼저 연다

`firestore.rules` 의 `txTypeAllowed()` 에 없는 유형은 거부됩니다.
5~8단계 컬렉션(`auctions`, `deposits`, `loans`, `approvals`, `stocks` …)은
현재 **전면 차단** 상태입니다. 해당 단계를 구현할 때 규칙을 열고,
`tests/rules/` 에 "되는 경우 / 안 되는 경우" 테스트를 함께 추가하세요.

### ③ Security Rules 의 문서 조회 한도(batch 당 20회)를 넘기지 않는다

그래서 25명 급여를 한 batch 로 묶지 않고 **학생 1명당 1 batch** 로 순차 실행합니다.
멱등성은 `payrolls/{월}/slips/{번호}` 의 create-only 규칙이 보장합니다.

## 3. 먼저 읽을 문서

| 파일 | 내용 |
| --- | --- |
| `docs/DECISIONS.md` | **가장 먼저.** 왜 Functions 없이 만들었는지, 무엇을 막고 못 막는지 |
| `docs/PLAN.md` | 1~10단계 작업 목록과 단계별 확인 항목 |
| `docs/FIRESTORE_SCHEMA.md` | 데이터 모델과 불변식 |
| `docs/TEACHER_SETUP.md` | 교사가 Firebase 콘솔에서 해야 할 일 |
| `firestore.rules` | 한국어 주석으로 설계 의도가 전부 적혀 있습니다 |

## 4. 현재 동작하는 화면

| 경로 | 화면 |
| --- | --- |
| `/` | 첫 화면(학생·교사 선택) |
| `/teacher/login` | 교사 Google 로그인 |
| `/teacher/setup` | 학급 만들기 (6자리 코드 발급) |
| `/teacher` | 대통령 콘솔 — 국고 잔액·통화량·학생 수·국고 발행/소각·최근 거래 |
| `/teacher/students` | 학생 일괄 등록, PIN 확인·초기화 |
| `/teacher/cards` | 인쇄용 로그인 카드 |
| `/student/login` | 학생 로그인 (코드+번호+PIN) |
| `/student` | 내 지갑·거래내역·PIN 변경 |

## 5. 아직 안 만든 것 (다음 작업)

`docs/PLAN.md` 2단계부터입니다. 우선순위대로:

1. **2단계** 조직(부처) 편집 · 역할 배정 · 조직도 트리
2. **3단계** 월급 일괄 지급/회수 · 세금 · 급여명세서 ← 규칙과 세금 계산 함수는 이미 완료
3. **4단계** 지적 제도 · 월급 보류/해제 · 상벌점
4. 이후 5~10단계

## 6. 알려진 제약과 주의사항

- **학생이 스스로 PIN 을 바꾸면** 교사 화면의 PIN 표시와 달라집니다. 초기화로 해결합니다.
- **첫 로그인이 곧 가입**이라 PIN 을 잘못 입력하면 그 값이 비밀번호가 됩니다. 초기화로 해결합니다.
- **학급 생성은 두 번에 나눠 씁니다.** 하위 문서를 같은 batch 에 담으면 규칙이 거부합니다.
- **npm install 은 `--legacy-peer-deps` 가 필요합니다.**
- 빌드 결과가 900KB 대입니다. 9단계에서 코드 분할을 검토하세요(지금은 문제 아님).
- `firebase.json` 의 에뮬레이터 포트는 같은 저장소의 다른 앱과 겹치지 않게 골랐습니다
  (Auth 9399 / Firestore 8180 / Hosting 5010 / UI 4010).
- 이 저장소에는 다른 수업 앱(History Globe, 독도네컷, 한사수능)이 함께 있습니다.
  **`tycoon/` 밖의 파일은 건드리지 마세요.** 예외는 `.github/workflows/tycoon-*.yml` 뿐입니다.
