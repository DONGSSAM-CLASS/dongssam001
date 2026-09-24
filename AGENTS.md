# AGENTS.md — SUPERSTAR KART (Codex 작업 안내)

이 저장소는 역사 인물 10명이 달리는 **3D 카트 레이싱 웹 게임**입니다.
중학교 2학년 세계사·한국사 수업용이며, UI와 모든 텍스트는 **한국어**입니다.

## 1. 현재 상태 한눈에

| 항목 | 내용 |
|---|---|
| 메인 파일 | `superstar-kart.html` (HTML/CSS/JS 한 파일, 약 2,500줄) |
| 엔진 | Three.js r160 (ES 모듈, jsDelivr CDN + importmap) |
| 애드온 | EffectComposer, RenderPass, UnrealBloomPass, OutputPass, RoundedBoxGeometry, BufferGeometryUtils |
| 3D 에셋 | **없음.** 캐릭터·카트·건물·텍스처를 전부 코드(프리미티브 + CanvasTexture)로 생성 |
| 오디오 | WebAudio로 합성 (파일 없음) |
| 이전 버전 | `archive/superstar-kart-v1.html` (박스 위주의 초기 버전, 참고용) |
| 원본 요구사항 | `docs/SPEC_ORIGINAL.md` (반드시 지켜야 하는 게임 규칙의 출처) |
| 코드 지도 | `docs/CODE_MAP.md` |
| 다음 작업 | `docs/CODEX_PROMPT_REALISTIC_ASSETS.md` (실사풍 에셋 교체 작업 지시서) |
| 이미지 프롬프트 | `docs/GPT_IMAGE_PROMPTS.md` + `assets/prompts.json` |

## 2. 실행 방법

- 가장 간단한 방법: `superstar-kart.html`을 브라우저로 더블클릭합니다 (인터넷 연결 필요).
- **외부 에셋(PNG/GLB)을 쓰기 시작하면** `file://`에서는 fetch가 막히므로 로컬 서버로 여세요.
  ```bash
  npx http-server . -p 8080 -c-1   # 그다음 http://localhost:8080/superstar-kart.html
  ```

## 3. 테스트 (변경 후 반드시 실행)

```bash
cd tests && npm install         # three@0.160.0, playwright 설치
npx playwright install chromium # 처음 한 번 브라우저 설치
node e2e.mjs desktop            # 1280x760, 선셋 비치
node e2e.mjs mobile             # 412x860, 경복궁
```
- 헤드리스 Chromium이 CDN 요청을 로컬 `node_modules/three`로 돌려서 오프라인으로도 돕니다.
- 통과 기준: 3랩 완주(`lap 4`), 결과 화면 → 다시 달리기 → 일시정지 → 처음으로 동작, `ERRS []`.
- 스크린샷이 `tests/out/`에 저장됩니다. 화면이 바뀌는 작업은 스크린샷을 직접 확인하세요.
- JS 문법 검증: `node tests/check-syntax.mjs`

## 4. 지켜야 할 규칙

1. **게임 규칙은 `docs/SPEC_ORIGINAL.md`가 기준입니다.** 캐릭터 10명, 필살기, 유물 4종, 난이도 3단계, 3랩, HUD 구성, 조작 키를 바꾸지 마세요.
2. **절차적(코드 생성) 모델은 지우지 말고 폴백으로 남기세요.** 외부 에셋 로드에 실패하면 지금의 절차적 모델로 자동 대체돼야 합니다. 에셋이 하나도 없어도 게임이 돌아야 합니다.
3. 좌표계: **+Z가 차량 앞**, +Y가 위, 1 유닛 = 약 1m. 카트 길이 약 3~4유닛, 도로 폭 14유닛.
4. 조향 부호: `heading`이 **줄어들면 오른쪽**으로 돕니다 (`k.heading -= steer * turn * dt`).
5. `disposeTree()`로 제거할 때 공유 리소스는 `userData.shared = true`로 표시해야 이중 해제가 안 됩니다.
6. 정적 월드 메시는 `mergeInPlace()`로 머티리얼별로 합쳐집니다. 움직이는 객체는 `userData.anim = true`, 합치면 안 되는 객체는 `userData.noMerge = true`로 표시하세요.
7. 모바일 성능: `LOWQ` 플래그(터치 기기 또는 짧은 변 600px 미만)일 때 그림자 1024, 픽셀비 1.35, 파티클 수를 줄입니다. 새 기능도 이 플래그를 따르세요.
8. 한국어 문구의 조사는 이름 뒤에 `이(가)`처럼 병기하거나, 조사가 필요 없는 문장으로 쓰세요.
9. 커밋 메시지는 무엇을 왜 바꿨는지 적어 주세요.

## 5. 디버그 훅

페이지의 `window.SK` 객체로 상태에 접근할 수 있습니다.
```js
SK.game            // 현재 레이스 상태 (karts, player, state, raceTime ...)
SK.track           // 트랙 데이터 (pts, sides, curv, limits, pads)
SK.updateGame(dt)  // 한 프레임 진행
SK.startLoading()  // 현재 SK.sel 설정으로 레이스 시작
SK.showResults()   // 결과 화면 강제 표시
SK.renderer.info   // 드로우콜·삼각형·메모리 수치
```
