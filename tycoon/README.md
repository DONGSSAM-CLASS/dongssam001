# 동쌤의 교실 국가 타이쿤

학급을 하나의 '국가'로 운영하며 노동·세금·금융·투자·행정을 체험하는 교실 경제 플랫폼입니다.
중학교 담임교사와 학생이 함께 씁니다.

> **Firebase Spark(무료) 요금제 전용으로 설계되었습니다.**
> Cloud Functions 를 쓸 수 없으므로 `firestore.rules` 가 사실상 백엔드 역할을 합니다.
> 왜 이렇게 만들었는지는 [docs/DECISIONS.md](docs/DECISIONS.md) 를 꼭 먼저 읽어 주세요.

## 진행 상황

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 1 | 프로젝트 세팅 · 교사/학생 인증 · 학급 생성 · 학생 일괄 등록 · 원장 엔진 | ✅ 완료 |
| 2 | 조직(부처) 편집 · 역할 배정 · 조직도 화면 | ⬜ 예정 (기본 템플릿 12개는 이미 들어 있음) |
| 3 | 월급 일괄 지급·회수 · 세금 · 급여명세서 | ⬜ 예정 (원장·멱등 규칙은 완료) |
| 4 | 지적 제도 · 월급 보류/해제 · 상벌점 | ⬜ 예정 (규칙은 완료) |
| 5 | 부동산 청약(오프라인 → 온라인 경매) | ⬜ 예정 |
| 6 | 은행 · 예금 · 대출 · 신용점수 | ⬜ 예정 |
| 7 | 전자결재 · 관보 | ⬜ 예정 |
| 8 | 주식(시세 어댑터 · 코인 환산 · 매매 · 투자일지) | ⬜ 예정 (시세 수집 스크립트·워크플로는 완료) |
| 9 | 대시보드 모드 · 리포트 · 용어 사전 · 백업 | ⬜ 예정 |
| 10 | 배포 · 교사용 안내서 | ⬜ 예정 (배포 워크플로는 완료) |

## 빠른 시작 (로컬)

```bash
cd tycoon
npm ci --legacy-peer-deps      # npm 버그 회피를 위해 이 플래그가 필요합니다
cp .env.example .env           # 로컬은 VITE_USE_EMULATOR=1 그대로 두면 됩니다

npm run emulators              # 터미널 ①  에뮬레이터 (Auth 9399 / Firestore 8180 / UI 4010)
npm run dev                    # 터미널 ②  http://localhost:5173
```

데모 데이터가 필요하면 에뮬레이터를 켠 채로:

```bash
npx tsx scripts/seed-demo.ts   # 학급코드 DEMO24, 학생 25명, 부처 12개
npx tsx scripts/verify-ledger.ts demo-class   # 원장 무결성 점검
```

## 테스트

```bash
npm run test        # 단위 테스트 (세금 계산, KST 월 계산)
npm run test:rules  # Security Rules 테스트 (에뮬레이터 자동 기동)
npm run test:all
```

Rules 테스트는 이 앱에서 가장 중요한 테스트입니다. 코인 위조·권한 위반 시나리오를
전부 여기서 막습니다.

## 폴더 구조

```
firestore.rules          ★ 백엔드 역할. 복식부기·권한·멱등성을 강제
firestore.indexes.json
src/
  lib/ledger.ts          ★ 코인이 움직이는 유일한 통로
  lib/firebase.ts        Firebase 초기화 · 에뮬레이터 연결 · 영속 캐시
  lib/auth.ts            교사 Google 로그인 · 학생 코드+번호+PIN 로그인
  lib/classService.ts    학급 생성 · 국고 발행/소각
  lib/rosterService.ts   명단 파싱 · 일괄 등록 · PIN 초기화
  lib/accounts.ts        계정·거래내역 구독
  lib/money.ts time.ts   금액 표기 · 세금 계산 · Asia/Seoul 월 계산
  data/ministryTemplate.ts  기본 부처 12개
  store/session.ts       로그인 상태와 소속 학급
  pages/ components/     화면
scripts/
  seed-demo.ts           데모 학급 시드 (에뮬레이터)
  verify-ledger.ts       "모든 잔액의 합 == 0" 점검
  fetch-prices.ts        주식 시세 수집 (GitHub Actions 가 실행)
tests/rules/             Security Rules 시나리오 테스트
docs/                    설계 판단 기록 · 데이터 모델 · 교사용 설정 안내
```

## 배포

`.github/workflows/tycoon-deploy.yml` 이 `tycoon/**` 변경을 감지해 자동 배포합니다.
저장소 Secret 설정은 [docs/TEACHER_SETUP.md](docs/TEACHER_SETUP.md) 를 보세요.
