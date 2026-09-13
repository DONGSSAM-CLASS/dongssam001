# 검증 스크립트

`dongssam-site/index.html` 의 회귀를 확인하는 Playwright 스크립트입니다.

## 준비

```bash
npm i playwright
cd ../dongssam-site && python3 -m http.server 8080 &
```

## 실행

```bash
mkdir -p shots
node check.mjs       # 렌더링·필터·QR·모달·복사·콘솔 에러 종합 점검
node qrsize.mjs      # 5개 뷰포트에서 QR 실측 (교실 송출 크기 요건 확인)
node fallback.mjs    # 외부 CDN 전부 차단 시 폴백 동작 확인
```

환경 변수로 조정할 수 있습니다.

- `BASE_URL` — 기본 `http://127.0.0.1:8080`
- `CHROME_PATH` — 번들 Chromium 대신 쓸 브라우저 실행 경로

## 통과 기준

- `check.mjs` — 카드 7개(또는 `PROJECTS.length`), 필터 칩 자동 생성, 콘솔 이슈 `none`,
  클립보드 복사 성공, ESC·배경 클릭 닫힘, 360px 가로 스크롤 없음
- `qrsize.mjs` — 1280×900에서 QR 540px, 1920×1080에서 648px (짧은 변의 60%)
- `fallback.mjs` — 카드·링크·모달 URL·복사 전부 동작, JS 에러 0건 (QR 이미지만 생략)

## 주의

`fallback.mjs` 는 `**/lib/**` 경로를 차단하도록 되어 있습니다.
이는 CDN이 막힌 개발 환경에서 라이브러리를 로컬 `lib/` 로 치환해 테스트했기 때문입니다.
CDN을 그대로 쓰는 환경에서는 차단 패턴을 `**/cdn.jsdelivr.net/**`, `**/unpkg.com/**` 로 바꾸세요.

QR 크기를 잴 때는 **canvas가 아니라 img** 를 잡아야 합니다.
qrcodejs가 canvas를 만든 뒤 `display:none` 으로 숨기고 img를 노출하기 때문입니다.
