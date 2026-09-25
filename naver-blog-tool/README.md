# 동쌤 AI 활용 블로그 자동 작성 툴

사진 몇 장 넣고 메모 한 줄 쓰면 → Claude Code가 사진을 직접 보고 네이버 상위노출 공식대로 초안을 쓰고 → 내가 승인하면 **네이버 블로그 임시저장**까지 해 줘요. 발행 버튼만 내가 누르면 끝.

- API 요금 없음 — Claude 구독(Pro 이상)으로만 돌아가요.
- **발행은 절대 자동으로 안 해요.** 진짜 발행 버튼은 코드로 막혀 있어요(발행 차단 가드).
- 브라우저 자동화는 네이버 약관상 회색지대예요. 본인 계정, 하루 1~2건 수준으로만 쓰세요.

## 처음 한 번만 — 설치 (내 PC에서)

> 네이버 로그인·임시저장은 브라우저 창이 떠야 해서 **내 컴퓨터에서** 실행해야 해요.

1. [nodejs.org](https://nodejs.org)에서 LTS 설치 → 터미널에서 `node -v`로 확인
2. Claude Code 설치: `npm install -g @anthropic-ai/claude-code` → 터미널을 닫았다가 다시 열기
3. 이 저장소를 내려받고 `naver-blog-tool` 폴더에서 터미널 열기
4. 아래를 한 줄씩 실행:
   ```
   npm install
   npx playwright install chromium
   claude
   ```
5. Claude Code 채팅에 `/setup-login` → 뜨는 브라우저 창에서 네이버에 직접 로그인 (비밀번호는 저장 안 됨, 세션만 `naver-profile/`에 저장)

## 평소 사용법

1. `input/photos/`에 사진을 넣어요 (영상이 있으면 `input/videos/`)
2. 채팅에 입력: `/write 클로드로 역사 퀴즈 게임 만들기, 협찬 아님, 3시간 걸렸는데 학생 반응 좋았음`
3. AI가 모르는 건 되물어요 (지어내지 않아요) → 초안 + 미리보기(`drafts/*.preview.html`) 확인
4. "임시저장해 줘" → 네이버 **글쓰기 → 저장 글**에서 확인 후 직접 발행

## 첫 테스트 글이 준비돼 있어요

`drafts/20260925-ai-quiz-game.json` — 「동쌤의 중학교 2학년 역사 탐험대」 게임 화면 12장으로 쓴 **"AI 수업 게임 만들기"** 글이에요.
미리보기: `node scripts/preview_draft.js drafts/20260925-ai-quiz-game.json` → `drafts/20260925-ai-quiz-game.preview.html`을 브라우저로 열기.
내용을 확인하고 채팅에 "첫 테스트 글 dry-run 해 줘"라고 하면, 저장 없이 입력만 테스트해요.

## 그 밖의 명령

| 명령 | 하는 일 |
|---|---|
| `/learn-style` + 잘 쓴 글 붙여넣기 | 말투·구성·심리 전략을 학습 (문장은 베끼지 않음) |
| `/analyze-trends` + 상위노출 글 붙여넣기 | 글자 수·사진 수·제목 구조 같은 세팅값 저장 |
| `/setup-login` | 네이버 로그인이 풀렸을 때 다시 로그인 |
| `npm run check -- drafts/<초안>.json` | 초안 공식 점검 (키워드·분량·가독성·협찬) |
| `npm run draft:dry -- drafts/<초안>.json` | 저장 없이 에디터 입력만 테스트 |

## 자주 막히는 지점

- **"이 시스템에서 스크립트를 실행할 수 없으므로…"** → PowerShell에 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 입력 후 `Y`
- **"claude 용어가 인식되지 않습니다"** → 터미널을 닫았다가 다시 열기
- **"'&&' 토큰은 올바른 문 구분 기호가 아닙니다"** → 명령을 한 줄씩 따로 실행
- **로그인이 풀렸을 때** → `/setup-login`
- **그 외 모든 오류** → 오류 메시지를 그대로 Claude Code 채팅에 붙여넣기

## 주의

- `naver-profile/` 폴더는 로그인 세션 그 자체예요. 절대 공유·업로드하지 마세요 (git에서도 제외됨).
- 학생 얼굴·이름은 동의 여부와 관계없이 모자이크가 기본이에요 (`scripts/mosaic.js`, 원본은 그대로 두고 처리본을 따로 만듦).
- 상위노출·섭외를 보장하는 도구가 아니라 꾸준한 발행을 돕는 도구예요. 발행 전 최종 확인과 글에 대한 책임은 작성자에게 있어요.
