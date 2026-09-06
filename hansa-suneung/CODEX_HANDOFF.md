# CODEX 인수인계 문서 — 한국사 수능 기출 단원 연동 웹앱

이 문서 하나로 Codex(또는 다른 개발자/AI)가 **끊김없이 이어서 작업**할 수 있도록 현재 상태·구조·원칙·남은 일을 정리한다.

---

## 0. 한 줄 요약

중·고등학생과 교사를 위한 **완전한 정적 웹앱**. 2022 개정 교육과정 한국사 교과서 단원(대단원=교과서 대단원, 소단원=성취기준)을 클릭하면 그 단원에서 출제된 수능 기출 주제 목록을 보여주고, 각 주제는 평가원 공식 PDF의 해당 페이지(`#page=N`)로 연결한다. 1~9단계 전 기능 + 종합 QA 완료. **남은 것은 (a) Firebase Hosting 실제 배포, (b) 실제 수능 문항 데이터 입력.**

## 1. 저장소 위치와 구조 규칙 (중요)

- GitHub: `https://github.com/DONGSSAM-CLASS/dongssam001` · 브랜치 **main** 에 직접 커밋/푸시.
- 이 저장소는 **여러 프로젝트가 공존**한다:
  - 루트(`/`) = **History Globe**(3D 지구본 세계사 앱, 별개 프로젝트) — **절대 건드리지 말 것.**
  - `dokdo-necut/` = 독도네컷(별개 프로젝트).
  - **`hansa-suneung/` = 이 프로젝트.** 모든 작업은 이 하위 폴더 안에서만 한다.
- 커밋할 때 변경이 `hansa-suneung/` 밖으로 새어나가지 않았는지 반드시 확인:
  `git diff --cached --name-only | grep -v '^hansa-suneung/'` (결과가 비어야 정상)
- 커밋 메시지는 한국어로 간결하게.

## 2. 절대 원칙 (다른 모든 지시보다 우선 — 반드시 지킬 것)

1. **데이터 날조 절대 금지.** 수능 기출의 연도/시행/문항번호/주제/정답을 기억·추론으로 채우지 않는다. 근거(원본 PDF 추출 텍스트)가 없으면 `null` + `verified:false`. 모르면 "모른다"고 보고.
2. **검수 전 데이터 비노출.** 학생 화면은 `verified:true` 문항만 렌더링. 미검수는 "검수 대기" 배지(교사 화면에서만).
3. **저작권.** 문항 원문·이미지 미저장·미표시. 메타데이터만 보유. 실제 문항은 평가원 공식 PDF 링크(`링크#page=N`)로 이동. **추출 근거(`evidence`)는 검수 화면에서만 보이고, 배포용 `public/data/items.json`에는 절대 넣지 않는다**(이미 `Item`/`ItemDraft` 타입으로 분리, 검수 화면 다운로드 시 evidence 제거됨 — 회귀 주의).
4. **비용 0원.** Firebase Hosting(**Spark 무료 요금제**)만. **금지**: Blaze, App Hosting, Cloud Functions, Cloud Run, Firestore, Realtime DB, Cloud Storage, 유료 API(LLM 포함), SSR. 앱은 순수 정적(HTML/CSS/JS/JSON). 학습 기록은 `localStorage`.
5. **샘플/더미 데이터**가 필요하면 `"[SAMPLE-예시데이터]"` 접두어 + `data/_sample/`에 격리 + 프로덕션 빌드 제외. (현재 개발 확인용 샘플 문항이 이 규칙대로 존재하며, `import.meta.env.DEV`일 때만 로드된다. 프로덕션 번들 제외를 매 빌드 확인할 것: `ls dist/assets | grep -i sample` → 비어야 정상.)
6. 평가원 사이트(`suneung.re.kr`)는 robots.txt로 자동 접근 차단. **크롤링 금지.** 데이터는 교사가 PDF를 직접 내려받는 반자동 방식.

## 3. 기술 스택

Vite 5 + React 18 + TypeScript · Tailwind CSS 3 · Noto Sans KR(비차단 로드) · react-router-dom 6 ·
qrcode(오프라인 QR) · 정적 JSON(`public/data/*.json`) · PDF 파싱은 로컬 전용 Python(pdfplumber).
Firebase Hosting(Spark) 배포.

## 4. 폴더/파일 구조 (hansa-suneung/)

