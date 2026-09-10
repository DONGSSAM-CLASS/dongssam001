# Codex 이어서 작업 프롬프트 — 『아직 오지 않은 광복』

아래 블록을 그대로 Codex에 붙여넣으면 됩니다. (이 저장소의 압축본을 함께 전달받았다는 전제)

---

당신은 이 저장소(`dongssam001`, React 19 + TypeScript + Vite 7 + Firebase + Tailwind4 + DaisyUI)를 이어서 개발하는 시니어 프론트엔드 개발자입니다. 한국광복군 창설 기념 **웹 역사 추리 게임 『아직 오지 않은 광복』: 1940년 9월, 그들이 걸었던 선택**을 만들고 있습니다. 아래 내용을 지키며 "이어서 할 일"을 완성하세요.

## 0. 먼저 할 것
1. 의존성 설치: `npm install`
2. 상태 확인: `npm run typecheck` / `npm test` (44개 통과해야 정상) / `npm run build`
3. 게임을 눈으로 확인하려면 임시로 `src/App.tsx`에 `<Route path="/game/__demo" element={<GamePlayPage mode="preview" />} />`를 추가해 `/game/__demo`로 접속(계정 없이 미리보기), 확인 후 반드시 제거.

## 1. 프로젝트 개요 / 현재 상태(이미 구현됨)
- 이 저장소에는 기존 React 앱 "History Globe"가 있고, 그 **Firebase 계정·학급·교사 대시보드 인프라를 재사용**해 게임을 얹었습니다.
- 게임 코드: `src/game/**`, `src/pages/game/**`, `src/lib/gameService.ts`.
- 라우트(`src/App.tsx`): `/game`(학생 인트로·난이도 선택·이어하기), `/game/play`(학생 플레이·저장), `/game/preview`(교사 미리보기·저장 안 함).
- 콘텐츠: `src/game/story.ts` — 1940~1945 **시대순 7개 챕터**. 각 챕터에 실제 **사료 원문(발췌)+중/고 수준별 해석본+APA 출처(note)**, 인물 대사, 추리 미션(객관식/복수정답), 해설, 배지, 2022 개정 교육과정 연계.
- 인물 사전 `src/game/figures.ts`(교과서 안/밖), 핵심 용어 `src/game/glossary.ts`.
- 난이도: `level: 'middle' | 'high'` — 내용 동일, 해석·설명 깊이만 차별화.
- UI: DaisyUI **커스텀 앤틱·다크 테마 `gwangbok`**(게임 화면 래퍼에만 `data-theme="gwangbok"`로 격리), Lucide 아이콘, **Pretendard**(`public/vendor/PretendardVariable.woff2`). 우상단 **미션 상태창**(`MissionStatusPanel`), 시대순 잠금 진행, 브리핑→추리→해설 흐름, 완료 화면 + **서술형 소감**.
- 저장: Firestore `game_progress` 컬렉션(문서 1인 1개 `${classId}_${number}`), 학생 본인 쓰기·담당 교사 읽기. 규칙은 `firestore.rules`, 인덱스는 `firestore.indexes.json`, 타입은 `src/types/firestore.ts`(`GameProgressDoc`).
- 교사: 학급 상세(`src/pages/teacher/ClassDetailPage.tsx`)에 `GameProgressPanel`(실시간 진행·미션별 정오·시도·소감 펼치기·CSV 내려받기) + 미리보기 링크.
- 이미지: `SceneView`가 `public/game/scenes/<sceneKey>.jpg`가 있으면 실사 이미지를, 없으면 `CinematicScene`(SVG)로 자동 폴백. 준비된 씬 키는 `src/game/scenes/available.json`에 기록. 생성 스크립트 `scripts/generate-scene-images.mjs`(GPT Image).
- 제작자 크레딧 '동쌤(김동은 선생님)'을 인트로/랜딩 하단에 표기.

