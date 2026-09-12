# 브라우저 자동 플레이 테스트

모든 퍼즐을 실제로 풀어 보는 회귀 테스트입니다. 내용을 고친 뒤 한 번 돌려 주세요.

```bash
# 1) 로컬 서버를 띄운다
npx serve -l 8321 ..

# 2) Playwright 준비 (한 번만)
npm i playwright

# 3) 돌린다 — 브라우저 실행 파일 경로는 환경에 맞게 고치세요
node playthrough.mjs ms     # 중학생용 전체 플레이
node playthrough.mjs hs     # 고등학생용 전체 플레이
SHOTS=./shots node uxtest.mjs   # 저장/이어하기, 힌트 잠금, 휴대폰 화면
```

`playthrough.mjs` 가 확인하는 것
- 여섯 미션의 브리핑 제목, 자물쇠 이름, 열쇠 조각이 데이터와 일치하는가
- 오답을 넣었을 때 오답 안내가 뜨는가
- 정답을 넣었을 때 자물쇠가 열리는가 (모든 문항)
- 사료 상자 수와 APA 출처 수가 같은가 (출처 누락 방지)
- 기록판 항목이 6개인가, 결과 화면에 성취기준 4개와 제작자 표기가 있는가
- 콘솔 오류·페이지 오류가 하나도 없는가
- 380px 좁은 화면에서 가로 스크롤이 생기지 않는가

## 보안 규칙 검사

학생이 남의 기록을 보지 못하는지, 교사가 남의 학급을 건드리지 못하는지,
다른 반을 사칭해 가입할 수 없는지를 Firestore 에뮬레이터로 확인합니다. (34개 항목)

```bash
npm i @firebase/rules-unit-testing firebase
npx firebase-tools emulators:exec --only firestore \
  --project demo-korea-time "node tests/rules.test.mjs"
```

에뮬레이터 실행에는 Java 가 필요합니다.

## 한 줄 명령 (package.json)

```bash
npm run validate     # 데이터 무결성 검사
npm run serve        # 로컬 서버 (다른 터미널에서 먼저 띄운다)
npm run test:play    # 중·고 두 난이도 전체 플레이
npm run test:ux      # 저장·이어하기, 힌트 개방, 휴대폰 화면
npm run test:rules   # 보안 규칙 34항목 (Java 필요)
npm run deploy       # Hosting + 규칙 배포
```
