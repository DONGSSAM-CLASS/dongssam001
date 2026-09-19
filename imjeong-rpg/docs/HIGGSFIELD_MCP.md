# 힉스필드(Higgsfield) MCP 연결과 활용

이 문서는 **힉스필드 MCP 를 Claude 에 연결하는 방법**과, 연결한 뒤
『임시정부 1919-1945』의 삽화를 만들어 게임에 넣는 절차를 정리한 것입니다.

> **먼저 알아 둘 것**
> 힉스필드 MCP 는 **이미지·영상 생성 도구**입니다. 3D 게임 화면(건물·인물·지형)은
> 이 저장소의 코드가 직접 그리며, 힉스필드가 만든 이미지는 **인트로 표지와 임무 장면 삽화**로
> 얹힙니다. 즉 힉스필드는 「게임을 만들어 주는 도구」가 아니라 「그림을 대 주는 도구」입니다.
> 이미지가 없어도 게임은 그대로 돌아갑니다.

---

## 1. 힉스필드 MCP 연결하기

### 공통 정보

| 항목 | 값 |
| --- | --- |
| MCP 서버 주소 | `https://mcp.higgsfield.ai/mcp` |
| 전송 방식 | HTTP |
| 인증 | **API 키 없음.** 브라우저가 열리면 힉스필드 계정으로 로그인해 승인 |
| 비용 | 힉스필드 계정의 크레딧이 차감됩니다(이미지·영상 생성은 유료) |

### (가) Claude Code — 터미널

```bash
claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp
```

실행하면 브라우저가 열립니다. 힉스필드 계정으로 로그인하고 **승인(Approve)** 을 누르면 끝입니다.
`--scope user` 를 주었으므로 이 컴퓨터의 모든 프로젝트에서 쓸 수 있습니다.

확인:

```bash
claude mcp list          # higgsfield 가 목록에 있고 connected 상태여야 합니다
```

Claude Code 대화창에서 `/mcp` 를 치면 연결 상태와 재인증 메뉴가 나옵니다.

### (나) Claude 데스크톱 앱 / claude.ai — 커넥터

1. 설정(Settings) → **커넥터(Connectors)**
2. **커스텀 커넥터 추가(Add custom connector)**
3. 이름 `Higgsfield`, 주소 `https://mcp.higgsfield.ai/mcp`
4. 저장하면 힉스필드 로그인 창이 뜹니다. 로그인 후 승인.

### (다) 이 원격 세션(클라우드)에서는 연결할 수 없습니다

이 저장소를 작업한 Claude Code 세션은 **브라우저를 띄울 수 없는 원격 환경**이라
OAuth 승인 화면을 열 수 없습니다. 힉스필드 연결은 **선생님 컴퓨터의 Claude Code 나
Claude 앱에서** 해 주세요. 연결한 뒤에는 이 저장소를 로컬에 내려받아
아래 4절의 작업을 진행하면 됩니다.

---

## 2. 힉스필드 MCP 가 제공하는 도구

연결되면 Claude 가 다음 도구를 쓸 수 있게 됩니다.

| 도구 | 하는 일 |
| --- | --- |
| `generate_image` | 글(프롬프트)로 이미지 생성. 여러 모델 선택 가능 |
| `generate_video` | 글이나 이미지로 짧은 영상 생성 |
| `create_character` | 참조 이미지로 「캐릭터」를 학습시켜 여러 장면에서 같은 모습 유지 |
| `get_generation_status` | 생성 작업의 진행 상태 확인 (영상은 시간이 걸립니다) |
| `list_characters` | 학습시킨 캐릭터 목록 보기 |

> 도구 이름과 모델 구성은 힉스필드 쪽 업데이트로 바뀔 수 있습니다.
> 연결 후 `/mcp` 또는 커넥터 상세 화면에서 실제 목록을 확인하세요.

---

## 3. 이 게임에서 지켜야 할 제작 원칙

역사 수업 자료이므로 아래를 반드시 지킵니다. `scripts/higgsfield-brief.mjs` 의
프롬프트는 이미 이 원칙에 맞춰 작성되어 있습니다.

