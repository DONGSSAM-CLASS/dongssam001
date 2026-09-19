# Firebase Hosting 배포

계정: **dongssam2021@gmail.com**

> **⚠ 이 저장소를 작업한 Claude Code 세션에서는 배포할 수 없습니다.**
> Firebase 로그인은 브라우저 OAuth 가 필요한데, 이 세션은 브라우저를 띄울 수 없는
> 원격 컨테이너입니다. `firebase login` 을 대신 실행해 줄 수 없고, 토큰도 가지고
> 있지 않습니다. 아래 절차를 **선생님 컴퓨터에서** 한 번만 해 주시면 됩니다.
> (설정 파일·빌드·스크립트는 모두 준비되어 있습니다.)

---

## 1. 준비 (처음 한 번만)

### (1) Firebase 프로젝트 만들기

1. <https://console.firebase.google.com> 에 **dongssam2021@gmail.com** 으로 로그인
2. **프로젝트 추가** → 이름 예: `dongssam-imjeong-rpg`
3. Google 애널리틱스는 꺼도 됩니다(이 게임은 개인정보를 수집하지 않습니다).
4. 만들어진 **프로젝트 ID** 를 적어 둡니다. (이름과 다를 수 있습니다)

> 이 게임은 **Hosting 만** 씁니다. Authentication·Firestore 는 쓰지 않으므로
> 무료(Spark) 요금제로 충분합니다.

### (2) 프로젝트 ID 를 저장소에 반영

`.firebaserc` 의 `default` 를 방금 만든 프로젝트 ID 로 바꿉니다.

```json
{
  "projects": {
    "default": "여기에-실제-프로젝트-ID"
  }
}
```

또는 명령으로:

```bash
cd imjeong-rpg
npx firebase use 여기에-실제-프로젝트-ID
```

---

## 2. 배포

```bash
cd imjeong-rpg
npm install            # 처음 한 번만
npx firebase login     # 브라우저가 열립니다 → dongssam2021@gmail.com 으로 로그인
npm run deploy         # 빌드 + Hosting 배포
```

`npm run deploy` 는 내부적으로 다음을 실행합니다.

```bash
npm run build                          # tsc 타입 검사 + vite 빌드 → dist/
npx firebase deploy --only hosting     # dist/ 를 Hosting 에 올림
```

성공하면 이런 주소가 나옵니다.

```
Hosting URL: https://여기에-실제-프로젝트-ID.web.app
```

학생들에게는 이 주소를 알려 주면 됩니다.

---

## 3. 배포 전 점검 (권장)

```bash
npm run check    # 타입 검사 + 테스트 70개 + 빌드를 한 번에
```

`npm test` 는 콘텐츠 무결성까지 검사합니다.
「사료 없는 문제」나 「풀 수 없는 퀘스트」가 있으면 여기서 걸립니다.

---

## 4. 이미 다른 프로젝트를 쓰고 있다면

이 저장소에는 다른 수업 자료(History Globe, 다산의 시간 등)도 함께 있습니다.
같은 Firebase 프로젝트에 **여러 사이트**를 두고 싶다면:

```bash
# Firebase 콘솔 → Hosting → 사이트 추가 → 예: imjeong-rpg
npx firebase target:apply hosting imjeong imjeong-rpg
```

그리고 `firebase.json` 의 `hosting` 에 `"target": "imjeong"` 을 추가한 뒤

```bash
npx firebase deploy --only hosting:imjeong
```

---

## 5. 다른 곳에 올려도 됩니다

이 게임은 **서버가 필요 없는 정적 웹페이지**입니다(로그인·데이터베이스를 쓰지 않고,
진행 기록은 학생 브라우저 안에만 저장됩니다). 따라서 아래 어디에 올려도 그대로 돌아갑니다.

- GitHub Pages — `dist/` 를 `gh-pages` 브랜치에 올리기
- Netlify · Vercel — 빌드 명령 `npm run build`, 배포 폴더 `dist`
- 학교 홈페이지의 정적 폴더 — `dist/` 통째로 복사

`vite.config.ts` 에 `base: './'` 를 두었으므로 하위 경로(`/imjeong-rpg/`)에 올려도 동작합니다.

---

## 6. 개인정보 안내 (학부모·학교 제출용)

- 이 게임은 **이름·이메일·학번 등 어떤 개인정보도 수집하지 않습니다.**
- 로그인 기능이 없습니다.
- 진행 기록(자원·푼 문제·동지 목록)은 **학생이 쓰는 브라우저 안(localStorage)에만** 저장되며,
  서버로 전송되지 않습니다. 브라우저 기록을 지우면 함께 사라집니다.
- 외부로 나가는 네트워크 요청이 없습니다. (`firebase.json` 의 CSP 가 `connect-src 'self'` 로
  제한하고 있습니다.)
