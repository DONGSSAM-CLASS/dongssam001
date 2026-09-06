# 한국사 수능 기출 단원 연동 웹앱 (2022 개정 교육과정 연계)

중·고등학생과 교사를 위한 웹앱. 교과서 단원 트리(대단원 → 중단원 → 소단원)를 클릭하면
그 단원에서 최근 수능에 출제된 주제 목록을 보여주고, 각 주제는 한국교육과정평가원 공식
기출 PDF의 해당 페이지로 연결한다.

> 이 폴더(`hansa-suneung/`)는 `dongssam001` 저장소의 하위 프로젝트다.
> 저장소 루트의 **History Globe** 앱, `dokdo-necut/` 프로젝트와는 별개다.

## 절대 원칙

1. **데이터 날조 금지** — 문항 데이터는 원본 PDF 추출 텍스트를 근거로만 생성. 근거 없으면 `null` + `verified:false`.
2. **검수 전 데이터 비노출** — 학생 화면은 `verified:true` 문항만 렌더링. 미검수는 "검수 대기" 배지.
3. **저작권** — 문항 원문/이미지 미저장·미표시. 메타데이터만 보유하고 평가원 공식 PDF로 링크(`링크#page=N`).
   추출 근거(`evidence`)는 검수 화면에서만 보이고 **배포용 `items.json`에는 포함하지 않는다.**
4. **비용 0원** — Firebase Hosting(**Spark 무료 요금제**)만 사용. 완전한 정적 사이트, 학습 기록은 `localStorage`.

## 기능

**학생/공통** — 단원 트리 탐색 · 문항 카드(PDF `#page=N` 딥링크) · 출제 빈도 히트맵 ·
키워드 검색 · 역방향 탐색("2024학년도 수능 12번") · 내 학습 기록(3단계·JSON 내보내기/가져오기) ·
취약 단원 리포트 · D-day 학습 플랜 · 중학생 모드 토글

**교사** (`/teacher`) — 수업 투사 모드 · 필터 QR 공유(오프라인) · 학습지 인쇄(`@media print`) ·
문항 검수(`/teacher/verify`)

## 기술 스택

Vite + React + TypeScript · Tailwind CSS · Noto Sans KR · react-router · qrcode(오프라인) ·
정적 JSON(`public/data/*.json`) · 배포 Firebase Hosting(Spark) · PDF 파싱은 로컬 전용 Python.

## 데이터 모델 (`public/data/`)

| 파일 | 내용 |
| --- | --- |
| `curriculum.json` | 단원 트리(2022 개정 교육과정 한국사1·2, 대단원=교과서 대단원, 소단원=성취기준) |
| `exams.json` | 시험 회차(학년도·시행·PDF/게시판 URL·문항 수) |
| `items.json` | 문항 메타데이터(주제·단원·유형·PDF 페이지·verified). **원문·evidence 미포함** |
| `middleSchoolMap.json` | 중학교 역사(한국사 영역) 단원 → 고교 단원 연결 |

## 개발

```bash
cd hansa-suneung
npm install
npm run dev          # 개발 서버 (데이터가 비어 있으면 data/_sample 예시로 확인 — 프로덕션 제외)
npm run verify-data  # 데이터 무결성 검사 (scripts/validate.py)
npm run build        # verify-data → tsc → vite build (dist/ 생성)
```

## 데이터 파이프라인 (반자동 · 로컬 전용)

`suneung.re.kr` 은 robots.txt 로 자동 접근을 차단하므로 크롤링하지 않는다.

1. 교사가 평가원 게시판에서 학년도별 한국사 문제지·정답 PDF를 직접 내려받아
   `data/raw/{학년도}_{시행구분}_한국사.pdf` 로 저장 (예: `2026_수능_한국사.pdf`).
2. 초안 추출:
   ```bash
   pip install -r scripts/requirements.txt
   python3 scripts/extract.py            # → data/items.draft.json (topic·unitIds 는 비어 있음)
   ```
3. 검수: 앱의 `/teacher/verify` 에서 `items.draft.json` 을 불러와 추출 근거를 보며
   주제·단원·유형을 확정하고 **배포용 `items.json`** 을 내려받아 `public/data/items.json` 에 저장·커밋.
4. `exams.json` 의 `questionPdfUrl`·`answerPdfUrl` 은 교사가 확인해 채운다(비어 있으면 UI가 게시판으로 대체 링크).
5. `npm run verify-data` 로 무결성 검사(실패 시 배포 차단).

> `data/raw/*.pdf`, `data/items.draft.json` 은 저작권상 커밋/배포하지 않는다(.gitignore).

## 배포 (Firebase Hosting · Spark 무료)

```bash
# 1) Firebase 프로젝트 생성 (요금제는 Spark 그대로. 결제 수단 등록 불필요)
# 2) .firebaserc 의 default 값을 실제 프로젝트 ID 로 교체
npx firebase login
npm run build
npx firebase deploy --only hosting
```

- `firebase.json`: `hosting.public = dist`, SPA rewrite(`** → /index.html`),
  자산(`/assets/**`)은 장기 캐시, 데이터(`/data/**/*.json`)와 `index.html` 은 `no-cache`.
- `firebase init` 시 **Hosting 만** 선택한다. 다른 Firebase 제품(Firestore/Functions/App Hosting 등)을 초기화하지 않는다.

### ⚠️ Blaze 요금제로 업그레이드하지 말 것

- 이 앱은 **완전한 정적 사이트**로, Spark 무료 요금제만으로 모든 기능이 동작한다.
- **금지**: Blaze 요금제, Firebase App Hosting, Cloud Functions, Cloud Run, Firestore,
  Realtime Database, Cloud Storage, 유료 API, 서버 사이드 렌더링.
- App Hosting·Functions 는 Blaze 필수이고, **Blaze 는 지출 상한이 없어 사고 위험**이 있다.
- Spark 는 무료 한도를 넘으면 과금되는 대신 **배포가 막히는** 구조라 안전하다. 이 구조를 벗어나지 말 것.

## 폴더 구조

```
public/data/        배포되는 정적 데이터 (curriculum / exams / items / middleSchoolMap .json)
src/
  components/       트리·문항 카드·히트맵·검수 등 UI
  pages/            화면(탐색·히트맵·검색·학습·리포트·플랜·teacher/*)
  data/             데이터 로더·컨텍스트
  records/          학습 기록(localStorage)
  lib/              단원 트리·통계·PDF 링크·다운로드 유틸
  types/schema.ts   데이터 모델 타입
data/raw/           평가원 원본 PDF (로컬 전용, 커밋/배포 안 함)
data/_sample/       개발용 예시 데이터([SAMPLE-예시데이터], DEV에서만 로드)
scripts/            extract.py(파싱) · validate.py(검증)
firebase.json .firebaserc   Hosting 배포 설정
```

## 확장

`subject` 필드와 단원 트리 구조는 동아시아사·세계사로 확장 가능하도록 설계했다.
6월·9월 모의평가는 `exams.json` 의 `type` 에 `6월`/`9월` 을 추가하면 히트맵·검색에 함께 반영된다.
