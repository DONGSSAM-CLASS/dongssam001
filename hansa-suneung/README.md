# 한국사 수능 기출 단원 연동 웹앱 (2022 개정 교육과정 연계)

중·고등학생과 교사를 위한 웹앱. 교과서 단원 트리(대단원 → 중단원 → 소단원)를 클릭하면
그 단원에서 최근 수능에 출제된 주제 목록을 보여주고, 각 주제는 한국교육과정평가원 공식
기출 PDF의 해당 페이지로 연결한다.

> 이 폴더(`hansa-suneung/`)는 `dongssam001` 저장소의 하위 프로젝트다.
> 저장소 루트의 **History Globe** 앱, `dokdo-necut/` 프로젝트와는 별개다.
>
> ⚠️ 개발 진행 중 — 현재 **1단계(프로젝트 골격)** 까지 완료.

## 절대 원칙 (요약)

1. **데이터 날조 금지** — 문항 데이터는 원본 PDF 추출 텍스트를 근거로만 생성. 근거 없으면 `null` + `verified: false`.
2. **검수 전 데이터 비노출** — 학생 화면은 `verified: true` 만 렌더링.
3. **저작권** — 문항 원문/이미지 미저장·미표시. 메타데이터만 보유하고 평가원 공식 PDF로 링크(`링크#page=N`).
4. **비용 0원** — Firebase Hosting(Spark 무료)만 사용. 완전한 정적 사이트, 학습 기록은 `localStorage`.

## 기술 스택

Vite + React + TypeScript · Tailwind CSS · Noto Sans KR · 정적 JSON(`public/data/*.json`) ·
배포 Firebase Hosting(Spark) · PDF 파싱은 로컬 전용 Python(`scripts/`, 배포 미포함).

## 폴더 구조

```
public/data/        배포되는 정적 데이터 (curriculum / exams / items / middleSchoolMap .json)
src/                React 앱
  types/schema.ts   4개 데이터 모델 타입 정의
data/raw/           평가원 원본 PDF (로컬 전용, 커밋/배포 안 함)
data/_sample/       샘플 데이터 격리 (배포 제외)
scripts/            extract.py / validate.py (4단계에서 추가)
```

## 개발

```bash
cd hansa-suneung
npm install
npm run dev          # 개발 서버
npm run verify-data  # 데이터 무결성 검증 (scripts/validate.py)
npm run build        # verify-data → tsc → vite build
```

## 데이터 수집 (반자동)

`suneung.re.kr` 은 robots.txt 로 자동 접근을 차단하므로 크롤링하지 않는다.
교사가 평가원 게시판에서 학년도별 한국사 문제지·정답 PDF를 직접 내려받아
`data/raw/{학년도}_{시행구분}_한국사.pdf` 로 저장하고, 로컬 파싱 스크립트로 초안을 만든 뒤
검수 화면에서 확정한다.

배포 절차와 "Blaze 업그레이드 금지" 경고는 9단계에서 문서화한다.
