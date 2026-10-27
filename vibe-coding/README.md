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

## 2026-10-27 실습 코스 개편

- 무료 도구 실습: Canva AI와 Gemini 각각 준비·입력창·기획·제작·수정·배포·공유 7단계.
- Canva Code: 현재 계정에서 무료로 제공되는 기능과 AI 한도 내 실습. 기능 미제공 시 Gemini 경로 안내.
- Gemini: Canvas 공유와 단일 HTML + 무료 공개 GitHub Pages 배포를 구분하여 안내.
- 유료 도구 실습: 기존 Codex / Claude Code 과정과 Firebase 배포 기능 유지.
- 테마·무료 도구별 진도 저장, 프롬프트 복사, 로컬 QR 생성, 선택 코스 인쇄 지원.
- 기존 운영 사이트의 최신 파일(2026-09-17)을 먼저 동기화한 뒤 변경했으므로 vendor CSS/JS도 함께 관리합니다.

대상은 `vibe-coding-dongssam`입니다. `.firebaserc`로 고정했습니다. 반드시 이 폴더에서 아래 명령을 실행하세요.

```bash
firebase deploy --only hosting --project vibe-coding-dongssam
```

배포 계정은 이 프로젝트의 Hosting 배포 권한이 있어야 합니다. 다른 웹앱의 Firebase 프로젝트나 저장소 루트에서는 실행하지 않습니다.
