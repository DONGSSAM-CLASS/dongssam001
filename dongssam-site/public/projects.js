// 공개 개발 자료. 총 21개.
const PROJECTS = [
  { title:"중·고등학생을 위한 세계사 사료 탐구 교실", url:"https://worldhistorysources-dongssam.netlify.app/", desc:"원전·해설·APA 7판 출처로 사료를 읽는 세계사 탐구 도구", category:"사료 탐구", icon:"scroll-text" },
  { title:"아고라의 딜레마", url:"https://agora-dilemma-class-20260907.web.app/", desc:"K-SEL 기반 펠로폰네소스 전쟁사 가상 의사결정 웹앱", category:"의사결정", icon:"scale" },
  { title:"독도네컷 · 독도의 날 인생네컷", url:"https://dokdo-necut.web.app/", desc:"역사 인물과 함께 찍는 독도의 날 체험부스 포토부스", category:"체험부스", icon:"camera" },
  { title:"History Globe · 히스토리 글로브", url:"https://history-globe-psroy.web.app/", desc:"3D 지구본으로 세계사 동시대를 탐색하는 수업 도구", category:"수업 도구", icon:"globe" },
  { title:"역사 수능 기출 탐색", url:"https://suneung-textbook.web.app/", desc:"교과서 단원별로 연동해 보는 수능 기출 주제 탐색기", category:"학습 지원", icon:"book-open-check" },
  { title:"아직 오지 않은 광복 · 한국광복군 역사 추리 게임", url:"https://gwangbok-game-20260911.web.app/", desc:"사료를 읽고 선택하며 광복군의 국내 진공 작전을 추리", category:"역사 게임", icon:"search-check" },
  { title:"『Let's KOREA TIME』 : 중학생을 위한 고려로의 시간여행", url:"https://lets-korea-time-2026.web.app/", desc:"918년 송악에서 1392년 벽란도까지, 고려 시대 방탈출 추리 게임", category:"역사 게임", icon:"hourglass" },
  {"title": "동쌤의 역사 레이싱 게임", "url": "https://dongssam-history-racing.web.app/", "desc": "역사 인물·아이템을 만나며 달리는 레이싱 게임. 개인 플레이와 학급 레이스로 함께 즐깁니다.", "category": "역사 게임", "icon": "flag"},
  {"title": "동쌤의 교실 국가 타이쿤", "url": "https://dongssam-tycoon-20260917.web.app/", "desc": "학급을 하나의 국가처럼 운영하며 노동·세금·금융·투자·행정을 체험하는 교실 경제 플랫폼", "category": "학급 운영", "icon": "building-2"},
  {"title": "역사탐정 프로젝트", "url": "https://history-detective-20260915.web.app/", "desc": "AI 역사 답변을 출처 확인·맥락화·교차검증으로 검토하고 APA 7판 출처를 작성하는 탐구 실습", "category": "사료 탐구", "icon": "search-check"},
  {"title": "다산의 시간", "url": "https://dasan-time-learning-2026.web.app/", "desc": "정약용의 삶과 조선 사회의 변동을 살펴보며, 디지털 습관과 나의 시간 사용을 돌아보는 수업 도구", "category": "학습 지원", "icon": "timer"},
  {"title": "임시정부 : 광복을 위한 꿈", "url": "https://imjeong-classroom-20260923.web.app/", "desc": "대한민국 임시정부의 주요 활동을 역사 RPG로 탐험하고, 사료를 근거로 배운 내용을 정리합니다.", "category": "역사 게임", "icon": "landmark"},
  {"title": "임시정부 : 새로운 나라를 향해", "url": "https://imjeong-rpg2-20260924.web.app/", "desc": "기록관이 되어 걷는 1인칭 3D 역사 RPG. 새 나라의 제도를 배우고 감사의 편지를 남깁니다.", "category": "역사 게임", "icon": "compass"},
  {"title": "냉전의 목격자", "url": "https://cold-war-witness.web.app/", "desc": "냉전 속 시민의 선택을 탐구하며 프라이버시·공정성 등 오늘의 AI 윤리를 연결하는 6차시 프로젝트", "category": "의사결정", "icon": "eye"},
  {"title": "1920 봉오동, 그날의 현장으로", "url": "https://bongodong-1920-dongssam.web.app/", "desc": "봉오동 전투의 현장을 배경으로 독립군의 이야기를 탐험하는 역사 학습 게임", "category": "역사 게임", "icon": "mountain"},
  {"title": "바로 써먹는 바이브코딩 첫 걸음 [기초편]", "url": "https://vibe-coding-dongssam.web.app/", "desc": "수업용 웹앱 만들기부터 Firebase 배포·QR 공유까지, 처음 시작하는 교사를 위한 60분 실습 워크북", "category": "교원 연수", "icon": "code-xml"},
  {"title": "역사 바이브코딩 웹앱 워크숍 학습지 관리자 페이지", "url": "https://vibecoding-dongssam.web.app/admin.html", "desc": "역사 바이브코딩 웹앱 워크숍 학습지의 관리자용 페이지입니다.", "category": "교원 연수", "icon": "clipboard-list"},
  {"title": "역사 바이브코딩 웹앱 워크숍 학습지 관리자 연수 수강생 실습 페이지", "url": "https://vibecoding-dongssam.web.app/", "desc": "역사 바이브코딩 웹앱 워크숍에 참여하는 연수 수강생을 위한 학습지 실습 페이지입니다.", "category": "교원 연수", "icon": "notebook-pen"},
  {"title": "바이브코딩 실습 프롬프트 모음", "url": "https://sore-quicksand-061.notion.site/3bfc62e931b5806a947cdae904d3700c", "desc": "Canva AI, Codex, Claude Code 실습에 바로 복사해 쓰는 제작·수정·디자인 프롬프트와 수업 예제 모음", "category": "교원 연수", "icon": "file-text", "openLabel": "노션 프롬프트 보기"},
  {"title": "번동중 퇴마록", "url": "https://bundong-3d-dongssam.web.app/", "desc": "번동중학교를 배경으로 펼쳐지는 3D 퇴마 어드벤처 게임", "category": "역사 게임", "icon": "ghost"},
  {"title": "철의 결전: 해방의 균열", "url": "https://iron-resolve-1932.web.app/", "desc": "독립운동가 콘셉트의 주인공으로 웨이브 전투를 즐기는 가상 설정의 1인칭 FPS 게임", "category": "역사 게임", "icon": "crosshair"}
];
