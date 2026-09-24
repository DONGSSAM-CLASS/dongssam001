# dongssam001
2026-1학기 중학교 2학년 세계사 미션 게임

## SUPERSTAR KART — 역사 속 영웅들의 3D 카트 레이싱

세종대왕·이순신·신사임당·유관순·김유신·클레오파트라·나폴레옹·징기스칸·다 빈치·잔 다르크가
선셋 비치 서킷과 경복궁 서킷에서 겨루는 8인 3D 카트 레이싱 게임입니다.

- **실행**: `superstar-kart.html`을 브라우저로 여세요 (인터넷 연결 필요, Three.js CDN 사용).
- **조작**: ←→ 조향 · ↓ 브레이크 · Shift 드리프트 · Space 아이템 · E 필살기 · P 일시정지 / 모바일은 조이스틱 + 버튼
- **테스트**: `cd tests && npm install && npx playwright install chromium && node e2e.mjs desktop`

### 폴더 구조

| 경로 | 내용 |
|---|---|
| `superstar-kart.html` | 게임 본체 (현재 버전) |
| `AGENTS.md` | Codex 등 코딩 에이전트용 작업 규칙 |
| `docs/SPEC_ORIGINAL.md` | 원본 게임 요구사항 |
| `docs/CODE_MAP.md` | 코드 구조와 에셋 교체 지점 |
| `docs/CODEX_PROMPT_REALISTIC_ASSETS.md` | 실사풍 에셋 교체 작업 지시서 (Codex에 붙여넣기) |
| `docs/GPT_IMAGE_PROMPTS.md` | GPT Image 프롬프트 93개 (캐릭터·카트·텍스처·UI) |
| `assets/prompts.json` | 위 프롬프트의 기계용 목록 (파일 경로·크기·배경 포함) |
| `tools/generate-images.mjs` | prompts.json을 읽어 이미지를 일괄 생성하는 스크립트 |
| `tests/` | 헤드리스 브라우저 E2E 테스트, 문법 검사 |
| `archive/superstar-kart-v1.html` | 초기 버전 (참고용) |
| `screenshots/` | 현재 버전 화면 |
