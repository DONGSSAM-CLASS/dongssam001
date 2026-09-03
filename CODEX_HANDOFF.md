# 인수인계 (Codex 등 다른 도구에서 이어서 작업할 때)

**History Globe** — 3D 지구본 기반 세계사 동시대 탐색 웹앱. 2022 개정 교육과정 중학교 「역사」(①·②), 고등학교 「세계사」, 「동아시아 역사 기행」 수업용 교실 보조 도구입니다.

## 1. 지금 상태 (8단계 전부 완료)

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 1 | 프로젝트 초기화 · Firebase(Auth/Firestore/Hosting) · Firestore 설계 · Security Rules + 테스트 | ✅ |
| 2 | 3D 지구본 · 연대 슬라이더 | ✅ |
| 3 | 역사 데이터 전체 입력 · 검색 · 레이어 | ✅ |
| 4 | 학생 가입(학급코드) · 마킹 · 거리 · 루트 | ✅ |
| 5 | 교사 가입 · 학급 관리 · 수업 설계 · 성취기준 연동 | ✅ |
| 6 | 활동지 생성기 · PDF/HTML 다운로드 | ✅ |
| 7 | 실시간 모니터링 · 따라오기 · 미션 배포/제출 | ✅ |
| 8 | 데이터 검수 화면 · 교사 콘텐츠 관리 · 접근성/성능 · 배포 문서 | ✅ |

검증 상태: 타입 검사·ESLint 통과, 단위 테스트 36건, Security Rules 테스트 37건, axe-core 접근성 위반 0건, 브라우저 E2E(학생 흐름·교사 흐름·모니터링·활동지) 통과.

## 2. 먼저 읽을 문서

| 파일 | 내용 |
| --- | --- |
| `README.md` | 설치 · Firebase 프로젝트 생성 · 에뮬레이터 · 배포 · 무료 할당량 · 폴더 구조 · 성능/접근성 측정 결과 |
| `docs/FIRESTORE_SCHEMA.md` | 컬렉션 설계, 쓰기 순서 제약, 학생 계정 흐름 |
| `docs/DECISIONS.md` | 단계별 판단 근거(왜 이렇게 했는지). **수정 전에 꼭 확인** |
| `DATA_NOTES.md` | 역사 데이터 출처 · 연대 기준 선택 · 한계 · TODO |
| `TEACHER_GUIDE.md` | 교사용 사용 설명서(스크린샷 자리 포함) |

## 3. 실행 방법

```bash
npm install
cp .env.example .env          # VITE_USE_EMULATORS=true 면 로컬 에뮬레이터 사용

# 터미널 1
npm run emulators             # Auth 9099 / Firestore 8080 / UI 4000
# 터미널 2
npm run seed                  # 데모 교사 teacher@example.com / password123, 학급코드 DEMO24, 열린 세션 1개
npm run dev                   # http://localhost:5173
```

검사:

```bash
npm run typecheck && npm run lint
npm test              # 단위 테스트 36건
npm run test:rules    # Security Rules 37건 (에뮬레이터 자동 기동)
npm run data:validate # 역사 데이터 스키마·참조·대륙×시대 분포
npm run build
```

## 4. 구조 요약

```
src/
  data/         역사 기본 데이터(정적 JSON) — Firestore 에 넣지 않음(읽기 할당량 0)
  lib/          firebase · authService · workService · classService · sessionService
                standards(성취기준) · worksheet(+HTML) · monitor(CSV) · mergedData(교사 수정본 병합)
                history(연대·거리) · geo(좌표 변환) · overlayCanvas(해상도)
  components/
    globe/      GlobeCanvas(r3f) · GlobeOverlays(모든 레이어를 캔버스 1장에) · Markers · UserOverlay · ClassOverlay
    panels/     DetailPanel · ComparePanel · LayerPanel · SearchBox · ListView · StudentToolsPanel
                MonitorPanel · MissionPanel · MissionComposer
    timeline/   Timeline(연대 슬라이더)
  pages/        LandingPage · GlobePage · student/* · teacher/* · admin/DataReviewPage
  store/        globeStore · authStore · workStore · monitorStore · overridesStore (Zustand)
scripts/
  data-src/     역사 데이터 원본(.py 조각) + merge.py → src/data/*.json 생성
  validate-data.ts, seed-emulator.ts, build-geo.mjs
tests/rules/    Security Rules 테스트 37건
```

## 5. 반드시 지켜야 할 규칙 (깨기 쉬운 것들)

