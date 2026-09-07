# 인수인계 — 아고라의 딜레마

**아고라의 딜레마** — K-SEL 기반 펠로폰네소스 전쟁사 탐구·가상 의사결정 웹앱. 중학교 2학년 역사 수업용 3차시 프로그램입니다.

## 1. 현재 상태 (Phase 1-6 완료, E2E 테스트 통과)

| Phase | 내용 | 상태 |
| --- | --- | --- |
| 1 | 프로젝트 초기화 · 폴더 구조 · firebase.json · CSP 헤더 | ✅ |
| 2 | 데이터 레이어 (7개 데이터 모듈) · 사실 검증 · 상태 관리 | ✅ |
| 3 | 1차시 화면 (S0 인트로, S1 체크인, S2 출처, S3 비교) | ✅ |
| 4 | 2차시 의사결정 엔진 (S4 6개 갈림길 노드) | ✅ |
| 5 | 3차시 화면 (S5 궤적, S6 관점, S7 반편견, S8 선언문) | ✅ |
| 6 | 보조 화면 (S9 교사용, S10 용어사전, S11 팩트체크) · UI 버그 수정 | ✅ |

검증: Playwright E2E 12개 화면 전체 통과, JS 오류 0건, 외부 네트워크 요청 0건, PII 수집 0건.

## 2. 기술 스택 (엄격한 제약)

- **순수 HTML + CSS + JavaScript (ES6 모듈)**. 빌드 도구 없음.
- Node·npm·Vite·React·번들러 사용 **금지**
- 외부 라이브러리·CDN 일절 사용 **금지**
- CSP: `connect-src 'none'` — 네트워크 요청 코드 불허
- 모든 데이터는 `localStorage` (`agora-dilemma-v1` 키)에만 저장
- Firebase Hosting(정적 파일 전용, SDK 미사용)

## 3. 폴더 구조

```
public/                       ← Firebase Hosting root
  index.html                  ← SPA 진입점 (hash 라우팅)
  favicon.svg
  manifest.webmanifest
  styles/
    tokens.css                ← 디자인 토큰 (색상·간격·글꼴·그림자)
    base.css                  ← 리셋·레이아웃·공통 스타일
    components.css            ← 버튼·카드·칩·모달·플립카드·진행바 등
    print.css                 ← 인쇄 스타일 (S8 선언문용)
  scripts/
    main.js                   ← 앱 초기화·라우터 연결·글로벌 이벤트
    router.js                 ← hash 기반 라우터 (파라미터 지원)
    state.js                  ← localStorage 상태 관리 (400ms 디바운스)
    ui.js                     ← 공통 UI (토스트·모달·호흡·일시정지·프로그레스바·툴팁)
    screens/
      s0-intro.js             ← 닉네임 선택·시작
      s1-checkin.js           ← 감정 체크인·호흡
      s2-sources.js           ← 출처 카드 4장 플립·평가
      s3-compare.js           ← 비교 분석 칩 분류·개방형 질문
      s4-decision.js          ← 6개 의사결정 노드 (D1-D6, 3단계 흐름)
      s5-trajectory.js        ← SVG 타임라인 궤적 시각화
      s6-perspective.js       ← 4인 관점 응답
      s7-bias.js              ← 6개 편향 자기점검
      s8-declaration.js       ← 4문장 선언문 완성·카드·인쇄
      s9-teacher.js           ← 교사용 안내 (7개 섹션)
      s10-glossary.js         ← 용어 사전 테이블
      s11-factcheck.js        ← 39건 팩트체크 카드
  data/
    nicknames.js              ← 12개 별명 데이터
    sources.js                ← 4개 출처 카드 데이터
    decisions.js              ← 6개 의사결정 노드 데이터
    glossary.js               ← 20개 용어 데이터
    perspectives.js           ← 4인 관점 캐릭터 데이터
    curriculum.js             ← 교육과정·K-SEL 성취기준 데이터
    factcheck.js              ← 39건 사실검증 데이터
firebase.json                 ← Hosting 설정·CSP 헤더
```

