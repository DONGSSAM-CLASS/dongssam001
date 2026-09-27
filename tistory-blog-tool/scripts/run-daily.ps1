# 매일 자동 실행 (Windows 작업 스케줄러용) — README "매일 자동으로 돌리기" 참고
# 하는 일: claude -p "/daily" 로 오늘 글 작성·검수·빌드 (pipelineMode 가 private-auto 면 비공개 저장까지)
# 공개 발행은 하지 않는다 — 아침에 대시보드를 보고 승인 → /upload
$ErrorActionPreference = "Continue"
Set-Location (Join-Path $PSScriptRoot "..")
$date = Get-Date -Format "yyyy-MM-dd"
New-Item -ItemType Directory -Force -Path "out\logs" | Out-Null
$log = "out\logs\daily-$date.log"
"=== $(Get-Date) /daily $date 시작 ===" | Out-File -FilePath $log -Append -Encoding utf8
claude -p "/daily $date" --permission-mode acceptEdits 2>&1 | Out-File -FilePath $log -Append -Encoding utf8
"=== $(Get-Date) 종료 (exit $LASTEXITCODE) ===" | Out-File -FilePath $log -Append -Encoding utf8