1. **Spark(무료) 요금제 범위 유지** — Cloud Functions · Cloud Storage · 서버 로직 금지. 필요한 일은 전부 클라이언트에서 처리합니다.
2. **역사 기본 데이터는 Firestore 에 넣지 않습니다.** `src/data/*.json`(번들)에서 읽고, 교사 수정본만 `teacher_overrides` 로 덮어씁니다.
3. **성취기준 65개 원문은 수정 금지.** `src/data/achievement_standards.json` 의 `code·subject·school_level·unit·text` 는 교육부 고시 원문 그대로입니다. 채울 수 있는 필드는 `suggested_year_range`·`related_polities`·`related_figures` 뿐이며 매핑은 `scripts/data-src/standards_map.py` 에 있습니다.
4. **역사 데이터는 조각 파일에서 고칩니다.** `src/data/*.json` 을 직접 고치지 말고 `scripts/data-src/*.py` 수정 → `python3 scripts/data-src/merge.py` → `npm run data:validate`.
5. **Security Rules 는 필터가 아닙니다.** 규칙이 `resource.data.X == …` 를 요구하면 쿼리에도 같은 `where` 를 넣어야 합니다(예: 학생의 미션 구독은 `published == true` 필수).
6. **쓰기 순서 제약**: 규칙의 `ownsClass()` 는 `get()` 을 쓰므로 같은 배치에서 만든 학급을 보지 못합니다. 학급 생성과 세션 생성은 **커밋을 나눠야** 합니다.
7. **학생 가상 이메일은 소문자**: Firebase Auth 가 이메일을 소문자로 정규화하므로 `{학급접두어 소문자}-{번호}[-{세대}]@student.local` 형식이고, 규칙은 `authPrefix.lower()` 로 비교합니다.
8. **지구본은 요구 기반 렌더링**(`frameloop="demand"`). 매 프레임 렌더링으로 되돌리면 같은 페이지의 Firestore 통신이 굶어 죽습니다(실측: 쓰기 9초 타임아웃). 장면에 영향을 주는 상태를 추가하면 `GlobeCanvas.tsx` 의 `SceneInvalidator` 의존성 배열에도 넣어 주세요.
9. **에뮬레이터 실행 중 `firestore.rules` 를 편집하면 Firebase CLI 가 종료됩니다.** 규칙을 고쳤으면 에뮬레이터를 다시 시작하세요.
10. **React Compiler 린트**: 효과 안에서 동기 `setState` 금지, 렌더 중 `Date.now()`·`Math.random()` 금지. 기존 코드의 "렌더 중 파생 상태 갱신"·"reloadToken" 패턴을 따라 주세요.

## 6. 남은 일 (우선순위 순)

1. **역사 데이터 보강** — `DATA_NOTES.md` 의 TODO. 특히 인물 `polity_id` 미연결 7건(석가모니·무함마드·이븐 바투타·레오나르도·칼뱅·갈릴레이·아웅 산), 주요 정치체 폴리곤(현재 대부분 반경 원), 류큐·조선 통신사 경로 등 동아시아 교류 자료.
2. **성취기준 매핑 검토** — `standards_map.py` 의 연대 범위·관련 항목을 교과서 단원과 대조.
3. **실제 Firebase 프로젝트 연결·배포** — `.env` 채우고 `README.md` 의 배포 체크리스트 수행. 최초 관리자(`admins/{uid}`)는 콘솔에서 수동 생성.
4. **교사용 스크린샷** — `TEACHER_GUIDE.md` 의 `[스크린샷: …]` 자리 채우기.
5. **선택 개선** — 활동지 문항 유형별 상세 편집 UI(현재는 지시문 편집), 교사 간 자료 공유(현재 학급 전용), 미션 요구 조건 자동 채점 확장(현재 핀/루트 개수만).

## 7. 알려진 제약

- 이 저장소의 성능 수치는 GPU 없는 컨테이너(소프트웨어 렌더링) 기준이라 실제 크롬북보다 불리합니다. 드래그 중 10 FPS, 연대 변경 0.9초.
- 학생 계정 완전 삭제·서버측 비밀번호 재설정은 Admin SDK(유료)가 필요해 각각 "비활성화", "세대 기반 재가입"으로 대체했습니다.
- 오프라인 활동지 HTML 의 학생 입력은 그 브라우저(localStorage)에만 저장됩니다.

---

원격 저장소: `https://github.com/DONGSSAM-CLASS/dongssam001` (브랜치 `main`)
