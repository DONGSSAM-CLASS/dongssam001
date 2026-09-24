# 힉스필드(Higgsfield) MCP 연결과 삽화 만들기 — 제2탄

『임시정부 : 새로운 나라를 향해』는 1탄과 같은 방식으로 힉스필드 MCP를 씁니다.
**3D 화면(방·가구·인물·지형)은 코드로 그리고, 힉스필드는 삽화와 하늘 파노라마를 만듭니다.**
이미지가 하나도 없어도 게임은 그대로 돌아갑니다. 학교 네트워크나 예산 사정으로 삽화를 못 만들어도 수업에는 지장이 없습니다.

> **이 저장소를 만든 Claude Code 세션에는 힉스필드 MCP가 연결되어 있지 않았습니다.**
> 클라우드 원격 세션은 브라우저 로그인(OAuth) 창을 띄울 수 없어서 힉스필드 계정 연결을 할 수 없습니다.
> 그래서 이 저장소에는 **주문서(`npm run assets:higgsfield`)와 이미지가 자동으로 붙는 코드**까지만 준비해 두었습니다.
> 실제 이미지는 선생님 컴퓨터의 Claude Code 또는 Claude 앱에서 아래 절차로 만들어 넣어 주세요.

---

## 1. 연결하기 (처음 한 번)

| 항목 | 값 |
| --- | --- |
| MCP 서버 주소 | `https://mcp.higgsfield.ai/mcp` |
| 전송 방식 | HTTP |
| 인증 | 브라우저가 열리면 힉스필드 계정으로 로그인해 승인 (API 키 없음) |
| 비용 | 힉스필드 계정의 크레딧이 차감됩니다 |

**Claude Code (터미널)**

```bash
claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp
claude mcp list        # higgsfield 가 connected 로 보이면 성공
```

**Claude 앱 / claude.ai** — 설정 → 커넥터 → 커스텀 커넥터 추가 → 이름 `Higgsfield`, 주소 `https://mcp.higgsfield.ai/mcp`

> 도구 이름(예: `generate_image`, `get_generation_status`)은 힉스필드 쪽 업데이트로 바뀔 수 있습니다.
> 연결한 뒤 `/mcp` 나 커넥터 상세 화면에서 실제 목록을 확인하세요.

---

## 2. 2탄에서 쓰는 이미지 — 모두 40장

| 종류 | 파일 이름 | 비율 | 어디에 뜨나 |
| --- | --- | --- | --- |
| 표지 | `cover.jpg` | 16:9 | 시작 화면 |
| 시대 전환 | `act-1.jpg` ~ `act-6.jpg` | 21:9 | 막이 바뀔 때 뜨는 전환 화면 |
| 임무 삽화 | `quest-q-name.jpg` 등 25장 | 21:9 | 임무 풀이 화면 위쪽 |
| 엔딩 | `ending.jpg` | 21:9 | 감사 증서 화면 |
| **하늘 파노라마** | `sky-assembly.jpg` 등 6장 | **2:1** | **1인칭 3D 화면의 하늘** (2탄 새 기능) |

하늘 파노라마는 `sky-<장소 id>.jpg` 이름으로 넣으면 3D 화면의 배경 하늘이 그 그림으로 바뀝니다.
장소 id: `memorial` · `assembly` · `hafei` · `madang` · `chongqing` · `seoul`.
360도 등장방형(equirectangular) 이미지여야 이음매 없이 둘러집니다.

---

## 3. 만드는 절차

### 1) 주문서 뽑기

```bash
cd imjeong-rpg2
npm run assets:higgsfield              # 40장 전체
npm run assets:higgsfield act-         # 시대 전환 6장만
npm run assets:higgsfield sky-         # 하늘 파노라마 6장만
npm run assets:higgsfield -- --json    # MCP 에 넘기기 좋은 JSON
```

### 2) Claude 에게 시키기 (힉스필드 MCP 가 연결된 대화창)

```
imjeong-rpg2 폴더에서 `npm run assets:higgsfield -- --json` 을 실행해서 나온 목록대로
힉스필드로 이미지를 만들어 줘. 각 항목의 aspect_ratio 를 지키고,
완성되면 file 경로에 jpg 로 저장해 줘. 한 장씩 결과를 확인하고,
실존 인물의 얼굴이 또렷하거나 글자·현대 물건이 보이면 다시 만들어 줘.
```

영상은 쓰지 않습니다. 이미지만 만들면 됩니다.

### 3) 확인하고 배포

```bash
npm run dev       # http://localhost:5184 에서 확인
npm run check     # 타입 검사 + 테스트 + 빌드
npm run deploy    # docs/DEPLOY.md 참고
```

2탄은 1탄과 달리 `public/assets/higgsfield/*.jpg` 를 **git 에 올려도 되도록** 열어 두었습니다.
이미지를 커밋하면 다른 컴퓨터에서 배포해도 삽화가 함께 실립니다. (영상 `*.mp4` 는 제외)

---

## 4. 반드시 지킬 것 (1탄과 같다)

1. **실존 인물의 얼굴을 만들지 않습니다.** 프롬프트에 인물 이름을 넣지 않았고, 모든 프롬프트 끝에
   `faces turned away or in shadow, no recognizable portraits of real people` 가 붙어 있습니다.
2. **생성 이미지는 사료가 아니라 삽화입니다.** 게임 화면의 그림 설명에도 「삽화 — 사료가 아닙니다」라고 적힙니다.
3. **폭력 장면을 만들지 않습니다.**
4. **시대에 없던 물건을 넣지 않습니다.** 자동차·전선·현대 간판·읽을 수 있는 가짜 글자가 나오면 다시 만듭니다.

---

## 5. 자주 막히는 곳

| 증상 | 해결 |
| --- | --- |
| 하늘이 바뀌지 않음 | 파일 이름이 `sky-<장소>.jpg` 인지, **jpg** 인지 확인 (하늘은 jpg 만 찾습니다) |
| 하늘에 이음매가 보임 | 2:1 등장방형 360도 이미지인지 확인하고 다시 만듭니다 |
| 삽화가 안 뜸 | 파일 이름·폴더 확인, `npm run build` 다시 |
| 「인증이 필요합니다」 반복 | Claude Code 에서 `/mcp` → higgsfield → 재인증 |
