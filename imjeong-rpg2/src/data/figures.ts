import type { Figure } from '../types';

/**
 * 등장인물 사전 — 대한민국 임시정부(1919~1945)의 실존 인물.
 *
 * 1탄 『임시정부 1919-1945』의 인물 사전을 그대로 이어받았다 (차림새 고증 포함).
 * 2탄에서 바꾼 것은 플레이어(오늘의 학생)와 가상 인물인 해설사뿐이다.
 *
 * ⚠ 작성 원칙
 *  - 생몰년·직책·업적은 국가보훈부 공훈전자사료관, 국사편찬위원회 『대한민국임시정부자료집』,
 *    한국민족문화대백과사전 표기를 따른다. 이설이 있으면 sourceNote 에 적는다.
 *  - 공과(功過)가 갈리는 인물은 미화하지 않고 사실대로 쓴다. 역사 수업 자료이기 때문이다.
 *  - bonus 는 그 인물이 임정에서 실제로 맡았던 역할을 게임 수치로 옮긴 것이다.
 */
export const figures: Record<string, Figure> = {
  /* ─────────────── 플레이어 ─────────────── */
  player: {
    id: 'player',
    name: '나 (견습 기록관)',
    role: '플레이어 — 시간을 건너간 오늘의 중학생 · 임시정부 견습 기록관',
    track: 'law',
    accent: '#d8c9a3',
    appearance: {
      garment: 'student',
      coat: '#2f3a4a',
      trim: '#e9e2d1',
      lower: '#2f3a4a',
      hair: 'cropped',
      facialHair: 'none',
      glasses: false,
      headwear: 'none',
      age: 'young',
      holding: 'book',
      note: '플레이어는 가상 인물이다. 오늘의 학생이 기록관의 수첩을 들고 1919년으로 건너간 설정이라 목깃 학생복으로 두었다.',
    },
    inTextbook: false,
    recruitable: false,
    bio: {
      middle:
        '바로 여러분이에요. 보훈의 전당에서 낡은 기록 수첩을 펼쳤다가 1919년 상하이로 건너가, 임시정부의 견습 기록관이 되었습니다. 새 나라가 어떻게 세워지고 꾸려졌는지 두 눈으로 보고 기록하는 것이 임무예요.',
      high:
        '플레이어가 맡는 가상의 인물이다. 오늘의 학생이 임시정부의 견습 기록관이 되어 1919년 수립부터 1948년 정부 수립까지 새 나라의 제도가 만들어지는 현장을 기록한다. 특정 실존 인물이 아니다.',
    },
    sourceNote: '플레이어는 가상 인물이다. 시간 여행은 학습을 위한 극적 장치다.',
  },

  /* ─────────────── 오늘의 안내자 (가상 인물) ─────────────── */
  docent: {
    id: 'docent',
    name: '해설사 선생님',
    role: '보훈의 전당 해설사 (가상 인물)',
    track: 'unity',
    accent: '#9fb6c9',
    appearance: {
      garment: 'suit',
      coat: '#4a5566',
      trim: '#f1ece1',
      lower: '#3a4250',
      hair: 'bob',
      facialHair: 'none',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      holding: 'book',
      note: '가상 인물이다. 오늘날 기념관 해설사의 단정한 정장 차림으로 두었다.',
    },
    inTextbook: false,
    recruitable: false,
    bio: {
      middle:
        '보훈의 전당에서 여러분을 맞이하는 해설사 선생님이에요. 여행을 떠나기 전과 돌아온 뒤에 이야기를 나눕니다.',
      high: '게임의 처음과 끝을 안내하는 가상의 해설사다. 오늘의 관점에서 임시정부의 유산과 보훈의 의미를 설명한다.',
    },
    sourceNote: '가상 인물이다.',
  },

  /* ─────────────── 보훈의 전당 — 무명의 협력자들 (특정 인물 아님) ─────────────── */
  unnamed: {
    id: 'unnamed',
    name: '이름을 남기지 못한 분들',
    role: '연통제·교통국 요원, 성금을 보낸 동포, 정부와 함께 걸은 가족들',
    track: 'unity',
    accent: '#c9a24b',
    appearance: {
      garment: 'durumagi',
      coat: '#e4dcc8',
      trim: '#ffffff',
      lower: '#d8cfb8',
      hair: 'cropped',
      facialHair: 'none',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '특정 인물이 아니므로 초상을 그리지 않고 태극 문양으로 대신한다.',
    },
    inTextbook: false,
    recruitable: false,
    bio: {
      middle:
        '임시정부는 이름난 몇 사람만으로 지켜진 것이 아니에요. 목숨 걸고 연통제 문서를 나른 사람, 끼니를 줄여 성금을 보낸 동포, 8년 동안 정부와 함께 짐을 지고 걸은 가족과 아이들이 있었어요. 그분들 대부분은 이름이 기록에 남지 않았어요.',
      high:
        '임시정부의 유지는 연통제·교통국의 비밀 요원, 애국금·인구세·독립공채를 부담한 국내외 동포, 이동기를 함께한 가족 공동체 등 무수한 무명 협력자에 기대었다. 오늘날에도 국가보훈부는 포상받지 못한 독립운동가를 발굴·심사하고 있다.',
    },
    sourceNote: '특정 개인이 아니다. 무명 독립운동가 발굴에 관해서는 국가보훈부 안내를 참고.',
  },

  /* ─────────────── 지도부 ─────────────── */
  kimgu: {
    id: 'kimgu',
    name: '김구',
    hanja: '金九',
    life: '1876~1949',
    role: '경무국장 → 내무총장 → 주석 · 호 백범(白凡)',
    track: 'military',
    accent: '#c9a24b',
    appearance: {
      garment: 'durumagi',
      coat: '#e9e2d1',
      trim: '#ffffff',
      lower: '#ddd4bf',
      hair: 'cropped',
      facialHair: 'none',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      note: '널리 알려진 사진에서 흰 두루마기에 둥근 테 안경, 짧게 깎은 머리로 확인된다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 4, unity: 5 },
    bio: {
      middle:
        '임시정부 초기에는 청사를 지키는 경무국장이었고, 나중에는 임시정부를 이끄는 주석이 되었어요. 한인애국단을 만들어 의열 투쟁을 이끌었고, 한국광복군을 세우는 데 앞장섰습니다.',
      high:
        '1919년 상하이 임시정부 초대 경무국장으로 출발해 내무총장을 거쳐 1940년 주석에 올랐다. 1931년 한인애국단을 조직해 이봉창·윤봉길 의거를 이끌었고, 1940년 한국광복군 창설을 주도했다. 회고록 『백범일지』를 남겼다.',
    },
    sourceNote:
      '국가보훈부 공훈전자사료관 및 김구, 『백범일지』(도진순 주해본, 돌베개, 1997) 기준.',
  },
  leeseungman: {
    id: 'leeseungman',
    name: '이승만',
    hanja: '李承晩',
    life: '1875~1965',
    role: '초대 임시대통령(1919. 9.~1925. 3.) · 구미위원부 위원장',
    track: 'diplomacy',
    accent: '#7b8fa6',
    appearance: {
      garment: 'suit',
      coat: '#39404a',
      trim: '#f1ece1',
      lower: '#39404a',
      hair: 'parted',
      facialHair: 'none',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      note: '양복에 둥근 테 안경을 쓴 사진이 널리 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { prestige: 6, funds: 400, unity: -6 },
    bio: {
      middle:
        '미국에서 활동하며 임시정부의 첫 대통령이 되었어요. 워싱턴에 구미위원부를 두고 미국을 상대로 외교를 펼쳤지만, 상하이에 거의 오지 않고 국제연맹 위임통치를 청원한 일 때문에 크게 다투다 1925년 탄핵되어 물러났습니다.',
      high:
        '1919년 9월 통합 임시정부의 임시대통령에 추대되었다. 워싱턴 D.C.에 구미위원부를 설치해 구미 외교와 독립공채 모금을 주관했으나, 상하이에 상주하지 않았고 1919년 국제연맹 위임통치 청원이 문제가 되어 이동휘·신채호 등과 대립했다. 1925년 3월 임시의정원에서 탄핵·면직되었다.',
    },
    sourceNote:
      '탄핵 시점은 1925년 3월 임시의정원 결의(국사편찬위원회, 『대한민국임시정부자료집』). 위임통치 청원(1919)은 1920년대 내내 임정 내부 갈등의 핵심 쟁점이었다.',
  },
  leedonghwi: {
    id: 'leedonghwi',
    name: '이동휘',
    hanja: '李東輝',
    life: '1873~1935',
    role: '초대 국무총리(1919~1921) · 한인사회당',
    track: 'unity',
    accent: '#8c6f9e',
    appearance: {
      garment: 'durumagi',
      coat: '#5d5648',
      trim: '#ffffff',
      lower: '#4a4438',
      hair: 'cropped',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '대한제국 무관 출신이나 임정 시기 사진은 한복 두루마기 차림이 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 3, funds: 300, unity: -4 },
    bio: {
      middle:
        '대한제국 군인 출신 독립운동가로, 통합 임시정부의 첫 국무총리였어요. 무장 투쟁을 주장했고 소련에서 자금을 얻으려 했는데, 그 자금 문제로 갈등이 커지자 1921년 임시정부를 떠났습니다.',
      high:
        '대한제국 무관 출신으로 한인사회당을 조직했고, 1919년 통합 임시정부 초대 국무총리에 취임했다. 외교 노선보다 무장 투쟁을 강조했으며 소비에트 러시아의 지원 자금(이른바 모스크바 자금) 처리를 둘러싼 갈등 끝에 1921년 국무총리직에서 물러났다.',
    },
    sourceNote:
      '한국민족문화대백과사전 「이동휘」 항목. 모스크바 자금 문제는 사용처를 둘러싼 논란이 있으며 연구자마다 평가가 갈린다.',
  },
  ahnchangho: {
    id: 'ahnchangho',
    name: '안창호',
    hanja: '安昌浩',
    life: '1878~1938',
    role: '내무총장 겸 국무총리 대리 · 흥사단',
    track: 'unity',
    accent: '#5f8f7a',
    appearance: {
      garment: 'suit',
      coat: '#4e5157',
      trim: '#f1ece1',
      lower: '#4e5157',
      hair: 'parted',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '양복에 가르마를 타고 콧수염을 기른 사진이 널리 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { agents: 4, unity: 8 },
    bio: {
      middle:
        '임시정부 초기의 살림을 실제로 꾸린 사람이에요. 국내와 연락하는 비밀 조직인 연통제와 교통국을 만들고, 흩어진 독립운동 세력을 하나로 모으려고 애썼습니다.',
      high:
        '1919년 상하이에 와 내무총장 겸 국무총리 대리로 임시정부의 초기 체제를 정비했다. 국내 통치·연락망인 연통제(聯通制)와 교통국(交通局) 수립을 주도했고, 1923년 국민대표회의에서는 개조파의 중심에 서서 임정 개편을 통한 통합을 주장했다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「안창호」 및 한국민족문화대백과사전 「연통제」 항목.',
  },
  leedongnyeong: {
    id: 'leedongnyeong',
    name: '이동녕',
    hanja: '李東寧',
    life: '1869~1940',
    role: '임시의정원 초대 의장 · 국무령 · 주석',
    track: 'unity',
    accent: '#8a8471',
    appearance: {
      garment: 'durumagi',
      coat: '#e6dcc6',
      trim: '#ffffff',
      lower: '#d6ccb4',
      hair: 'cropped',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'old',
      holding: 'cane',
      note: '한복 두루마기 차림의 노년 사진이 남아 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { unity: 7 },
    bio: {
      middle:
        '1919년 임시의정원의 첫 의장으로서 나라 이름을 「대한민국」으로 정하는 회의를 이끌었어요. 임시정부가 가장 어렵던 시기에도 끝까지 자리를 지켰고, 광복을 보지 못한 채 1940년 세상을 떠났습니다.',
      high:
        '1919년 4월 임시의정원 초대 의장으로 국호·임시헌장 제정을 주재했다. 이후 국무령·주석을 여러 차례 맡아 임정의 구심점 역할을 했다. 1940년 3월 중국 치장(綦江)에서 병으로 서거해 광복을 보지 못했다.',
    },
    sourceNote:
      '서거 시점(1940년 3월, 치장)은 국가보훈부 공훈록 기준. 유해는 1948년 국내로 봉환되었다.',
  },

  /* ─────────────── 외교 ─────────────── */
  kimgyusik: {
    id: 'kimgyusik',
    name: '김규식',
    hanja: '金奎植',
    life: '1881~1950',
    role: '파리강화회의 대표 · 외무총장 · 부주석(1944)',
    track: 'diplomacy',
    accent: '#4f7fa8',
    appearance: {
      garment: 'suit',
      coat: '#39404a',
      trim: '#f1ece1',
      lower: '#39404a',
      hair: 'parted',
      facialHair: 'none',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      holding: 'briefcase',
      note: '서구 언어에 능한 학자·외교가로, 양복에 안경을 쓴 사진이 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { prestige: 9 },
    bio: {
      middle:
        '영어를 아주 잘하는 학자였어요. 1919년 파리강화회의에 한국 대표로 가서 독립을 호소했습니다. 회의장에 들어가지는 못했지만, 한국 문제를 세계에 알리는 문서를 냈어요.',
      high:
        '신한청년당 대표로 1919년 파리강화회의에 파견되어 파리위원부를 설치하고 「한국 독립 항고서」 등을 제출했다. 한국은 연합국의 일원이 아니었고 일본은 승전국이었으므로 공식 의제로 채택되지 못했다. 이후 임시정부 외무총장을 거쳐 1944년 부주석이 되었다.',
    },
    sourceNote:
      '파리 파견은 신한청년당 대표 자격으로 출발해 이후 임시정부 대표로 추인되었다. 제출 문서의 명칭은 자료마다 「독립공고서」·「한국민족의 주장」 등으로 달리 옮겨진다.',
  },
  singyusik: {
    id: 'singyusik',
    name: '신규식',
    hanja: '申圭植',
    life: '1879~1922',
    role: '법무총장 · 외무총장 겸 국무총리 대리',
    track: 'diplomacy',
    accent: '#6b93a8',
    appearance: {
      garment: 'suit',
      coat: '#4e5157',
      trim: '#f1ece1',
      lower: '#4e5157',
      hair: 'parted',
      facialHair: 'mustache',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      note: '호 예관(睨觀)은 눈병으로 한쪽 눈이 불편해진 데서 유래한 것으로 전한다. 사진에서 안경 차림.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { prestige: 6, unity: 3 },
    bio: {
      middle:
        '상하이에서 중국 혁명가들과 오래 사귄 덕분에 중국과의 외교를 맡았어요. 1921년 광저우로 가서 쑨원의 정부로부터 임시정부를 인정한다는 답을 얻어 냈습니다.',
      high:
        '신해혁명 시기부터 중국 혁명 세력과 교류한 인물로, 1921년 국무총리 대리 겸 외무총장 자격으로 광저우의 쑨원 호법정부를 방문해 임시정부 승인과 지원에 관한 교섭을 벌였다. 1922년 임정 내분 속에 단식 끝에 서거했다.',
    },
    sourceNote:
      '광둥 호법정부의 승인은 정식 국가 승인이 아니라 사실상의 승인·우호 표명으로 평가된다. 승인 조건의 항목 수는 자료에 따라 다르게 전해진다.',
  },
  jochoang: {
    id: 'jochoang',
    name: '조소앙',
    hanja: '趙素昻',
    life: '1887~1958',
    role: '외무부장 · 「대한민국 건국강령」 기초',
    track: 'propaganda',
    accent: '#a8804f',
    appearance: {
      garment: 'suit',
      coat: '#4a4238',
      trim: '#f1ece1',
      lower: '#4a4238',
      hair: 'parted',
      facialHair: 'none',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      holding: 'scroll',
      note: '문안을 짓는 일을 맡은 이론가로, 양복에 안경을 쓴 사진이 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { prestige: 5, unity: 6 },
    bio: {
      middle:
        '임시정부의 생각을 글로 정리한 사람이에요. 정치·경제·교육을 고르게 나누자는 「삼균주의」를 만들었고, 광복 뒤 세울 나라의 설계도인 「건국강령」을 썼습니다.',
      high:
        '1919년 대한민국 임시헌장 기초에 참여했고, 정치·경제·교육의 균등을 뜻하는 삼균주의(三均主義)를 정립했다. 1941년 11월 임시정부가 발표한 「대한민국 건국강령」의 기초자이며, 외무부장으로 대일 선전 성명서에 김구와 함께 이름을 올렸다.',
    },
    sourceNote: '「대한민국 건국강령」은 1941년 11월 임시정부 국무위원회에서 채택·발표되었다.',
  },
  parkchanik: {
    id: 'parkchanik',
    name: '박찬익',
    hanja: '朴贊翊',
    life: '1884~1949',
    role: '중국 국민정부 교섭 담당 · 법무부장',
    track: 'diplomacy',
    accent: '#9a7b5a',
    appearance: {
      garment: 'suit',
      coat: '#4a4238',
      trim: '#f1ece1',
      lower: '#4a4238',
      hair: 'parted',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '중국 국민당 인사들과 교섭한 실무자로 양복 차림 사진이 남아 있다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { prestige: 4, funds: 500 },
    bio: {
      middle:
        '중국말을 잘해서 중국 정부와 이야기하는 일을 맡았어요. 윤봉길 의거 뒤 중국이 임시정부를 돕게 되는 과정에서 다리 역할을 했습니다.',
      high:
        '중국 국민당 인사들과 오랜 교분을 바탕으로 임시정부의 대중국 교섭 실무를 담당했다. 1932년 윤봉길 의거 이후 중국 국민정부의 임정 지원과 한인 청년 군사 훈련(뤄양군관학교 한인특별반 등)을 이끌어 내는 교섭에 관여했다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「박찬익」 항목.',
  },
  yeounhyeong: {
    id: 'yeounhyeong',
    name: '여운형',
    hanja: '呂運亨',
    life: '1886~1947',
    role: '신한청년당 · 임시의정원 의원 · 외무부 차장',
    track: 'diplomacy',
    accent: '#6f9e8c',
    appearance: {
      garment: 'suit',
      coat: '#39404a',
      trim: '#f1ece1',
      lower: '#39404a',
      hair: 'sleek',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '풍채가 좋고 머리를 뒤로 넘긴 양복 차림 사진이 널리 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { prestige: 5, agents: 2 },
    bio: {
      middle:
        '신한청년당을 만들어 김규식을 파리로 보낸 사람이에요. 임시정부가 세워지는 데 큰 역할을 했고, 1919년에는 일본 도쿄에 가서 일본 관리들 앞에서 조선 독립을 당당히 주장했습니다.',
      high:
        '1918년 상하이에서 신한청년당을 조직해 김규식의 파리 파견과 국내 3·1운동 연계를 추진했다. 임시의정원 의원·외무부 차장을 지냈으며, 1919년 11월 일본 정부 초청으로 도쿄에 가 제국호텔 등에서 조선 독립의 정당성을 공개 연설했다.',
    },
    sourceNote:
      '도쿄 방문(1919년 11월)은 일본 측이 회유를 목적으로 초청했으나 여운형이 독립 주장을 펴 역효과를 낸 사건으로 평가된다.',
  },

  /* ─────────────── 자금 ─────────────── */
  jeongjeonghwa: {
    id: 'jeongjeonghwa',
    name: '정정화',
    hanja: '鄭靖和',
    life: '1900~1991',
    role: '임시정부 안살림 · 국내 연락 및 자금 운반',
    track: 'finance',
    accent: '#c07f8c',
    appearance: {
      garment: 'hanbok-woman',
      coat: '#f2ece0',
      trim: '#ffffff',
      lower: '#2b2b30',
      hair: 'bun',
      facialHair: 'none',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '흰 저고리에 어두운 치마, 쪽을 진 머리는 당시 기혼 여성의 일반적인 차림이다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { funds: 600, agents: 3, heat: -4 },
    bio: {
      middle:
        '스무 살 무렵 상하이로 건너가 임시정부의 살림을 도맡았어요. 위험을 무릅쓰고 국내에 여러 차례 몰래 들어가 독립운동 자금을 구해 왔습니다. 훗날 그 기록을 『장강일기』라는 책으로 남겼어요.',
      high:
        '1920년 상하이로 망명해 임시정부 요인들의 생활을 뒷바라지하며 국내를 여러 차례 왕래해 자금을 조달했다. 임시정부의 27년 여정을 기록한 회고록 『장강일기(長江日記)』를 남겨, 남성 중심으로 기록된 임정사의 빈자리를 메우는 중요한 사료로 평가된다.',
    },
    sourceNote:
      '정정화, 『장강일기』(학민사, 1998). 국내 잠입 횟수는 자료에 따라 여섯 차례 안팎으로 전해진다.',
  },
  anheeje: {
    id: 'anheeje',
    name: '안희제',
    hanja: '安熙濟',
    life: '1885~1943',
    role: '백산상회 설립자 · 국내 자금 통로',
    track: 'finance',
    accent: '#b08946',
    appearance: {
      garment: 'durumagi',
      coat: '#8d8676',
      trim: '#ffffff',
      lower: '#7d7767',
      hair: 'cropped',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '국내에서 상회를 경영한 실업가로 한복 두루마기 차림 사진이 알려져 있다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { funds: 900, heat: 5 },
    bio: {
      middle:
        '부산에서 백산상회라는 무역 회사를 운영했어요. 겉으로는 장사를 했지만 사실은 그 돈과 조직을 임시정부에 보내는 비밀 통로였습니다.',
      high:
        '부산에서 백산상회(白山商會)를 경영하며 무역업을 가장해 임시정부에 자금을 송금하고 연락망을 제공했다. 국내 자산가의 자금이 임정으로 흘러드는 주요 경로였으며, 일제의 감시로 경영난을 겪다 1928년 무렵 해산했다.',
    },
    sourceNote:
      '백산상회의 임정 자금 지원 규모는 비밀 활동의 성격상 정확한 액수가 확정되어 있지 않다.',
  },
  choejaehyeong: {
    id: 'choejaehyeong',
    name: '최재형',
    hanja: '崔在亨',
    life: '1860~1920',
    role: '임시정부 초대 재무총장(선임) · 연해주 한인 지도자',
    track: 'finance',
    accent: '#7d8b9c',
    appearance: {
      garment: 'suit',
      coat: '#3d4550',
      trim: '#f1ece1',
      lower: '#3d4550',
      hair: 'parted',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'old',
      note: '연해주에서 활동한 실업가로, 러시아식 정장 차림의 사진이 남아 있다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { funds: 800, agents: 2 },
    bio: {
      middle:
        '러시아 연해주에서 성공한 사업가로, 번 돈을 독립운동에 아낌없이 썼어요. 1919년 임시정부의 첫 재무총장으로 뽑혔지만 연해주를 떠날 수 없었고, 1920년 일본군에게 붙잡혀 목숨을 잃었습니다.',
      high:
        '연해주 한인 사회의 지도자이자 실업가로 항일 무장 세력을 후원했다. 1919년 4월 임시정부 초대 재무총장에 선임되었으나 연해주 현지 활동을 이유로 부임하지 않았다. 1920년 4월 일본군의 연해주 한인 습격(4월 참변) 때 체포되어 순국했다.',
    },
    sourceNote:
      '재무총장 선임은 1919년 4월 임시의정원 결의이나 실제 부임하지 않았다. 순국 시점은 1920년 4월 연해주 4월 참변 당시로 전해진다.',
  },
  leesiyeong: {
    id: 'leesiyeong',
    name: '이시영',
    hanja: '李始榮',
    life: '1868~1953',
    role: '법무총장 · 재무총장 · 국무위원',
    track: 'finance',
    accent: '#8d7f63',
    appearance: {
      garment: 'durumagi',
      coat: '#eae1cd',
      trim: '#ffffff',
      lower: '#dad1b9',
      hair: 'cropped',
      facialHair: 'long-beard',
      glasses: false,
      headwear: 'none',
      age: 'old',
      holding: 'cane',
      note: '노년의 한복 두루마기 차림 사진이 남아 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { funds: 400, unity: 4 },
    bio: {
      middle:
        '명문가 형제들과 함께 전 재산을 팔아 만주로 가서 독립군을 기르는 신흥무관학교를 세운 집안 사람이에요. 임시정부에서는 법무·재무를 맡아 끝까지 자리를 지켰습니다.',
      high:
        '형 이회영 등 6형제와 함께 전 재산을 처분해 만주로 망명, 신흥무관학교 설립에 참여했다. 임시정부에서 법무총장·재무총장·국무위원을 역임하며 수립부터 환국까지 임정을 지킨 몇 안 되는 인물이다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「이시영」 항목.',
  },

  /* ─────────────── 선전 ─────────────── */
  eomhangseop: {
    id: 'eomhangseop',
    name: '엄항섭',
    hanja: '嚴恒燮',
    life: '1898~1962',
    role: '선전부장 · 주석 판공실',
    track: 'propaganda',
    accent: '#a06a5a',
    appearance: {
      garment: 'suit',
      coat: '#4e5157',
      trim: '#f1ece1',
      lower: '#4e5157',
      hair: 'parted',
      facialHair: 'none',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '주석 판공실에서 문서를 맡은 실무자로 양복 차림이 알려져 있다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { prestige: 4, unity: 3 },
    bio: {
      middle:
        '임시정부의 소식을 글과 방송으로 알리는 일을 맡았어요. 윤봉길 의거가 임시정부의 계획이었다는 사실을 세계에 밝히는 발표문도 그의 손을 거쳤습니다.',
      high:
        '임시정부 선전부장으로 대외 선전·문서 작성을 담당했고, 김구의 비서 역할을 오래 수행했다. 1932년 훙커우 의거 직후 김구 명의의 「홍구공원 작탄 사건 진상」 발표 등 임정의 대외 공표 실무를 맡았다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「엄항섭」 항목.',
  },
  chariseok: {
    id: 'chariseok',
    name: '차리석',
    hanja: '車利錫',
    life: '1881~1945',
    role: '임시정부 비서장 · 『독립신문』 기자',
    track: 'propaganda',
    accent: '#8e8574',
    appearance: {
      garment: 'durumagi',
      coat: '#5d5648',
      trim: '#ffffff',
      lower: '#4d4639',
      hair: 'cropped',
      facialHair: 'mustache',
      glasses: true,
      headwear: 'none',
      age: 'old',
      note: '비서장으로 문서를 관리한 인물로, 한복 차림에 안경을 쓴 사진이 알려져 있다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { unity: 5, agents: 2 },
    bio: {
      middle:
        '임시정부의 문서를 정리하고 지키는 비서장이었어요. 임시정부가 가장 힘들 때도 조직을 유지하는 데 힘썼고, 광복을 맞은 해에 충칭에서 세상을 떠났습니다.',
      high:
        '『독립신문』 기자로 출발해 임시정부 비서장을 오래 맡아 조직과 문서를 관리했다. 1930년대 임정의 침체기에도 조직 유지에 힘썼으며, 1945년 9월 충칭에서 환국을 준비하던 중 병사했다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「차리석」 항목.',
  },
  parkeunsik: {
    id: 'parkeunsik',
    name: '박은식',
    hanja: '朴殷植',
    life: '1859~1925',
    role: '제2대 임시대통령 · 『한국독립운동지혈사』 저자',
    track: 'propaganda',
    accent: '#9c8f76',
    appearance: {
      garment: 'durumagi',
      coat: '#ece4d2',
      trim: '#ffffff',
      lower: '#dcd3bc',
      hair: 'topknot',
      facialHair: 'long-beard',
      glasses: false,
      headwear: 'tanggeon',
      age: 'old',
      holding: 'book',
      note: '유학자 출신 역사가로, 한복에 긴 수염을 기른 노년의 모습이 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { prestige: 4, unity: 5 },
    bio: {
      middle:
        '역사학자이자 언론인이에요. 우리 민족이 어떻게 싸워 왔는지를 『한국독립운동지혈사』라는 책으로 남겼고, 이승만이 물러난 뒤 임시정부의 두 번째 대통령이 되었습니다.',
      high:
        '『한국통사』·『한국독립운동지혈사』를 저술해 일제의 침략과 한국인의 저항을 기록한 역사가다. 1925년 3월 이승만 탄핵 직후 제2대 임시대통령에 선출되어 대통령제를 국무령제로 바꾸는 개헌을 마무리하고 그해 11월 서거했다.',
    },
    sourceNote:
      '박은식, 『한국독립운동지혈사』(1920, 상하이). 재임 기간은 1925년 3월~9월(사임)이며 같은 해 11월 서거했다.',
  },
  sinchaeho: {
    id: 'sinchaeho',
    name: '신채호',
    hanja: '申采浩',
    life: '1880~1936',
    role: '임시의정원 의원 · 창조파 · 「조선혁명선언」 집필',
    track: 'unity',
    accent: '#7a6b8a',
    appearance: {
      garment: 'durumagi',
      coat: '#6a6354',
      trim: '#ffffff',
      lower: '#5a5446',
      hair: 'cropped',
      facialHair: 'mustache',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      note: '마른 체구에 안경을 쓴 사진이 널리 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 3, unity: -5, prestige: 2 },
    bio: {
      middle:
        '역사학자이면서 아주 강경한 독립운동가였어요. 외교로는 독립을 못 얻는다고 보고, 임시정부를 아예 새로 만들자고 주장했습니다. 의열단을 위해 「조선혁명선언」을 썼어요.',
      high:
        '임시의정원 의원으로 출발했으나 이승만의 위임통치 청원에 반발해 임정과 결별했다. 1923년 국민대표회의에서 임시정부를 해체하고 새 조직을 세우자는 창조파를 이끌었다. 같은 해 의열단의 요청으로 민중 직접 혁명을 주장한 「조선혁명선언」을 집필했다.',
    },
    sourceNote:
      '신채호, 「조선혁명선언」(1923, 의열단). 국민대표회의에서 창조파·개조파의 대립은 결국 합의에 이르지 못했다.',
  },
  leegwangsu: {
    id: 'leegwangsu',
    name: '이광수',
    hanja: '李光洙',
    life: '1892~1950',
    role: '『독립신문』 초대 사장 · 이후 친일 변절',
    track: 'propaganda',
    accent: '#8a8a8a',
    appearance: {
      garment: 'suit',
      coat: '#55585e',
      trim: '#f1ece1',
      lower: '#55585e',
      hair: 'parted',
      facialHair: 'none',
      glasses: true,
      headwear: 'none',
      age: 'middle',
      note: '문인으로 양복에 안경을 쓴 사진이 알려져 있다.',
    },
    inTextbook: true,
    recruitable: false,
    bio: {
      middle:
        '1919년 임시정부의 신문인 『독립신문』을 처음 맡아 만들었어요. 하지만 1921년 국내로 돌아간 뒤에는 일제에 협력하는 글을 쓰며 변절했습니다. 잘한 일과 잘못한 일을 함께 기억해야 하는 인물이에요.',
      high:
        '1919년 상하이에서 임시정부 기관지 『독립신문』의 초대 사장 겸 주필을 맡아 독립운동 여론을 이끌었다. 그러나 1921년 귀국한 뒤 일제에 협력하는 글과 활동을 이어가 친일 반민족행위자로 규정되었다. 공과를 분리해 사실대로 기억해야 할 인물이다.',
    },
    sourceNote:
      '『독립신문』 창간(1919년 8월 21일, 상하이) 초대 사장. 친일 행적은 「친일반민족행위진상규명 보고서」(2009)에 정리되어 있다. 이 게임에서는 동지로 영입할 수 없게 두었다.',
  },

  hwanggihwan: {
    id: 'hwanggihwan',
    name: '황기환',
    hanja: '黃玘煥',
    life: '미상~1923',
    role: '파리위원부 서기장 · 런던 주재 외교원',
    track: 'diplomacy',
    accent: '#5d84a6',
    appearance: {
      garment: 'suit',
      coat: '#39404a',
      trim: '#f1ece1',
      lower: '#39404a',
      hair: 'parted',
      facialHair: 'none',
      glasses: false,
      headwear: 'none',
      age: 'young',
      note: '미국 유학 중 제1차 세계대전에 종군했고, 양복 차림의 사진이 남아 있다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { prestige: 5, agents: 2 },
    bio: {
      middle:
        '미국에서 공부하고 제1차 세계대전에 미군으로 참전했던 사람이에요. 파리위원부에서 김규식을 도와 유럽 여러 나라에 한국의 사정을 알리는 글을 만들어 뿌렸습니다.',
      high:
        '미국 유학 중 제1차 세계대전에 미군으로 종군했고, 1919년 파리위원부 서기장으로 합류해 선전 책자 『La Corée Libre(자유한국)』 발간 등 대유럽 선전 실무를 이끌었다. 이후 런던·미국에서 외교 활동을 이어가다 1923년 뉴욕에서 병사했다.',
    },
    sourceNote:
      '국가보훈부 공훈전자사료관 「황기환」 항목. 생년은 확인되지 않았고, 유해는 2023년 국내로 봉환되었다.',
  },
  seojaepil: {
    id: 'seojaepil',
    name: '서재필',
    hanja: '徐載弼',
    life: '1864~1951',
    role: '필라델피아 한인자유대회 주도 · 한국통신부 운영',
    track: 'propaganda',
    accent: '#7f93a8',
    appearance: {
      garment: 'suit',
      coat: '#4e5157',
      trim: '#f1ece1',
      lower: '#4e5157',
      hair: 'parted',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'none',
      age: 'old',
      note: '미국에 정착한 의사·언론인으로 양복에 콧수염을 기른 사진이 널리 알려져 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { prestige: 6, funds: 300 },
    bio: {
      middle:
        '『독립신문』을 만들고 독립협회를 이끌었던 사람이에요. 3·1운동 뒤에는 미국 필라델피아에서 한인 대회를 열어 미국 사람들에게 한국의 독립을 알렸습니다.',
      high:
        '갑신정변 이후 미국에 정착한 의사이자 언론인으로, 1919년 4월 필라델피아에서 제1차 한인회의(한인자유대회)를 주도하고 한국통신부(Korean Information Bureau)와 영문 잡지를 통해 대미 여론 활동을 폈다. 구미위원부의 활동을 뒷받침했다.',
    },
    sourceNote:
      '필라델피아 한인회의는 1919년 4월 14~16일 개최되었다. 서재필은 임시정부의 정식 각료는 아니었고 미주 선전·외교를 지원했다.',
  },
  chupucheng: {
    id: 'chupucheng',
    name: '추푸청',
    hanja: '褚輔成',
    life: '1873~1948',
    role: '중국 저장성 인사 · 김구 피신 주선',
    track: 'diplomacy',
    accent: '#94836a',
    appearance: {
      garment: 'changshan',
      coat: '#4b5661',
      trim: '#3c4650',
      lower: '#4b5661',
      hair: 'parted',
      facialHair: 'mustache',
      glasses: true,
      headwear: 'none',
      age: 'old',
      note: '중국 저장성의 정치인으로, 당시 중국 인사들이 입던 장삼(長衫) 차림으로 표현했다.',
    },
    inTextbook: false,
    recruitable: false,
    bio: {
      middle:
        '중국의 정치인이에요. 윤봉길 의거 뒤 일본 경찰에게 쫓기던 김구를 자기 고향인 자싱에 숨겨 주었습니다. 한국의 독립운동을 도운 중국인 가운데 한 사람이에요.',
      high:
        '중국 저장성 출신의 정치인으로, 1932년 훙커우 의거 이후 일제의 추적을 받던 김구가 자싱(嘉興)·하이옌(海鹽) 일대에 은신할 수 있도록 주선했다. 임시정부의 이동기를 도운 중국 측 인사를 대표하는 인물이다.',
    },
    sourceNote:
      '김구, 『백범일지』의 자싱 피신 기록 및 중국 측 기록에 근거한다. 은신 경위의 세부는 자료마다 조금씩 다르다.',
  },

  /* ─────────────── 군사 · 의열 ─────────────── */
  yunbonggil: {
    id: 'yunbonggil',
    name: '윤봉길',
    hanja: '尹奉吉',
    life: '1908~1932',
    role: '한인애국단 단원 · 훙커우 공원 의거',
    track: 'military',
    accent: '#b5452f',
    appearance: {
      garment: 'suit',
      coat: '#3f434a',
      trim: '#f1ece1',
      lower: '#3f434a',
      hair: 'parted',
      facialHair: 'none',
      glasses: false,
      headwear: 'none',
      age: 'young',
      note: '의거 당시 양복 차림이었던 것으로 전한다. 젊은 청년의 모습으로 표현했다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 5, prestige: 10, heat: 25 },
    bio: {
      middle:
        '충청도에서 농민 계몽 운동을 하다 중국으로 건너와 한인애국단에 들어갔어요. 1932년 4월 29일 상하이 훙커우 공원에서 일본군 수뇌부를 향해 폭탄을 던졌고, 그 일로 중국이 임시정부를 돕기 시작했습니다.',
      high:
        '충남 예산에서 농촌 계몽 운동을 하다 1930년 중국으로 망명, 한인애국단에 가입했다. 1932년 4월 29일 상하이 훙커우 공원(虹口公園)에서 열린 일왕 생일(천장절) 겸 상하이 점령 축하식 단상에 폭탄을 던져 시라카와 요시노리 대장 등을 사상케 했다. 현장에서 체포되어 같은 해 12월 일본 가나자와에서 순국했다.',
    },
    sourceNote:
      '의거일 1932년 4월 29일. 시라카와 요시노리(白川義則) 상하이 파견군 사령관은 부상 후 5월 사망했고, 주중공사 시게미쓰 마모루는 중상으로 한쪽 다리를 잃었다. 순국일은 1932년 12월 19일(일본 이시카와현 가나자와)로 전해진다.',
  },
  leebongchang: {
    id: 'leebongchang',
    name: '이봉창',
    hanja: '李奉昌',
    life: '1900~1932',
    role: '한인애국단 제1호 단원 · 도쿄 의거',
    track: 'military',
    accent: '#a85a4a',
    appearance: {
      garment: 'suit',
      coat: '#4a4238',
      trim: '#f1ece1',
      lower: '#4a4238',
      hair: 'parted',
      facialHair: 'none',
      glasses: false,
      headwear: 'fedora',
      age: 'young',
      note: '양복에 중절모를 쓴 사진이 남아 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 3, prestige: 6, heat: 18 },
    bio: {
      middle:
        '한인애국단의 첫 번째 단원이에요. 1932년 1월 8일 일본 도쿄에서 일왕의 행렬에 수류탄을 던졌습니다. 일왕을 맞히지는 못했지만, 일본 한복판에서 일어난 일이라 세계가 크게 놀랐어요.',
      high:
        '1931년 한인애국단 제1호 단원으로 가입했다. 1932년 1월 8일 도쿄 사쿠라다문(櫻田門) 부근에서 관병식을 마치고 돌아가던 일왕 히로히토의 행렬에 수류탄을 던졌다. 일왕은 무사했으나 일본 본토 한복판에서 벌어진 의거로 국제적 파장이 컸고, 중국 신문의 보도 논조가 상하이사변의 한 빌미가 되기도 했다. 같은 해 10월 순국했다.',
    },
    sourceNote:
      '의거일 1932년 1월 8일, 장소는 도쿄 사쿠라다문 밖. 순국일은 1932년 10월 10일(도쿄 이치가야 형무소)로 전해진다.',
  },
  jicheongcheon: {
    id: 'jicheongcheon',
    name: '지청천',
    hanja: '池靑天',
    life: '1888~1957',
    role: '한국광복군 총사령 (이청천으로도 불림)',
    track: 'military',
    accent: '#8a9a5b',
    appearance: {
      garment: 'uniform',
      coat: '#6f7450',
      trim: '#4c5137',
      lower: '#6f7450',
      hair: 'cropped',
      facialHair: 'mustache',
      glasses: false,
      headwear: 'military-cap',
      age: 'middle',
      note: '한국광복군 총사령으로 군복과 군모 차림의 사진이 남아 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 10, unity: 3 },
    bio: {
      middle:
        '만주에서 독립군을 이끈 군인 출신이에요. 1940년 한국광복군이 만들어질 때 총사령관이 되어 광복군을 실제로 지휘했습니다.',
      high:
        '일본 육군사관학교를 졸업했으나 만주로 망명해 신흥무관학교 교관, 대한독립군단·한국독립군을 지휘했다. 1940년 9월 한국광복군 총사령에 취임해 광복군을 통솔했다. 이청천(李靑天)이라는 이름으로도 널리 알려져 있다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「지청천」 항목. 본명은 지대형(池大亨).',
  },
  ibeomseok: {
    id: 'ibeomseok',
    name: '이범석',
    hanja: '李範奭',
    life: '1900~1972',
    role: '한국광복군 참모장 · 제2지대장 · 국내정진군 지휘',
    track: 'military',
    accent: '#a15c3e',
    appearance: {
      garment: 'uniform',
      coat: '#727753',
      trim: '#4c5137',
      lower: '#727753',
      hair: 'cropped',
      facialHair: 'none',
      glasses: false,
      headwear: 'military-cap',
      age: 'middle',
      note: '광복군 참모장·제2지대장으로 군복 차림의 사진이 남아 있다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 8 },
    bio: {
      middle:
        '청산리 전투에도 참여했던 군인이에요. 광복군 참모장을 맡았고, 1945년에는 시안에서 미국 OSS와 함께 국내로 들어갈 부대를 훈련했습니다.',
      high:
        '청산리 전투에 참전한 독립군 지휘관 출신으로 한국광복군 참모장을 지냈다. 1945년 시안 두취(杜曲)에서 제2지대장으로 미국 전략정보국(OSS)과 합작한 국내정진군 훈련을 지휘했으나, 일제의 항복으로 국내 진입 작전은 실행되지 못했다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「이범석」 항목.',
  },
  kimwonbong: {
    id: 'kimwonbong',
    name: '김원봉',
    hanja: '金元鳳',
    life: '1898~1958',
    role: '의열단장 · 조선의용대 대장 · 한국광복군 부사령',
    track: 'military',
    accent: '#6b7b8c',
    appearance: {
      garment: 'uniform',
      coat: '#6a6f4d',
      trim: '#4c5137',
      lower: '#6a6f4d',
      hair: 'sleek',
      facialHair: 'none',
      glasses: false,
      headwear: 'military-cap',
      age: 'middle',
      note: '1942년 광복군 부사령 취임 이후를 기준으로 군복 차림으로 표현했다. 의열단 시기 사진은 양복이 많다.',
    },
    inTextbook: true,
    recruitable: true,
    bonus: { forces: 7, unity: 6 },
    bio: {
      middle:
        '의열단을 만들어 일제 기관을 공격한 독립운동가예요. 자신이 이끌던 조선의용대의 일부를 광복군에 합쳐, 좌우로 갈라져 있던 독립운동 세력이 하나로 모이는 데 힘을 보탰습니다.',
      high:
        '1919년 의열단을 조직해 무장 의열 투쟁을 이끌었고, 1938년 조선의용대를 창설했다. 1942년 조선의용대 일부 병력이 한국광복군 제1지대로 편입되면서 광복군 부사령에 취임했다. 임시정부의 좌우 합작을 상징하는 인물이다.',
    },
    sourceNote:
      '조선의용대의 광복군 편입은 1942년이며, 주력 일부는 앞서 화북으로 이동해 조선의용군이 되었다. 김원봉은 광복 후 월북해 남북 양쪽에서 오랫동안 평가가 엇갈렸다.',
  },
  kimhakgyu: {
    id: 'kimhakgyu',
    name: '김학규',
    hanja: '金學奎',
    life: '1900~1967',
    role: '한국광복군 제3지대장',
    track: 'military',
    accent: '#7c8a5f',
    appearance: {
      garment: 'uniform',
      coat: '#6f7450',
      trim: '#4c5137',
      lower: '#6f7450',
      hair: 'cropped',
      facialHair: 'none',
      glasses: false,
      headwear: 'military-cap',
      age: 'middle',
      note: '광복군 제3지대장으로 군복 차림이다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { forces: 6, agents: 3 },
    bio: {
      middle:
        '중국 안후이성 푸양에서 광복군 제3지대를 이끌었어요. 일본군에 끌려갔다가 탈출한 조선인 학도병들을 받아들여 광복군 대원으로 키웠습니다.',
      high:
        '만주 조선혁명군 출신으로 한국광복군 제3지대장을 맡아 안후이성 푸양(阜陽)을 근거지로 삼았다. 일본군에서 탈출한 학도병(장준하·김준엽 등)을 받아들여 훈련시켰고, 이들 중 일부가 OSS 합작 훈련에 참여했다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「김학규」 항목.',
  },
  hanjiseong: {
    id: 'hanjiseong',
    name: '한지성',
    hanja: '韓志成',
    life: '1912~미상',
    role: '인면전구공작대(印緬戰區工作隊) 대장',
    track: 'military',
    accent: '#6e8a8a',
    appearance: {
      garment: 'uniform',
      coat: '#6b7355',
      trim: '#4c5137',
      lower: '#6b7355',
      hair: 'parted',
      facialHair: 'none',
      glasses: false,
      headwear: 'military-cap',
      age: 'young',
      note: '인면전구공작대 대장으로 광복군 군복 차림이다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { forces: 4, prestige: 7 },
    bio: {
      middle:
        '1943년 인도와 버마 전선에 파견된 광복군 부대의 대장이에요. 영어와 일본어를 써서 일본군에게 항복을 권하는 방송을 하고, 붙잡힌 일본군을 조사하는 일을 맡았습니다.',
      high:
        '1943년 8월 영국군의 요청으로 인도·버마 전선에 파견된 한국광복군 인면전구공작대(9명)의 대장을 맡았다. 대적 선전 방송, 일본군 문서 번역, 포로 심문 등 연합군의 실제 작전에 참여해 임시정부가 연합국의 일원으로 싸웠음을 보여 주는 사례가 되었다.',
    },
    sourceNote:
      '파견 인원은 9명으로 전해진다. 한지성은 광복 후 행적과 사망 시점이 명확히 밝혀져 있지 않다.',
  },
  ogwangsim: {
    id: 'ogwangsim',
    name: '오광심',
    hanja: '吳光心',
    life: '1910~1976',
    role: '한국광복군 여성 대원 · 총사령부 요원',
    track: 'military',
    accent: '#b07f9a',
    appearance: {
      garment: 'uniform',
      coat: '#707454',
      trim: '#4c5137',
      lower: '#707454',
      hair: 'bun',
      facialHair: 'none',
      glasses: false,
      headwear: 'military-cap',
      age: 'middle',
      note: '광복군 여성 대원도 남성과 같은 군복을 입었다. 머리는 당시 기혼 여성의 쪽진 모양으로 두었다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { forces: 4, agents: 3, unity: 3 },
    bio: {
      middle:
        '만주에서부터 독립운동을 해 온 여성 대원이에요. 1940년 광복군이 만들어질 때부터 함께했고, 대원들을 모으고 소식을 전하는 일을 맡았습니다.',
      high:
        '만주 조선혁명당 계열에서 활동하다 임시정부에 합류해, 1940년 9월 한국광복군 창설 당시부터 참여한 여성 대원이다. 총사령부에서 선전·초모(招募, 대원 모집) 활동을 맡았으며 광복군 기관지 『광복』 제작에도 참여했다.',
    },
    sourceNote:
      '국가보훈부 공훈전자사료관 「오광심」 항목. 「광복군가」 작사자로 소개되기도 하나 자료마다 표기가 달라 단정하지 않는다.',
  },
  jibokyeong: {
    id: 'jibokyeong',
    name: '지복영',
    hanja: '池復榮',
    life: '1919~2007',
    role: '한국광복군 여성 대원 · 총사령부 비서',
    track: 'military',
    accent: '#a98ab0',
    appearance: {
      garment: 'uniform',
      coat: '#6f7452',
      trim: '#4c5137',
      lower: '#6f7452',
      hair: 'bob',
      facialHair: 'none',
      glasses: false,
      headwear: 'military-cap',
      age: 'young',
      note: '광복군 총사령부에서 일한 여성 대원으로 군복 차림이다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { agents: 3, unity: 2 },
    bio: {
      middle:
        '광복군 총사령 지청천의 딸이자, 자신도 광복군 대원이었어요. 임시정부가 옮겨 다닌 길을 직접 걸었고, 그 기록을 회고록으로 남겼습니다.',
      high:
        '한국광복군 총사령 지청천의 딸로, 1940년 광복군 창설기에 입대해 총사령부에서 선전·비서 업무를 맡았다. 임시정부의 피난 여정과 광복군 활동을 담은 회고록을 남겨 여성 독립운동가의 기록으로 평가된다.',
    },
    sourceNote:
      '지복영, 『역사의 수레를 끌고 밀며: 항일 무장 독립운동과 백산 지청천 장군』(문학과지성사, 2013).',
  },
  bangsunhui: {
    id: 'bangsunhui',
    name: '방순희',
    hanja: '方順熙',
    life: '1904~1979',
    role: '임시의정원 의원 (함경도 대표)',
    track: 'unity',
    accent: '#9a7f9e',
    appearance: {
      garment: 'hanbok-woman',
      coat: '#f2ece0',
      trim: '#ffffff',
      lower: '#2f3950',
      hair: 'bun',
      facialHair: 'none',
      glasses: false,
      headwear: 'none',
      age: 'middle',
      note: '임시의정원 의원으로 활동한 여성으로, 흰 저고리에 남색 치마 차림으로 표현했다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { unity: 6, agents: 2 },
    bio: {
      middle:
        '임시정부의 국회에 해당하는 임시의정원에서 오랫동안 의원으로 활동한 여성이에요. 여성도 정치에 참여한다는 것을 보여 준 사람입니다.',
      high:
        '1939년 임시의정원 함경도 대표 의원으로 선출되어 광복 때까지 의정 활동을 이어간 대표적 여성 의원이다. 한국혁명여성동맹 결성에도 참여해 임정 내 여성 조직 활동을 이끌었다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 「방순희」 항목.',
  },
  jangjunha: {
    id: 'jangjunha',
    name: '장준하',
    hanja: '張俊河',
    life: '1918~1975',
    role: '학병 탈출 → 한국광복군 · OSS 훈련 참가',
    track: 'military',
    accent: '#7b8b6a',
    appearance: {
      garment: 'uniform',
      coat: '#747a56',
      trim: '#4c5137',
      lower: '#747a56',
      hair: 'cropped',
      facialHair: 'none',
      glasses: false,
      headwear: 'military-cap',
      age: 'young',
      note: '학병에서 탈출해 광복군에 입대한 청년으로 군복 차림이다.',
    },
    inTextbook: false,
    recruitable: true,
    bonus: { forces: 5, prestige: 2 },
    bio: {
      middle:
        '일본군에 강제로 끌려갔다가 탈출해, 수천 리를 걸어 충칭의 임시정부를 찾아온 청년이에요. 광복군에 들어가 국내로 들어갈 훈련을 받았고, 그 여정을 『돌베개』라는 책에 남겼습니다.',
      high:
        '일본군 학도병으로 징집되었다가 1944년 탈출해, 중국 대륙을 도보로 횡단해 충칭 임시정부에 도착했다. 한국광복군에 입대해 1945년 시안에서 OSS 합작 국내정진군 훈련을 받았다. 그 여정을 기록한 수기 『돌베개』를 남겼다.',
    },
    sourceNote: '장준하, 『돌베개』(초판 1971). 인용은 판본에 따라 표현 차이가 있다.',
  },
};

/** 동지로 영입할 수 있는 인물 목록 */
export const recruitableFigures = Object.values(figures).filter((f) => f.recruitable);

export function getFigure(id: string): Figure {
  const figure = figures[id];
  if (!figure) throw new Error(`알 수 없는 인물 id: ${id}`);
  return figure;
}
