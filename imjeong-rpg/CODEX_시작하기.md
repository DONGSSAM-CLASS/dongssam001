# Codex 로 이어서 작업하기 — 5분 안에 시작

이 압축파일에는 『임시정부 1919-1945』 프로젝트 전체가 들어 있습니다.
`node_modules` 와 빌드 결과물(`dist`)은 빼서 용량을 줄였습니다.

---

## 1. 압축을 풀고 실행

```bash
unzip imjeong-rpg-handoff.zip
cd imjeong-rpg
npm install          # 2~3분
npm run dev          # http://localhost:5183
```

> `npm install` 이 `Cannot read properties of null (reading 'edgesOut')` 로 실패하면
> `.npmrc` 파일이 빠진 것입니다. 프로젝트 폴더에 아래 한 줄짜리 `.npmrc` 를 만드세요.
> ```
> legacy-peer-deps=true
> ```

## 2. 지금 상태가 멀쩡한지 확인

```bash
npm run check        # 타입 검사 + 테스트 73개 + 빌드
```

셋 다 통과하면 정상입니다.

## 3. 화면 세 가지

| 주소 | 무엇 |
| --- | --- |
| `http://localhost:5183/` | 게임 |
| `http://localhost:5183/?lineup` | 인물 34명을 3D 로 줄 세워 보는 검수 화면 (↑↓ 줄 이동, 휠 확대) |
| `http://localhost:5183/?portraits` | 인물 34명의 2D 초상을 격자로 보는 검수 화면 |

## 4. 읽을 순서

1. `README.md` — 전체 구조와 규칙
2. `docs/CODEX_HANDOFF.md` — **남은 일 목록(우선순위 순)과 깨뜨리면 안 되는 규칙**
3. `docs/HISTORY_SOURCES.md` — 역사 서술의 원칙, 출처, 확인이 필요한 쟁점
4. `docs/HIGGSFIELD_MCP.md` — 힉스필드 MCP 연결과 삽화 만들기
5. `docs/DEPLOY.md` — Firebase Hosting 배포

## 5. Codex 에 붙여 넣을 프롬프트

`CODEX_프롬프트.txt` 파일의 내용을 그대로 복사해 Codex 대화창에 붙여 넣으세요.

## 6. 배포

```bash
npx firebase login     # dongssam2021@gmail.com
npm run deploy
```

Firebase 콘솔에서 프로젝트를 먼저 만들고 `.firebaserc` 의 ID 를 바꿔야 합니다.
자세한 절차는 `docs/DEPLOY.md`.
