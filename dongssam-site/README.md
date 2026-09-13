# 동쌤 개인 웹페이지

`index.html` 한 파일로 된 정적 사이트입니다. 빌드 도구 없이 CDN만 사용합니다.

## 로컬에서 보기

```bash
cd dongssam-site
python3 -m http.server 8080
# http://localhost:8080
```

## 자료 추가하기

`index.html` 아래쪽 `<script>` 맨 위의 `PROJECTS` 배열에 객체를 한 줄 추가하면
카드 · 분류 필터 칩 · QR 모달이 전부 자동으로 반영됩니다.

```js
{ title:"제목", url:"https://...", desc:"한 줄 설명", category:"역사 게임", icon:"gamepad-2" }
```

`icon` 은 [Lucide](https://lucide.dev) 아이콘 이름입니다.
Lucide 는 브랜드 아이콘(instagram, youtube)을 제공하지 않아 해당 두 개만 인라인 SVG 로 넣어 두었습니다.

## Firebase Hosting 배포

이 폴더는 저장소 루트의 History Globe 앱과 **별개 사이트**입니다.
루트 `firebase.json` 은 `public/` 을 배포 대상으로 하고 CSP 로 외부 CDN 을 모두 막고 있으므로,
이 사이트는 별도 Hosting 사이트(또는 별도 프로젝트)로 배포하세요.

```bash
firebase hosting:sites:create dongssam-home     # 최초 1회
firebase deploy --only hosting:dongssam-home
```

`firebase.json` 의 hosting 타깃 설정 예시:

```json
{ "target": "dongssam-home", "public": "dongssam-site",
  "ignore": ["firebase.json", "**/.*", "**/node_modules/**"] }
```

CSP 헤더를 붙인다면 `cdn.jsdelivr.net` · `unpkg.com` · `fonts.gstatic.com` 을 허용해야 합니다.
CDN 이 막히더라도 본문 텍스트 · 링크 · 카드 · 링크 복사 기능은 그대로 동작합니다(QR 이미지만 빠짐).
