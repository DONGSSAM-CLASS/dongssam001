---
description: 오늘의 글(최대 dailyQuota, 기본 5개)을 주제 선택 → 병렬 작성 → 사실 검증 → 독립 검수 → 빌드 → 보고까지 한 번에
argument-hint: (선택) 날짜 YYYY-MM-DD · 개수  예) 2026-09-28 3
---

# /daily — 하루치 글 파이프라인

인자: $ARGUMENTS (날짜가 없으면 오늘, 개수가 없으면 `config/blog.json` dailyQuota)

CLAUDE.md 의 대원칙을 기억하라: **5개는 상한이다. 게이트·검수를 통과한 글만 남긴다.**
헤드리스 실행(`claude -p`)일 수 있다 — 사용자에게 질문하지 말고, 확인이 필요한 글은 `held` 로 두고 보고서에 사유를 적는다.

## 0. 사전 점검
- `config/blog.json` 에 ❓ 가 남아 있으면(blogUrl·categories·niche) → 작성은 계속하되 보고서 맨 위에 "/setup-blog 필요"를 적는다. categories 가 ❓ 면 글의 category 는 blog-profile 후보 중 하나로 두고 held 처리.
- `node scripts/queue.js stats` — 대기열이 부족하면(오늘 개수 미만) `/plan` 절차(.claude/commands/plan.md)로 먼저 보충한다.
- 같은 날짜 폴더에 이미 글이 있으면 이어서 한다 (재실행 안전): status 가 checked/reviewed 인 글은 건너뛰고 draft·held 만 다시 본다.
  `node scripts/queue.js list --status writing` 에서 date 가 오늘인데 파일(post)이 없는 항목은 지난 실행이 끊긴 것 — 새로 뽑지 말고 그 항목부터 이어서 쓴다.

## 1. 주제 선택
`node scripts/queue.js pick <개수> --date <날짜>` → 선택된 항목과 fileHint(번호) 확인.
shortBy > 0 이면 억지로 채우지 않는다 (다양성 조건 때문에 모자란 것 — 보고서에 기록).

## 2. 병렬 작성
선택된 항목마다 **post-writer** 에이전트를 **한 메시지에서 동시에** 부른다. 프롬프트에 항목 JSON, 파일 경로 힌트, 날짜를 넣는다.
각 에이전트 보고를 모은다. 보류(held)된 글은 사유를 기록.

## 3. 사실 검증 (YMYL 글만)
`ymyl: true` 이고 status 가 held 가 아닌 글마다 **fact-checker** 에이전트를 동시에 부른다.
결과 후 `node scripts/check.js <파일>` — 사실 관련 오류가 남으면 그 글은 held (`node scripts/meta.js <파일> status=held "review.notes=사실 확인 불가: …"`).

## 4. 독립 검수
남은 글마다 **quality-reviewer** 에이전트를 동시에 부른다.
- 점수 ≥ minReviewScore → 통과.
- 미달 → "반드시 고칠 점"을 반영해 **네가 직접(또는 post-writer 에게 수정 지시)** 고치고 → check → quality-reviewer 재검수. **최대 2회.** 그래도 미달이면 held.
- 검수자와 작성자는 항상 다른 에이전트 호출이어야 한다 (자기 글 채점 금지).

## 5. 묶음 점검·빌드
- `node scripts/check.js <날짜>` — 묶음 오류(하루 한도·같은 키워드)가 있으면 해결 (점수 낮은 글을 held).
- `node scripts/build.js <날짜>` — HTML·미리보기·썸네일·대시보드(`out/<날짜>/index.html`).

## 6. 보고서 `out/<날짜>/report.md` + 채팅 요약
| # | 제목 | 키워드 | 형식 | 검수 점수 | 게이트 경고 | 상태 |
- 보류 글과 사유, 사용자가 줄 것(캡처·경험·공고 원문)
- 추가하면 좋은 캡처 목록 (글별)
- 대기열 잔량 (`queue.js stats`)
- 다음 할 일:
  - `pipelineMode: review-first` → "미리보기(out/<날짜>/index.html)를 보고 승인할 번호를 알려 주세요 → `/upload <날짜> 1,2,4 --schedule`"
  - `pipelineMode: private-auto` → 7단계 진행

## 7. (pipelineMode 가 private-auto 일 때만) 비공개 자동 업로드
- `.auth/tistory-profile` 이 없으면 건너뛰고 "npm run login 필요"를 보고.
- `node scripts/tistory_upload.js <날짜>` (기본 = 비공개 저장, 통과 글만). 결과의 ❗ 항목을 보고서에 추가.
- 안내: "티스토리 앱/관리 > 글 관리에서 비공개 글을 읽어 보고 공개로 바꾸거나, 승인할 번호를 알려 주시면 예약 발행으로 바꿔 드려요(`/upload`)."

## 금지
- 게이트 오류가 있는 글을 통과 처리, 검수 점수 조작, 사용자 승인 없이 approved: true, 공개·예약 업로드.
- 오늘 개수를 채우려고 같은 주제를 지역명·숫자만 바꿔 쓰기.
