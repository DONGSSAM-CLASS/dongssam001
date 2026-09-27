---
description: 글 1개를 지금 바로 — 주제·메모를 주면 post-writer → (YMYL) fact-checker → quality-reviewer → 빌드까지
argument-hint: <주제 · 메모>  예) 연말정산 미리보기, 작년에 직접 해 봄, 협찬 아님
---

# /write — 단건 작성

입력: $ARGUMENTS

1. 메모에서 협찬 여부·직접 경험 여부를 확인한다. 모르면 묻는다 (대화형일 때). 경험이 있다고 하면 `data/experience-bank.md` 에 한 줄 추가(사용자 확인 후).
2. 대기열 항목을 만든다: `node scripts/queue.js add '{…}'` → 오늘 날짜로 `node scripts/queue.js pick 1` 대신, 방금 추가한 id 를 `node scripts/queue.js set <id> writing` 하고 파일 번호는 오늘 폴더의 다음 번호.
   - 오늘 이미 dailyQuota 개면 멈추고 알린다 (내일 날짜로 쓸지 묻기).
3. `/daily` 2~5단계와 같은 방식으로 이 글 1개만: post-writer → (ymyl) fact-checker → quality-reviewer(미달 시 2회까지 수정) → `node scripts/build.js <파일>`.
4. 보고: 미리보기 경로, 검수 점수, 반드시 고칠 점 반영 내역, 게이트 경고, 필요한 캡처. "승인하시면 `/upload <날짜> <번호> --schedule`" 안내.