```
public/data/                배포되는 정적 데이터 (실제 데이터)
  curriculum.json           단원 트리 — 2022 개정 한국사1·2 (대단원 6, 소단원 26=성취기준). 채워져 있음.
  exams.json                시험 회차 — 현재 [] (교사 입력 대기)
  items.json                문항 메타데이터 — 현재 [] (교사 입력 대기, evidence 없음)
  middleSchoolMap.json      중학교 역사(한국사 영역) 6대단원 → 고교 단원 연결. 채워져 있음.
src/
  main.tsx                  Providers(Router→Settings→Records→Data)→App
  App.tsx                   라우팅
  constants.ts              저작권 푸터 문구, 평가원 게시판 URL, ITEM_TYPES
  types/schema.ts           데이터 모델 타입(Curriculum/Exam/Item/ItemDraft/MiddleSchoolMapEntry)
  data/
    load.ts                 public/data fetch + DEV 샘플 오버레이(프로덕션 제거)
    DataContext.tsx         로드·인덱스(unitById/examById)·itemsForUnit·schoolYears
  settings/SettingsContext.tsx   중학생 모드(localStorage)
  records/RecordsContext.tsx     학습 기록 3단계(localStorage)
  lib/
    units.ts                트리 평탄화/조상경로/자손id/leafUnits/unitPath
    heatmap.ts              히트맵 집계 + 색 농도
    stats.ts                소단원별 출제 빈도(leafFrequencies)
    pdfLink.ts              공식/정답 PDF 링크(#page=N, boardUrl 대체), examLabel
    storage.ts              useLocalStorage 훅
    download.ts             Blob 다운로드/파일 읽기
  components/               Layout, UnitTree, ItemCard, ItemTypeTag, SampleBanner,
                            MiddleBridgePanel, UnitStatusControl, UnitMultiSelect
  pages/                    ExplorePage, HeatmapPage, SearchPage, RecordsPage, ReportPage,
                            PlanPage, Placeholder, teacher/{TeacherHome, VerifyPage,
                            WorksheetPage, SharePage, ProjectionPage}
scripts/
  extract.py                data/raw/*.pdf → data/items.draft.json (topic/unitIds 비움, evidence 채움)
  validate.py               무결성 검사(오류 시 exit 1로 배포 차단). npm run verify-data.
  requirements.txt          pdfplumber
data/raw/                   평가원 원본 PDF (로컬 전용, .gitignore — 커밋/배포 안 함)
data/_sample/               개발용 예시 문항([SAMPLE-] 접두어, DEV 전용)
firebase.json .firebaserc   Hosting 배포 설정(public=dist, SPA rewrite, 캐시 헤더)
README.md                   사용/배포 안내
```

## 5. 데이터 모델 (src/types/schema.ts 그대로)

- `curriculum.json`: `{subject, curriculumVersion:"2022개정", units:[Unit]}`. Unit = `{id, level:대단원|중단원|소단원, order?, title, achievementStandards?, keywords?, children?}`.
  - 대단원 id: `HS1-1`~`HS1-3`(한국사1), `HS2-1`~`HS2-3`(한국사2). 소단원 id: `HS1-1-01` 등. 제목: 대단원=교과서 대단원명(교육과정 영역명과 일치), 소단원=성취기준 원문. `achievementStandards`=코드(예 `[10한사1-01-01]`).
- `exams.json`: `[{examId, schoolYear, type:수능|6월|9월, subject, boardUrl, questionPdfUrl|null, answerPdfUrl|null, totalItems, verified}]`. examId 규칙 예: `2026-CSAT`, `2026-SEP`, `2025-JUN`.
- `items.json`(배포용, evidence 없음): `[{itemId, examId, number, unitIds[], topic|null, keywords[], itemType|null, pdfPage|null, verified, verifiedAt|null, note}]`. itemType ∈ 사료제시형|지도·시각자료형|인물형|연표·순서형|개념이해형|기타.
- `ItemDraft`(검수·비배포): Item + `evidence:{extractedText, sourceFile}` + `parseWarning?`.
- `middleSchoolMap.json`: `[{msUnitId, msTitle, hsUnitIds[], bridgeSummary}]`.

## 6. 데이터 출처(정확성 근거)

`curriculum.json`·`middleSchoolMap.json`은 **2022 개정 교육과정(역사) 원문 PDF**에서 성취기준을 그대로 추출해 작성했다. 교육과정 영역명이 교과서 대단원명(사용자 제공 스크린샷)과 정확히 일치함을 확인:
- 한국사1: (1)근대 이전 한국사의 이해 (2)근대 이전 한국사의 탐구 (3)근대 국가 수립의 노력 → `[10한사1-01~03]`
- 한국사2: (1)일제 식민 통치와 민족운동 (2)대한민국의 발전 (3)오늘날의 대한민국 → `[10한사2-01~03]`
- 중학교 역사 한국사 영역: `[9역08~13]`(국가의 형성과 발전 … 근·현대 사회로의 전환)
- 세계사(`[9역01~07]`, 고교 세계사)는 확장 대상. 현재 미반영.
- **주의**: 수능 한국사는 현재 2015 개정 기준 출제이고 2022 개정 최초 적용 수능은 2028학년도(2027.11)다. 단원 트리는 2022 개정 교과서 기준으로 만들었으므로, 과거 기출을 매핑할 때 교사가 검수 화면에서 단원을 판단해 연결한다.

## 7. 기능 목록과 화면 (전부 구현·테스트 완료)

