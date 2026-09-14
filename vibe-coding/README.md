# 바로 써먹는 바이브코딩 첫 걸음 [기초편]

교사 연수용 정적 웹페이지입니다. 빌드 도구 없이 `public/` 폴더를 그대로 올리면 됩니다.

## 배포 방법 (3단계)

```bash
npm install -g firebase-tools   # 1. Firebase CLI 설치
firebase login                  # 2. 구글 계정 로그인 (브라우저 승인)
firebase deploy                 # 3. 배포 → https://<프로젝트>.web.app
```

> 처음 한 번은 `firebase init hosting`으로 프로젝트를 연결하고 `.firebaserc`를 만들어야 합니다.
> public 디렉터리는 `public`, SPA는 `아니오`, `index.html` 덮어쓰기는 반드시 `아니오`를 고르세요.

## 폴더 구조

```
vibe-coding/
  firebase.json
  README.md
  public/
    index.html
    assets/css/custom.css
    assets/js/app.js
```

## 메모

- 이 폴더는 저장소 루트의 다른 앱(`/public`, 루트 `firebase.json`)과 **분리된 독립 사이트**입니다.
  루트에서가 아니라 **이 폴더 안에서** `firebase` 명령을 실행하세요.
- 서버·로그인·분석 스크립트가 없습니다. 체크 상태와 입력값은 브라우저 `localStorage`에만 저장됩니다.
- QR은 클라이언트에서 생성합니다(외부 QR 생성 API를 호출하지 않습니다).