## 2. 반드시 지킬 규칙(컨벤션)
- 개발·푸시 브랜치: **`main`**. 커밋 메시지는 명확한 한국어. (원 저장소 기여자 규칙을 따르되, 별도 지시 없으면 PR 자동 생성 금지)
- **Firestore 규칙 원칙 유지**: 학생은 자기 문서만 쓰고, 담당 교사만 읽음. 새 컬렉션 추가 시 catch-all `deny` 앞에 규칙을 넣고, `firestore.indexes.json`도 갱신.
- **개인정보 미수집** 유지: 학생은 학급코드+번호+PIN(가상 이메일). 이름/연락처 등 수집 금지.
- **폰트 글리프 주의**: 원문자 ①②③ 등은 Pretendard에서 깨질 수 있어 사용 금지 → `(1)(2)` 형태로.
- DaisyUI 테마는 게임 화면에만 `data-theme="gwangbok"`로 적용(기존 Globe 앱 디자인 건드리지 말 것).
- 접근성: 키보드 포커스, `prefers-reduced-motion` 존중, `word-break: keep-all`.
- 변경 후 반드시 `npm run typecheck`, `npm test`, `npm run lint`(신규/수정 파일 기준 무오류), `npm run build` 통과. (참고: 별개 하위 프로젝트 `hansa-suneung`에는 기존 lint 오류가 있으니 그것 때문에 막히지 말 것.)
- 사료 인용은 **사실 기반** 유지. 원문 발췌·회고록은 판본 확인 안내(`note`)를 함께 둘 것. 새 사료 추가 시 반드시 APA 출처와 검증 note 포함.

## 3. 이어서 할 일 (우선순위 순)
### (A) 시네마틱 실사 이미지 완성 — 최우선
- `OPENAI_API_KEY`를 환경에 두고 `npm run images:generate` 실행 → 7개 장면(`chongqing-night, ceremony, recruit, declaration, burma, oss-xian, liberation-dawn`)을 `public/game/scenes/*.jpg`로 생성, `src/game/scenes/available.json` 자동 갱신.
- 프롬프트는 `scripts/generate-scene-images.mjs`의 `PROMPTS`에 있음(역사 기반·블록버스터 시네마틱·인물 실명/얼굴 재현 금지·군중/실루엣 위주). 결과가 밋밋하면 프롬프트를 더 영화적으로 다듬어 재생성.
- 생성 후 헤더 비율(16:7, 16:6)과 텍스트 가독성(하단 그라디언트 위 글자) 확인, `npm run build`.

### (B) Firebase 실제 배포 검증
- `.env`에 실제 Firebase 웹 설정 입력(`.env.example` 참고, `VITE_USE_EMULATORS=false`), 콘솔에서 **이메일/비밀번호 로그인 활성화**, `.firebaserc` 프로젝트 지정.
- `npm run build && firebase deploy --only firestore:rules,firestore:indexes && firebase deploy --only hosting`.
- 배포본에서 교사 가입→학급 개설→학생 가입→게임 진행→교사 대시보드 반영까지 실제 확인. CSP(`firebase.json`) 때문에 막히는 요청이 있으면 필요한 도메인만 최소 추가.

### (C) 사료 원문 최종 검증
- `src/game/story.ts`의 각 `original`을 국사편찬위원회 「대한민국 임시정부 자료집」·국가보훈부 원문과 대조해 표기 확정(특히 「한국광복군 선언문」·「대일 선전 성명서」·『백범일지』). 회고록 인용은 판본 확인.

### (D) 심화/확장(선택)
- 챕터별 보조 사료·추가 문항, 오답 해설 강화.
- 교사 대시보드: 반 전체 정답률·문항별 오답 분포 그래프(dataviz).
- 접근성 보강(키보드 내비게이션, 스크린리더 라벨), 저사양 크롬북 성능 점검.
- 콘텐츠 무결성 테스트(`src/game/story.test.ts`) 확장.

## 4. 참고 문서
- `docs/GAME_아직오지않은광복.md` (요구사항 대응표·콘텐츠 구조·배포·이미지 생성)
- `README.md`, `.env.example`, `firestore.rules`, `firebase.json`

작업을 시작하기 전에 위 "0. 먼저 할 것"으로 현재 상태를 재현·확인한 뒤, (A)→(B)→(C) 순으로 진행하세요. 각 단계마다 빌드·테스트를 통과시키고, 변경 사항을 `main`에 명확한 한국어 커밋으로 기록하세요.
