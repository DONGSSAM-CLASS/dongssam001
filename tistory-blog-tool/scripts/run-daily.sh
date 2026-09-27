#!/usr/bin/env bash
# 매일 자동 실행 (macOS/Linux cron 용) — 예: 30 5 * * * /path/to/tistory-blog-tool/scripts/run-daily.sh
# 하는 일: claude -p "/daily" 로 오늘 글 작성·검수·빌드. 공개 발행은 하지 않는다.
cd "$(dirname "$0")/.." || exit 1
DATE=$(date +%F)
mkdir -p out/logs
LOG="out/logs/daily-$DATE.log"
echo "=== $(date) /daily $DATE 시작 ===" >> "$LOG"
claude -p "/daily $DATE" --permission-mode acceptEdits >> "$LOG" 2>&1
echo "=== $(date) 종료 (exit $?) ===" >> "$LOG"
