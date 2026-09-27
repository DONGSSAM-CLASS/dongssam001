---
description: 처음 한 번 — 티스토리 블로그 주소·주제·카테고리·화자·운영 방식을 인터뷰해서 config/blog.json 과 data/blog-profile.md 를 채운다
argument-hint: (선택) 블로그 주소  예) https://dongssam.tistory.com
---

# /setup-blog — 블로그 설정 인터뷰

입력: $ARGUMENTS

1. `config/blog.json`, `data/blog-profile.md`, `data/experience-bank.md` 를 읽고 ❓ 항목을 모은다.
2. **한 번에 모아서** 묻는다 (선택지를 제시하고 추천을 붙인다):
   - 블로그 주소, 블로그 이름
   - 주제(니치) — 후보: 생활 돈 정보(단가 높음·YMYL 검증 부담 큼) / 그 외 사용자가 잘 아는 분야. 사용자가 **직접 경험할 수 있는 분야**일수록 좋다고 설명.
   - 티스토리에 **실제로 만든** 카테고리 이름 (없으면 3~6개 추천 → 사용자가 티스토리 관리 > 카테고리에서 만들게 안내)
   - 필명·공개할 신분(사실만)·글쓴이 한 줄 소개, 말투
   - 이 주제의 실제 경험 3~5개 (experience-bank 에 넣을 것)
   - 블로그 현재 상태: 개설 시기·글 수·애드센스 승인 여부·최근 한 달 발행 수 → 하루 한도 권장값 결정 (README "처음 한 달" 기준)
   - 운영 방식: `review-first`(추천: 승인 후 예약 발행) / `private-auto`(비공개 저장까지 자동)
   - AI 사용 고지 문구를 넣을지 (선택)
   - (현직 교원이면) 겸직허가 확인 여부
3. 답을 받으면: `config/blog.json`(blogUrl·blogName·niche·categories·dailyQuota·pipelineMode·author·aiDisclosure), `data/blog-profile.md`, `data/experience-bank.md` 갱신. 주제가 생활 돈 정보가 아니면 `data/season-calendar.md` 를 그 분야 시즌으로 바꾼다.
4. `npm run sync` 로 기존 글 목록을 받는다 (실패하면 이유 보고 — 클라우드 세션은 외부 접속이 막힐 수 있음).
5. 다음 단계 안내: `npm run login` → 첫 실행 체크리스트(CLAUDE.md 7장) → `/plan`.