1. **실존 인물의 얼굴을 만들지 않습니다.**
   김구·윤봉길 같은 분들의 생성 초상은 사진과 다른 얼굴을 「그 사람」처럼 보이게 만들어
   역사 오인을 부릅니다. 군중·실루엣·뒷모습·장소·사물 위주로 만듭니다.
2. **생성 이미지는 사료가 아니라 삽화입니다.**
   화면에서도, 수업에서도 그렇게 설명합니다. 사료는 `src/data/quests.ts` 의
   `sources` 에 들어 있는 원문과 출처입니다.
3. **폭력 장면을 만들지 않습니다.**
   의열 투쟁은 「그 선택이 왜 내려졌고 무엇을 바꾸었는가」로 다룹니다.
   폭발·유혈 장면 대신 식장·거리·문서 같은 정황을 그립니다.
4. **시대에 없던 물건을 넣지 않습니다.**
   프롬프트에 `no modern objects` 를 넣어 두었습니다. 결과물에 전선·자동차·간판 글씨 등이
   시대와 맞지 않게 나오면 다시 만듭니다.

---

## 4. 실제 작업 절차

### 1) 주문서 뽑기

```bash
npm run assets:higgsfield             # 24장 전체
npm run assets:higgsfield q-hongkou   # 특정 장면만
```

장면 제목 · 저장할 파일 이름 · 화면 비율 · 프롬프트가 출력됩니다.

### 2) Claude 에게 시키기

힉스필드 MCP 가 연결된 Claude 대화창에 이렇게 말합니다.

```
힉스필드로 아래 프롬프트의 이미지를 21:9 비율로 만들어 줘.

A large park ceremony ground in Shanghai, morning of 29 April 1932. ...
(주문서에서 복사한 프롬프트 전체)
```

여러 장을 한 번에 시켜도 됩니다. 영상은 시간이 걸리므로
`get_generation_status` 로 상태를 확인하라고 일러 주세요.

### 3) 저장하기

내려받은 이미지를 아래 경로에 **주문서에 적힌 파일 이름 그대로** 저장합니다.

```
public/assets/higgsfield/cover.jpg
public/assets/higgsfield/quest-q-founding.jpg
public/assets/higgsfield/quest-q-hongkou.jpg
...
```

확장자는 `jpg` · `webp` · `png` 를 찾습니다. 파일이 없으면 그 자리는 그냥 비어 있고
게임은 정상 동작합니다.

### 4) 확인하고 배포

```bash
npm run dev      # http://localhost:5183 에서 확인
npm run build
npm run deploy   # Firebase Hosting (docs/DEPLOY.md 참고)
```

---

## 5. 자주 막히는 곳

| 증상 | 해결 |
| --- | --- |
| `claude mcp add` 후 목록에 안 보임 | `claude mcp list` 로 확인. `--scope user` 를 빼면 그 폴더에서만 잡힙니다 |
| 「인증이 필요합니다」가 반복 | Claude Code 에서 `/mcp` → higgsfield → 재인증 |
| 이미지가 게임에 안 보임 | 파일 이름·확장자·폴더 경로 확인. `npm run build` 를 다시 하세요 |
| 사람 얼굴이 또렷하게 나옴 | 프롬프트 뒤의 `faces turned away or in shadow, no recognizable portraits of real people` 가 빠지지 않았는지 확인하고 다시 생성 |
| 크레딧 부족 | 힉스필드 계정의 요금제 확인 (이미지·영상 생성은 유료입니다) |

---

## 6. Codex 로 이어 작업할 때

Claude 가 뼈대를 잡고 Codex 가 이어받는 방식이라면, Codex 쪽에도 같은 MCP 를 붙일 수 있습니다.
Codex CLI 의 설정 파일(`~/.codex/config.toml`)에 MCP 서버를 등록하는 방식이며,
자세한 항목 이름은 Codex 버전마다 다르므로 `codex mcp --help` 로 확인하세요.

다만 **그림을 누가 만들든 3절의 원칙은 그대로 지켜야 합니다.**
작업 인수인계 내용은 `docs/CODEX_HANDOFF.md` 를 보세요.
