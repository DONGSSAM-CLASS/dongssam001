# Codex 입력 프롬프트 — 아고라의 딜레마

## 프로젝트 개요

이 저장소(`dongssam-class/dongssam001`)의 `public/` 폴더에 "아고라의 딜레마"라는 중학교 2학년 역사 수업용 웹앱이 있습니다. 펠로폰네소스 전쟁을 소재로 한 K-SEL 기반 3차시 프로그램이며, 12개 화면(S0-S11)이 모두 구현·테스트 완료된 상태입니다.

**반드시 `CODEX_HANDOFF.md`를 먼저 읽고 제약 조건을 숙지한 뒤 작업하세요.**

핵심 제약: 빌드 도구 없음, 외부 라이브러리·CDN 없음, 네트워크 요청 없음(CSP `connect-src 'none'`), PII 수집 없음, localStorage만 사용, 모든 UI 텍스트는 한국어.

---

## 앞으로 진행할 작업 (우선순위 순)

### 1. Firebase Hosting 배포 설정

- Firebase 프로젝트 연결 후 `firebase deploy --only hosting` 실행
- 배포 후 CSP 헤더가 정상 적용되는지 확인
- HTTPS 강제 리다이렉트 확인

### 2. 접근성(a11y) 점검 및 개선

- 모든 화면에서 키보드만으로 전체 흐름 탐색 가능한지 확인
- 스크린 리더 호환성 점검 (aria-label, aria-live, role 속성)
- 색상 대비(contrast ratio) WCAG AA 기준 충족 여부 확인
- 필요 시 `tokens.css`의 색상값 조정

### 3. 콘텐츠 검수

- `public/data/factcheck.js`: 39건 팩트체크 항목의 출처·수치 재확인
- `public/data/decisions.js`: 6개 의사결정 노드의 역사적 정확성 확인
- `public/data/glossary.js`: 20개 용어 정의의 정확성·가독성 확인
- 텍스트 제약 준수 여부: 한 문장 45자 이내, 한 문단 3문장 이내, 화면당 600자 이내

### 4. 교사용 안내(S9) 보강

- `public/scripts/screens/s9-teacher.js`의 운영 가이드 섹션 상세화
- 차시별 진행 소요 시간·준비물·유의점 추가
- 평가 루브릭 예시 추가 (K-SEL 성취기준 연동)

### 5. 인쇄·내보내기 개선

- S8 선언문 인쇄 시 레이아웃 최적화 (`public/styles/print.css`)
- A4 용지 기준 여백·글꼴 크기 조정
- 선언문 카드가 한 페이지에 깔끔하게 들어가는지 확인

### 6. 모바일 UX 세부 조정

- 360px~480px 구간에서 전체 화면 흐름 재테스트
- S2 플립카드: 좁은 화면에서 입력 필드 크기·간격 확인
- S4 의사결정: 긴 선택지 텍스트가 잘리지 않는지 확인
- S5 SVG 타임라인: 가로 스크롤 없이 표시되는지 확인

### 7. PWA 오프라인 지원 (선택)

- `manifest.webmanifest`는 이미 존재
- Service Worker 추가하여 오프라인 캐시 지원 (CSP 제약 내에서)
- 주의: `connect-src 'none'`이므로 SW의 fetch 이벤트에서 네트워크 요청 불가, 캐시 전용만 가능

### 8. 테스트 자동화 (선택)

- 현재 Playwright 수동 테스트 스크립트만 존재
- CI/CD 파이프라인에 E2E 테스트 통합 (GitHub Actions)
- 접근성 자동 테스트 (axe-core) 추가

---

## 작업 시 참고

- 모든 화면 모듈은 `public/scripts/screens/` 아래 `render(container)` 함수를 export합니다.
- 라우팅은 `public/scripts/router.js`에서 hash 기반으로 처리합니다.
- 상태는 `public/scripts/state.js`의 `getState()`/`updateState()` 사용합니다.
- 공통 UI는 `public/scripts/ui.js`에서 import합니다.
- 디자인 토큰은 `public/styles/tokens.css`에 CSS 변수로 정의되어 있습니다.