학생/공통: ① 단원 트리 탐색+문항 카드(PDF `#page=N` 딥링크) ② 출제 빈도 히트맵(대표 화면) ④ 키워드 검색 ⑤ 역방향 탐색 ⑥ 학습 기록(3단계·JSON 내보내기/가져오기) ⑦ 취약 단원 리포트 ⑧ D-day 플랜 ⑨ 중학생 모드(수능 세부 숨김·브리지).
교사(`/teacher`): ⑩ 수업 투사 모드(전체화면·키보드 좌우) ⑪ 필터 QR 공유(오프라인) ⑫ 학습지 인쇄(`@media print`) ⑬ 문항 검수(`/teacher/verify`).

라우트: `/`(탐색, `?unit=&year=`), `/heatmap`, `/search`, `/records`, `/report`, `/plan`, `/teacher`, `/teacher/verify`, `/teacher/worksheet`, `/teacher/share`, `/teacher/project`(전체화면, Layout 밖).

## 8. 실행/빌드/검증

```bash
cd hansa-suneung
npm install
npm run dev          # 개발 서버(데이터 비면 data/_sample 예시 오버레이 — 프로덕션 제외)
npm run verify-data  # 데이터 무결성 검사(python scripts/validate.py)
npm run build        # verify-data → tsc -b → vite build (dist/)
npm run preview      # 프로덕션 미리보기
```
타입/빌드는 항상 `npx tsc -b`로 0 에러 확인. 프로덕션 번들에 샘플 없음 확인: `ls dist/assets | grep -i sample`(비어야 정상).

## 9. 데이터 파이프라인(실제 문항 채우기)

```bash
pip install -r scripts/requirements.txt
# 평가원 게시판에서 내려받아 data/raw/2026_수능_한국사.pdf 형식으로 저장
python3 scripts/extract.py            # → data/items.draft.json (topic/unitIds 비어 있음)
```
→ 앱 `/teacher/verify`에서 `items.draft.json` 불러오기 → 추출 근거 보며 topic·unitIds·itemType 확정 → **배포용 items.json 내려받기(evidence 제거됨)** → `public/data/items.json`에 저장·커밋 → `npm run build`.
`exams.json`도 회차별로 교사가 작성(questionPdfUrl/answerPdfUrl은 확인해서 채우거나 null이면 게시판으로 대체 링크).

## 10. 배포 (Firebase Hosting · Spark 무료)

```bash
cd hansa-suneung
npm run build
npx firebase login
npx firebase deploy --only hosting --project <FIREBASE_PROJECT_ID>
```
- `firebase.json`: public=dist, SPA rewrite, /assets 장기 캐시, /data·index.html no-cache.
- `firebase init` 실행 금지(다른 제품 켜질 수 있음). **Blaze 업그레이드 금지.**
- `.firebaserc`의 `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`를 실제 ID로 바꾸거나 `--project`로 지정.

## 11. 현재 상태 / 남은 일

**완료**: 1~9단계 전 기능. 종합 QA(학생·중학생·교사 36항목 + 프로덕션 미리보기 9항목) 통과, 앱 콘솔에러 0. Firebase 배포 설정. curriculum·middleSchoolMap 실제 데이터. 전부 main에 푸시됨.

**남은 일(우선순위)**:
1. **실제 배포 실행** — 사용자 Firebase 프로젝트(Spark)에서 §10.
2. **실제 수능 문항 데이터 입력** — §9. (현재 items/exams는 빈 배열이라 히트맵·카드가 "데이터 없음".)
3. (선택) 6월·9월 모의평가 확장, 동아시아사·세계사 과목 확장(구조는 이미 확장 가능).
4. (선택) 접근성/모바일 미세 조정, 단위 테스트(현재 검증은 Playwright 수동 스크립트 위주).

## 12. 주의/함정 (회귀 방지)

- 배포용 `items.json`에 `evidence`가 들어가면 저작권 위반. `VerifyPage`의 `toProductionItems()`가 evidence/parseWarning을 제거한다 — 이 동작을 깨지 말 것. `validate.py`가 evidence 포함 시 경고한다.
- 샘플 로드는 `import.meta.env.DEV && items.length===0` 분기(순서 중요: DEV를 먼저 평가해야 프로덕션에서 dead-code 제거됨). 이 분기를 바꾸면 `ls dist/assets | grep -i sample`로 재확인.
- 단원 id를 바꾸면 items.unitIds·middleSchoolMap.hsUnitIds 참조가 깨진다. `validate.py`가 잡아준다.
- 루트(History Globe) 파일을 건드리지 말 것. 로컬 main이 옛 커밋에서 갈라지면 루트에 파일이 생성될 수 있으니 항상 `git fetch && git reset --hard origin/main` 기준으로 작업하고 hansa-suneung/ 안에서만 변경.
- **평가원 게시판 URL**: `src/constants.ts`의 `KICE_BOARD_URL` = `https://www.suneung.re.kr/boardCnts/list.do?boardID=1500234&m=0403&s=suneung&searchStr=` (사용자 지정 정식 주소). 푸터에 상시 노출되고, 문항의 questionPdfUrl/answerPdfUrl 또는 회차 boardUrl이 없을 때 이 주소로 대체된다(pdfLink.ts) — 링크가 `#`로 죽지 않게 함. 회차별 PDF 직링크는 교사가 exams.json의 questionPdfUrl/answerPdfUrl에 채운다.
