---
description: YMYL 글의 숫자·날짜·자격을 공식 출처와 다시 대조 (fact-checker 호출)
argument-hint: <posts/날짜/NN-slug.md | 날짜>
---

# /verify — 사실 검증

대상: $ARGUMENTS (날짜면 그날 ymyl: true 인 글 전부)

1. 대상 글마다 **fact-checker** 에이전트를 동시에 부른다.
2. 각 글 `node scripts/check.js <파일>` 로 사실 관련 오류 0개 확인. 남으면 사용자에게 필요한 조치(공고 원문 캡처·붙여넣기)를 구체적으로 요청.
   - 사용자가 원문을 붙여넣거나 캡처를 주면 그것을 1차 출처로 대조하고 evidence 에 "사용자 제공 원문: (기관·페이지·게시일)"을 적는다.
3. `node scripts/build.js <대상>` 으로 미리보기 갱신 → 검증 표 보고.
