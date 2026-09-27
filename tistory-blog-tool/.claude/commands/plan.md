---
description: 주제 대기열 채우기 — 시즌·클러스터·기존 글을 보고 2주치(기본 dailyQuota×14) 주제를 설계해 data/topic-queue.json 에 추가
argument-hint: (선택) 개수·분야·기간  예) 30 연말정산 11월
---

# /plan — 주제 대기열 설계

요청: $ARGUMENTS

1. 읽기: `config/blog.json`(niche·categories·dailyQuota), `data/blog-profile.md`, `data/season-calendar.md`, `data/experience-bank.md`, `data/existing-posts.json`, `data/topic-queue.json`, `posts/**` 의 mainKeyword. 오늘 날짜 확인.
2. **클러스터 설계** — 주제를 3~6개 클러스터(= 카테고리와 대응)로 묶는다. 클러스터마다:
   - 기둥 글(pillar) 1개: 넓은 키워드, 종합 가이드
   - 지원 글 5~15개: 롱테일 질문·세부 상황 (예: "○○ 기한 후 신청", "○○ 지급일 조회", "○○ 소득 기준 계산")
   - 지원 글이 기둥 글로, 기둥 글이 지원 글로 서로 링크되게 계획
3. **키워드 조사** — WebSearch 로 후보 키워드의 연관 질문·자동완성류를 살핀다. 검색량 수치는 추정하지 말고, 사용자가 확인할 수 있게 README 의 도구(구글 키워드 플래너·트렌드, 네이버 데이터랩)를 안내한다.
4. **걸러내기** — 다음은 넣지 않는다:
   - 이미 쓴 메인 키워드 / 기존 글과 같은 의도 (→ 대신 `/refresh` 후보로 메모)
   - 지역명·숫자만 바꾼 변형 (도어웨이)
   - 사용자가 경험도, 공식 출처도 없는 주제
   - 애드센스 게재 불가·민감 주제
5. **우선순위(1~5)** = 시즌 선점(발행 2~4주 전) + 광고 단가(금융·세금·정부지원 > 일반 생활) + 경험 가능 여부 + 경쟁 강도(구체적인 롱테일일수록 유리). window 에 발행 적기를 넣는다.
6. 추가: `node scripts/queue.js add '<JSON 배열>'` — 항목마다 mainKeyword, angle(검색 의도·차별점 한 줄), cluster, category, format(하루 안 다양성을 위해 섞기), ymyl, sourceHint(1차 출처 기관·URL), experienceHint, priority, window.
7. 보고: 클러스터 지도(기둥/지원), 추가한 개수, 우선순위 상위 10개, 사용자에게 확인받으면 좋을 것(경험 여부, 올해 운영 여부 불확실한 제도).
