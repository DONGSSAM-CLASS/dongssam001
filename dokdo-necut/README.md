# 🇰🇷 독도네컷 (Dokdo Necut)

독도의 날(10월 25일)을 기념하는 **인생네컷** 스타일 사진 촬영 웹앱입니다.
독도 콘텐츠 체험부스에서 학생들이 태블릿(아이패드·갤럭시탭)/노트북으로 바로 이용할 수 있습니다.

> 이 폴더는 같은 저장소의 **History Globe** 앱(React/Vite, 루트)과 완전히 분리된
> **순수 정적 웹앱**입니다. 서로의 빌드·배포에 영향을 주지 않습니다.

## 기능
1. **친구 이름 입력** (최대 6명) — 네컷에 예쁘게 새겨집니다.
2. **독도 역사 인물 선택** — 이사부(신라)·안용복(조선)·심흥택(대한제국)·홍순칠(대한민국)이
   **역사 고증(활동 시기·복식)에 기반한 클레이(점토) 질감 캐릭터**로 함께 등장합니다.
3. **독도 배경 스타일 3종** — 3D 실사 / 애니메이션 / 스케치. 실제 독도 지형(서도·동도·등대·태극기)을 정확히 반영.
4. **프레임 테마 5종** 템플릿 선택.
5. **5초 타이머 촬영** — 자동으로 4컷을 찍고 선택한 스타일 필터를 적용합니다.
   (카메라를 못 쓰는 기기에서는 **사진 업로드**로 대체 가능)
6. **인스타그래머블 네컷 합성** — 1080×1350 세로형으로 자동 생성.
7. **굿즈 합성 미리보기** — 폰케이스·에코백·머그컵·스티커·키링·포토카드.
8. **저장 · 공유 · SNS(X/Facebook/Threads) · QR코드 다운로드**.
9. **아이패드·갤럭시탭·데스크탑** 반응형 지원.

## 🔒 개인정보 보호 / 보안
- **촬영한 사진과 이름은 서버로 전송·저장되지 않습니다.** 카메라 촬영·필터·합성·저장까지
  **모두 사용자 기기(브라우저) 안에서만** 처리되는 순수 정적 웹앱입니다.
- 백엔드·데이터베이스·로그인·업로드가 없어 유출 위험이 구조적으로 없습니다.
- 카메라 권한은 촬영 목적으로만 쓰이며 `Permissions-Policy: camera=(self)` 로 제한됩니다.

## ℹ️ 구현 관련 안내 (정직한 고지)
- **역사 인물 캐릭터**: 실존 초상이 전하지 않는 인물이 대부분이라, 각 인물의 **활동 시기와 복식을
  고증한 교육용 스타일 클레이 일러스트(SVG)** 로 표현했습니다. (특정인의 실제 얼굴 재현이 아님)
- **"AI 이미지 생성"**: 개인정보를 외부로 보내지 않고 누구나 안전하게 쓰도록, 생성형 AI 서버 대신
  **브라우저 내 이미지 필터(3D 실사·셀 애니·연필 스케치)** 로 스타일을 입힙니다. 사진이 기기 밖으로 나가지 않습니다.
  (외부 생성형 AI API 연동은 API 키 보호를 위한 별도 서버가 필요해 무료 정적 배포·개인정보 보호 원칙과 상충하므로 채택하지 않았습니다.)

## 파일 구성
```
dokdo-necut/
├── index.html     # 화면 · 스타일
├── app.js         # 앱 로직(촬영·필터·합성·굿즈·공유·QR)
├── figures.js     # 역사 인물 클레이 캐릭터 SVG
├── dokdo.js       # 독도 배경 씬(3D/애니/스케치)
├── firebase.json  # Hosting 설정(이 폴더만 배포)
└── .firebaserc    # Firebase 프로젝트 alias(dokdo-necut)
```

## 🚀 Firebase Hosting 자동 배포
`dokdo-necut/` 안의 파일이 바뀐 채로 `main` 에 push 하면 GitHub Actions
(`.github/workflows/dokdo-necut-deploy.yml`)가 **이 폴더만** Firebase Hosting 에 자동 배포합니다.

### 최초 1회 설정
1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성 (요금제 Spark 그대로).
   - 프로젝트 ID 를 **`dokdo-necut`** 로 가정합니다. 다른 ID 를 쓰면 `.firebaserc` 와
     워크플로의 `projectId` 를 실제 ID 로 바꿔주세요.
2. 서비스 계정 키 발급 → GitHub 저장소 **Settings → Secrets and variables → Actions** 에
   `FIREBASE_SERVICE_ACCOUNT_DOKDO` 이름으로 JSON 전체를 등록.
   - 로컬에 Firebase CLI 가 있으면 `firebase init hosting:github` 로 시크릿을 자동 생성할 수 있습니다.
3. 이후 `main` 에 push → Actions 탭에서 배포 확인 → `https://dokdo-necut.web.app` 접속.

### 로컬 수동 배포 (선택)
```bash
npm install -g firebase-tools
firebase login
cd dokdo-necut
firebase use dokdo-necut        # 또는 firebase use --add
firebase deploy --only hosting
```

### 로컬 미리보기
```bash
cd dokdo-necut && python3 -m http.server 8000
# http://localhost:8000  (카메라는 https 또는 localhost 에서만 동작)
```
