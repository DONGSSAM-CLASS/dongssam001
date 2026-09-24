# Firebase Hosting 배포 — 제2탄

1탄(<https://imjeong-classroom-20260923.web.app/>)과 같은 방식으로 올립니다.
2탄도 **서버가 필요 없는 정적 웹페이지**입니다 (로그인·데이터베이스 없음, 기록은 학생 브라우저에만 저장).

> ⚠ 이 저장소를 작업한 Claude Code 원격 세션에서는 배포할 수 없습니다.
> `firebase login` 이 브라우저 로그인을 요구하기 때문입니다. 아래는 선생님 컴퓨터에서 한 번만 하면 됩니다.

## 1. 프로젝트 정하기

두 가지 방법 중 하나를 고르세요.

**(가) 새 Firebase 프로젝트** — 콘솔에서 프로젝트를 만들고(예: `imjeong-classroom-2`), 그 ID 를 `.firebaserc` 에 적습니다.

```json
{ "projects": { "default": "여기에-프로젝트-ID" } }
```

**(나) 1탄과 같은 프로젝트에 사이트만 하나 더** — Firebase 콘솔 → Hosting → 「사이트 추가」로 예: `imjeong-new-nation` 을 만든 뒤

```bash
cd imjeong-rpg2
npx firebase use 1탄-프로젝트-ID
npx firebase target:apply hosting game2 imjeong-new-nation
```

그리고 `firebase.json` 의 `"hosting": {` 바로 아래에 `"target": "game2",` 한 줄을 넣고, 배포할 때 `npx firebase deploy --only hosting:game2` 를 씁니다.

## 2. 배포

```bash
cd imjeong-rpg2
npm install            # 처음 한 번 (.npmrc 의 legacy-peer-deps 사용)
npm run check          # 타입 검사 + 테스트 + 빌드
npx firebase login
npm run deploy
```

## 3. 개인정보 안내 (학부모·학교 제출용)

- 이름·이메일·학번을 받지 않습니다. 로그인이 없습니다.
- 편지 끝에 적는 「부름말」은 선택 사항이며, 실명을 쓰지 않도록 화면에서 안내합니다.
- 진행 기록·편지는 학생 브라우저의 localStorage 에만 저장되고 서버로 나가지 않습니다
  (`firebase.json` 의 CSP 가 `connect-src 'self'` 로 막고 있습니다).
- 「보훈 포인트」와 「기부」는 게임 속 활동이며 실제 결제·송금 기능은 없습니다.
- 공유 컴퓨터에서 쓴 뒤에는 도움말 → 「처음부터 다시」로 기록과 편지를 지울 수 있습니다.
