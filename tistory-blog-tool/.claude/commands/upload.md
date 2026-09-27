---
description: 사용자가 승인한 글을 티스토리에 올린다 — 기본 비공개 저장, --schedule 예약 발행, --dry-run 점검
argument-hint: <날짜> [번호,번호] [--schedule | --public] [--dry-run]  예) 2026-09-28 1,2,4 --schedule
---

# /upload — 티스토리 업로드

입력: $ARGUMENTS

1. **승인 확인**: 이 명령을 부른 사용자의 메시지에 번호가 명시돼 있어야 승인으로 본다 ("다 올려"는 → 번호를 되읽어 주고 확인받기).
   `--schedule`/`--public` 이면 승인된 글만 `node scripts/meta.js <파일> approved=true status=approved`.
   승인 전에 원고가 바뀌었으면(검수 이후 수정) 다시 보여 주고 확인받는다.
2. 사전 점검: `node scripts/check.js <날짜>` 오류 0개, 대상 글 review.score ≥ minReviewScore. `node scripts/build.js <날짜>` (썸네일이 있어야 대표 이미지가 붙는다).
3. 첫 실행이거나 CLAUDE.md 7장 "실측 전" 항목을 건드리는 모드(`--schedule`)를 처음 쓰면 먼저:
   `node scripts/tistory_upload.js <날짜> --only <번호> --dry-run [--schedule]` → `out/<날짜>/*.upload.png` 스크린샷을 Read 로 확인.
4. 본 실행: `node scripts/tistory_upload.js <날짜> --only <번호들> [--schedule|--public]`
5. 결과 읽기:
   - "⛔" = 게이트에서 거부 (사유 보고), "❌" = 브라우저 단계 실패 → `*.upload-fail.png` 확인 → 셀렉터 문제면 `npm run probe` 로 실측 후 `scripts/lib/tistory.js` 수정 → `npm test` → CLAUDE.md 실측 기록.
   - "❗저장 확인 필요" → 성공 보고 금지, 사용자에게 티스토리 글 관리에서 확인 요청.
   - 로그인 오류 → `npm run login` 안내.
6. 보고: 올린 글·URL·예약 시각, 실패·보류 글, 사용자 확인 사항(비공개 글은 티스토리 관리 > 글 관리에서 공개 전환).
   예약이 여러 날에 걸치면 다음 날 한도 계산에 영향을 준다는 점도 알린다.
