---
description: 원고를 quality-reviewer 로 독립 재검수하고, 사용자 피드백을 반영해 고친다
argument-hint: <posts/날짜/NN-slug.md | 날짜> [사용자 피드백]
---

# /review — 검수·수정

입력: $ARGUMENTS

1. 사용자 피드백이 있으면 먼저 원고에 반영한다. 말투·구성 피드백은 `data/blog-profile.md` "교정 피드백"에 한 줄 기록 (반복되면 `data/writing-playbook.md` 규칙으로 승격 제안).
2. `node scripts/check.js <대상>` → 오류 0개까지.
3. 대상 글마다 **quality-reviewer** 를 부른다 (네가 직접 채점하지 않는다). 미달이면 고치고 재검수 (최대 2회).
4. 원고가 바뀌었으면 `approved` 를 false 로 되돌린다 (`node scripts/meta.js <파일> approved=false`) — 승인은 바뀐 내용을 본 뒤 다시.
5. `node scripts/build.js <대상>` → 점수·변경 내역·미리보기 경로 보고.
