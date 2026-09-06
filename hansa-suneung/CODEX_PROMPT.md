# Codex 입력용 프롬프트 (이 내용을 그대로 Codex에 붙여넣으세요)

너는 중·고등학교 역사 교사와 함께 만드는 교육용 웹앱을 이어서 개발하는 개발자다. 이 앱은 실제 학교 수업·학생 학습에 쓰이므로 **사실 오류가 하나도 있어서는 안 된다.** 아래 지침을 지켜라.

## 먼저 할 일
1. 첨부된 zip을 풀면 `hansa-suneung/` 프로젝트가 있다. **`hansa-suneung/CODEX_HANDOFF.md`를 가장 먼저 정독**하라. 프로젝트 목적·구조·데이터 모델·원칙·남은 일이 모두 정리돼 있다. `CONVERSATION_SUMMARY.md`도 읽어 맥락을 파악하라.
2. 실행해서 현재 상태를 눈으로 확인하라:
   ```bash
   cd hansa-suneung
   npm install
   npm run dev        # 개발 서버(예시 데이터로 전 기능 확인 가능)
   npm run build      # verify-data → tsc → vite build 가 통과하는지 확인
   ```

## 절대 원칙 (다른 어떤 지시보다 우선)
1. **데이터 날조 금지.** 수능 기출의 연도·시행·문항번호·주제·정답을 기억·추론으로 채우지 마라. 근거(원본 PDF 추출 텍스트)가 없으면 `null` + `verified:false`. 모르면 "모른다"고 보고. 샘플이 필요하면 `"[SAMPLE-예시데이터]"` 접두어 + `data/_sample/`에 격리 + 프로덕션 제외.
2. **검수 전 데이터 비노출.** 학생 화면은 `verified:true`만 렌더링.
3. **저작권.** 문항 원문·이미지 저장/표시 금지. 메타데이터만. 실제 문항은 평가원 공식 PDF 링크(`#page=N`)로. 추출 근거(`evidence`)는 검수 화면에서만 쓰고 **배포용 `public/data/items.json`에 절대 넣지 마라**(이미 그렇게 구현됨 — 깨지 말 것).
4. **비용 0원.** Firebase Hosting(Spark 무료)만. Blaze·App Hosting·Cloud Functions·Firestore·유료 API·SSR **금지**. 순수 정적 사이트, 학습 기록은 localStorage.
5. 평가원 사이트(suneung.re.kr)는 robots.txt로 자동 접근 차단 → **크롤링 금지.** 데이터는 교사가 PDF를 직접 내려받는 반자동 방식. 게시판 정식 주소: `https://www.suneung.re.kr/boardCnts/list.do?boardID=1500234&m=0403&s=suneung&searchStr=`.

## 저장소 규칙 (중요)
- GitHub `DONGSSAM-CLASS/dongssam001`, 브랜치 **main**. 이 저장소는 여러 프로젝트가 공존한다:
  루트(`/`)=History Globe(별개), `dokdo-necut/`(별개), **`hansa-suneung/`=이 프로젝트.**
- **모든 변경은 `hansa-suneung/` 안에서만.** 루트/다른 폴더를 건드리지 마라. 커밋 전 확인:
  `git diff --cached --name-only | grep -v '^hansa-suneung/'` (비어야 정상)
- 커밋 메시지는 한국어로 간결히.

## 현재 상태
- 1~9단계 전 기능 구현 완료(단원 트리·문항카드·PDF 딥링크·히트맵·검색·역방향·학습기록·취약단원·D-day·투사·QR·인쇄·검수). 학생/중학생/교사 3개 페르소나 QA 통과, 앱 콘솔 에러 0.
- `curriculum.json`(2022 개정 한국사1·2, 대단원 6/소단원 26=성취기준)·`middleSchoolMap.json`은 교육과정 원문 기반으로 채워져 있음.
- `exams.json`·`items.json`은 **의도적으로 빈 배열**(원칙 1 — 실제 수능 데이터는 교사 검수를 거쳐 입력).

## 네가 이어서 할 일 (우선순위)
1. **실제 배포**: 사용자 Firebase 프로젝트(Spark 무료)에서 `hansa-suneung/`를 빌드해 Hosting 배포. 절차는 CODEX_HANDOFF §10. `firebase init` 금지, Blaze 금지.
2. **실제 수능 문항 데이터 입력 파이프라인 지원**: 교사가 `data/raw/*.pdf`를 넣으면 `python3 scripts/extract.py`로 초안 생성 → `/teacher/verify`에서 검수 → `public/data/items.json` 커밋. 이 흐름이 매끄럽게 되도록 돕고, 검수·검증(`scripts/validate.py`) 관련 개선.
3. (선택) 6월·9월 모의평가 확장, 동아시아사·세계사 과목 확장(구조는 확장 가능하게 설계됨), 접근성/모바일 개선, 단위 테스트 추가.

## 작업 방식
- 사용자는 단계별로 확인하며 진행하기를 원한다. 큰 변경 전에 계획을 짧게 보고하고, 지시하지 않은 파일·기능을 임의로 바꾸지 마라.
- 변경 후에는 `npm run build`(verify-data→tsc→vite)와 프로덕션 번들에 샘플이 없는지(`ls dist/assets | grep -i sample`가 비어야 함)를 확인하고 커밋/푸시하라.
- 회귀 방지: 배포용 items.json에 evidence가 들어가지 않게, 학생 화면에 verified:false가 보이지 않게, 링크가 `#`로 죽지 않게(평가원 게시판으로 대체) 유지하라.

먼저 CODEX_HANDOFF.md를 읽고, 현재 앱을 실행해 상태를 확인한 뒤, 위 1번(배포)부터 사용자와 상의하며 진행하라.
