---
description: 오래된 글·시즌 글을 최신 공식 정보로 갱신할 후보를 찾고, 갱신 원고를 만든다 (새 글보다 효율 좋을 때가 많음)
argument-hint: (선택) 개수 또는 글 slug/URL
---

# /refresh — 기존 글 갱신

입력: $ARGUMENTS

1. 후보 찾기: `posts/**` 에서 `basisDate` 가 6개월 이상 지난 YMYL 글, 다가오는 시즌(`data/season-calendar.md`)의 작년 글, `data/existing-posts.json` 중 같은 키워드의 옛 글.
2. 후보 표(글·기준일·바뀌었을 가능성 있는 항목·시즌)를 보여 주고 고르게 한다 (헤드리스면 우선순위 1개만).
3. 갱신 원고는 **새 파일**로 만든다: `posts/<오늘>/NN-<같은 slug>-update.md`, front matter `refreshOf: <원래 slug 또는 URL>` — 유사도·키워드 중복 검사가 원글을 예외로 처리한다.
   - 바뀐 공식 정보는 fact-checker 로 재검증, basisDate 갱신, 본문에 "2026년 ○월 ○일 기준으로 내용을 업데이트했어요" 한 줄.
4. quality-reviewer → build. 업로드는 새 글이 아니라 **기존 글 수정**이므로 자동 업로드하지 않는다: 미리보기와 `out/<날짜>/*.tistory.html` 을 주고 "티스토리에서 원래 글 수정 → HTML 모드에 붙여넣기" 안내. (같은 주제의 새 글을 올리면 키워드 잠식이 생긴다.)
