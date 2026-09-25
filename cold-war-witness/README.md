# 냉전의 목격자 — 감시 속에서 내리는 선택

냉전 시대 감시 속 평범한 시민(가상 인물)이 되어 선택을 내리고, 그 경험을 AI 윤리 원칙과 잇는 **중학교 2학년 역사 3차시 수업용 웹앱**입니다.
(2026 인공지능 윤리교육 콘텐츠 공모전 출품작 · 개발: 동쌤 김동은, 번동중학교)

> 🚧 개발 중 — 현재 **Phase 2(콘텐츠 데이터) 완료, 교사 검토 대기**. 배포 안내는 Phase 6 에서 이 문서에 채웁니다.

## 지금 할 수 있는 것

```bash
cd cold-war-witness
npm install
npm test            # 콘텐츠 데이터 점검 (장면 수·선택지 수·사실 카드 연결·출처)
npm run facts:doc   # docs/fact-cards.md (사실 카드 검토표) 다시 만들기
npm run dev         # 뼈대 화면
```

## 문서

- [docs/data-model.md](docs/data-model.md) — 폴더 구조, Firestore 데이터 구조, 권한 설계
- [docs/fact-cards.md](docs/fact-cards.md) — 사실 카드 전체 목록 (교사 검토용, 자동 생성)
- [docs/work-log.md](docs/work-log.md) — 작업 로그, **[검증필요] 목록**, 결정 사항, 제안

## 문장을 고치려면

역사 콘텐츠는 모두 `src/data/` 에 있습니다. 코드를 몰라도 따옴표 안의 문장만 고치면 됩니다.

| 고칠 것 | 파일 |
|---|---|
| 장면 본문·선택지·결과·성찰 질문 | `src/data/scenarios.ts` |
| 사실 카드와 출처 | `src/data/facts.ts` |
| 원칙 카드 설명 | `src/data/principles.ts` |
| 과정안·활동지·교사용 가이드 | `src/data/lessonMaterials.ts` |
| 앱 정보(공모전) 페이지 | `src/data/appInfo.ts` |
| 앱 제목 | `src/config.ts` 의 `APP_TITLE` |

고친 뒤 `npm test` 로 구조가 깨지지 않았는지 확인해 주세요.
