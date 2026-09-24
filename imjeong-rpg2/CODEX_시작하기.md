# Codex 로 이어서 작업하기 — 5분 안에 시작 (제2탄)

이 압축파일에는 **2탄 『임시정부 : 새로운 나라를 향해』(`imjeong-rpg2`)** 와,
2탄이 내용으로 이어지는 **1탄 『임시정부 1919-1945』(`imjeong-rpg`)** 가 함께 들어 있습니다.
`node_modules` 와 빌드 결과물(`dist`)은 빼서 용량을 줄였습니다.

> 두 폴더는 **같은 부모 폴더 아래에** 그대로 두세요. 2탄 테스트 하나가 1탄의 퀘스트 파일을 읽어
> 두 게임의 연결을 검사합니다.

---

## 1. 압축을 풀고 실행

```bash
unzip imjeong-rpg2-handoff.zip
cd imjeong-rpg2
npm install          # 2~3분
npm run dev          # http://localhost:5184
```

> `npm install` 이 `Cannot read properties of null (reading 'edgesOut')` 로 실패하면
> 폴더에 `.npmrc` 가 있는지 확인하세요. 내용은 `legacy-peer-deps=true` 한 줄입니다.

## 2. 지금 상태가 멀쩡한지 확인

```bash
npm run check                    # 2탄: 타입 검사 + 테스트 133개 + 빌드
cd ../imjeong-rpg && npm install && npm run check   # 1탄: 테스트 73개
```

## 3. 화면

| 주소 | 무엇 |
| --- | --- |
| `http://localhost:5184/` | 2탄 게임 |
| `http://localhost:5184/?preview=assembly` | 장소 검수 (memorial·assembly·hafei·madang·chongqing·seoul) |
| `http://localhost:5184/?teacher` | 교사용 화면 — 확인 번호 **0411** |
| `http://localhost:5183/` | 1탄 게임 (`imjeong-rpg` 에서 `npm run dev`) |

## 4. 읽을 순서

1. `README.md` — 전체 구조와 기능
2. `docs/CODEX_HANDOFF.md` — **규칙 · 좌표 약속 · 남은 일(우선순위 순)**
3. `docs/HISTORY_SOURCES.md` — 사료 출처와 확인할 쟁점
4. `docs/TEACHER_GUIDE.md` — 수업 흐름·교사 화면·생각 노트
5. `docs/HIGGSFIELD_MCP.md` — 힉스필드 삽화 40장 만들기
6. `docs/DEPLOY.md` — Firebase 배포

## 5. Codex 에 붙여 넣을 프롬프트

`CODEX_프롬프트.txt` 의 내용을 그대로 복사해 Codex 대화창에 붙여 넣으세요.

## 6. 배포

```bash
npx firebase login
npm run deploy
```

2탄 주소가 정해지면 1탄 `.env` 에 `VITE_SEQUEL_URL=2탄주소` 를 넣고 1탄도 다시 배포하세요.
(1탄을 다 마친 학생에게 2탄으로 가는 버튼이 생깁니다.)