## 4. 라우트 구조

| 해시 경로 | 화면 | 차시 |
| --- | --- | --- |
| `#/` | S0 인트로 | - |
| `#/checkin` | S1 감정 체크인 | 1차시 |
| `#/sources` | S2 출처 탐색 | 1차시 |
| `#/compare` | S3 비교 분석 | 1차시 |
| `#/decision/:nodeId` | S4 의사결정 (D1-D6) | 2차시 |
| `#/trajectory` | S5 궤적 | 3차시 |
| `#/perspective` | S6 관점 | 3차시 |
| `#/bias` | S7 반편견 | 3차시 |
| `#/declaration` | S8 선언문 | 3차시 |
| `#/teacher` | S9 교사용 | 보조 |
| `#/glossary` | S10 용어사전 | 보조 |
| `#/factcheck` | S11 팩트체크 | 보조 |

## 5. 상태 관리

`localStorage` 키 `agora-dilemma-v1`에 단일 JSON 객체로 저장. 400ms 디바운스.

```js
{
  nickname: '',
  checkin: { emotions: [], breathDone: false },
  sources: [{ who:'', claim:'', reason:'', trust:0 }, ...×4],
  compare: { bins: { athens:[], sparta:[] }, openAnswer:'' },
  decisions: {},      // { D1: { choice, reason, emotion, influence }, ... }
  trajectory: {},
  perspectives: {},   // { p1:'', p2:'', ... }
  biasCheck: {},      // { b1:'yes', b2:'no', ... }
  declaration: {},    // { s0:'', s1:'', s2:'', s3:'' }
}
```

## 6. 반드시 지켜야 할 규칙

1. **빌드 도구 없음**: `npm install`, `import from 'node_modules'` 등 금지. 모든 import는 상대 경로.
2. **외부 라이브러리·CDN 없음**: 순수 vanilla JS만 사용.
3. **네트워크 요청 없음**: `fetch`, `XMLHttpRequest`, WebSocket 등 금지. CSP `connect-src 'none'`.
4. **PII 수집 없음**: 이름·학번·학교명·이메일 입력 필드 금지.
5. **localStorage만 사용**: 모든 학습 기록은 기기 내 저장. 외부 전송 코드 불허.
6. **한국어 전용**: 모든 UI 텍스트, 주석, 커밋 메시지는 한국어.
7. **텍스트 제약**: 한 문장 45자 이내, 한 문단 3문장 이내, 화면당 600자 이내.
8. **명세에 없는 기능 금지**: 임의 기능 추가 불가.
9. **사실 정확성**: 허구 인용 금지, 수치는 "약" 표시, 투키디데스 연설은 재구성 표시, 뮈틸레네 사건은 "주모자 처형" 포함.

## 7. 실행 방법

```bash
# 로컬 개발 서버 (아무 정적 파일 서버)
npx serve public -p 8080
# 또는
python3 -m http.server 8080 -d public

# 브라우저에서 http://localhost:8080 접속
```

빌드 단계 없음. `public/` 폴더를 그대로 서빙하면 됩니다.

## 8. 배포 (Firebase Hosting)

```bash
firebase deploy --only hosting
```

`firebase.json`에 CSP 헤더, SPA rewrite, 보안 헤더가 이미 설정되어 있습니다.

## 9. 알려진 제약

- 오프라인 학습 기록은 해당 브라우저(localStorage)에만 저장됩니다. 기기 변경 시 데이터 이전 불가.
- S4 의사결정 결과(outcome)는 선택+감정의 단순 조합이며, AI 기반 분석이 아닙니다.
- S5 궤적 SVG는 고정 레이아웃이며 노드 수 변경 시 좌표 수동 조정 필요.
- S8 인쇄는 `window.print()` 호출이며 PDF 직접 생성은 아닙니다.

---

원격 저장소: `https://github.com/DONGSSAM-CLASS/dongssam001` (브랜치 `main`)
