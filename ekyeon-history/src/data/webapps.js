// 선생님들이 개발한 웹앱 초기 시드 데이터입니다.
// Firestore `webapps` 컬렉션에 데이터가 있으면 그쪽을 우선 표시하고,
// 없으면 이 상수를 그대로 보여줍니다. (운영 도구에서 추가·수정 가능)
export const TEACHER_WEBAPPS = [
  {
    id: 'seed-worldhistory-sources',
    title: '중·고등학생을 위한 세계사 사료 탐구 교실',
    description: '원전과 해설, APA 7판 출처로 사료를 탐구하는 세계사 수업 도구',
    url: 'https://worldhistorysources-dongssam.netlify.app/',
    order: 1,
  },
  {
    id: 'seed-agora-dilemma',
    title: '아고라의 딜레마',
    description: 'K-SEL 기반 펠로폰네소스 전쟁사 탐구·가상 의사결정 웹앱',
    url: 'https://agora-dilemma-class-20260907.web.app/',
    order: 2,
  },
  {
    id: 'seed-dokdo-necut',
    title: '독도네컷 · 독도의 날 인생네컷',
    description: '독도의 날(10.25) 체험부스용, 역사 인물과 함께 찍는 인생네컷',
    url: 'https://dokdo-necut.web.app/',
    order: 3,
  },
  {
    id: 'seed-history-globe',
    title: 'History Globe · 히스토리 글로브',
    description: '3D 지구본으로 세계사 동시대를 탐색하는 수업 도구',
    url: 'https://history-globe-psroy.web.app/',
    order: 4,
  },
  {
    id: 'seed-suneung-textbook',
    title: '역사 수능 기출 탐색',
    description: '교과서 단원을 클릭해 10개년 수능 출제 주제와 기출을 확인',
    url: 'https://suneung-textbook.web.app/',
    order: 5,
  },
  {
    id: 'seed-gwangbok-game',
    title: '아직 오지 않은 광복 · 한국광복군 역사 추리 게임',
    description: '사료를 읽고 선택을 추리하는 역사 학습 게임',
    url: 'https://gwangbok-game-20260911.web.app/',
    order: 6,
  },
  {
    id: 'seed-lets-korea-time',
    title: "『Let's KOREA TIME』 : 중학생을 위한 고려로의 시간여행",
    description: '2022 개정 교육과정 연계 고려 시대 방탈출 추리 게임',
    url: 'https://lets-korea-time-2026.web.app/',
    order: 7,
  },
];

// 본원 연구회(에크연) 공식 홈페이지 — 별도 섹션에 같은 카드 형식으로 배치합니다.
export const PARENT_WEBAPPS = [
  {
    id: 'seed-edutech-teachers',
    title: '에듀테크 교사 연구회',
    description: '에듀테크를 통해 교육적 가치를 밝힌다 — 본원 연구회 공식 홈페이지',
    url: 'https://edutech-teachers.web.app/',
    order: 1,
  },
];

export const ALL_SEED_WEBAPPS = [...TEACHER_WEBAPPS, ...PARENT_WEBAPPS];
