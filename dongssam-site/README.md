# 동쌤 개인 홈페이지

현재 운영 중인 사이트는 https://dongssam-home-20260914.web.app/ 입니다.

## 현재 배포 소스

`public/`을 Firebase Hosting으로 배포합니다. 2026-10-27 운영 사이트의 최신 파일을 기준으로 유지합니다. 기존 루트 `index.html`과 이전 인수인계 문서는 초기 버전이며 현재 배포 대상이 아닙니다.

자료 추가는 `public/projects.js`의 PROJECTS 배열에서 관리합니다. 분류 필터, 검색, 카드 수, QR 공유에 자동 반영됩니다. `openLabel`을 지정하면 해당 자료의 열기 버튼 문구를 바꿀 수 있습니다.

```bash
cd dongssam-site
firebase deploy --only hosting --project dongssam-home-20260914
```

`firebase.json`은 `dongssam-home-20260914` 사이트만 지정합니다. 같은 프로젝트의 역사 레이싱 사이트에는 배포하지 않습니다.

## 2026-10-27 자료 추가

- 교원 연수: 바이브코딩 실습 프롬프트 모음 (사용자가 제공한 공개 Notion 링크)
- 역사 게임: 번동중 퇴마록
- 역사 게임: 철의 결전: 해방의 균열 (독립운동가 콘셉트의 가상 FPS)

기존 18개 자료를 유지해 전체 21개입니다.
