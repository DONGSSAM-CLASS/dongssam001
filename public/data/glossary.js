export const glossary = [
  { term: '거류외인', definition: '다른 폴리스에서 와서 사는 외국인', firstScreen: '#/sources' },
  { term: '과두정', definition: '소수의 사람이 나라를 다스리는 제도', firstScreen: '#/compare' },
  { term: '델로스 동맹', definition: '아테네를 중심으로 맺은 폴리스 동맹', firstScreen: '#/sources' },
  { term: '동맹금', definition: '동맹에 속한 폴리스가 바치는 돈과 물자', firstScreen: '#/sources' },
  { term: '민주정', definition: '시민들이 직접 모여 나라 일을 정하는 제도', firstScreen: '#/compare' },
  { term: '민회', definition: '시민들이 모여 손을 들어 나라 일을 정하던 회의', firstScreen: '#/sources' },
  { term: '사료', definition: '옛날 일을 알려 주는 기록이나 물건', firstScreen: '#/sources' },
  { term: '삼단노선', definition: '노 젓는 사람이 여러 층으로 앉는 군함', firstScreen: '#/compare' },
  { term: '성벽', definition: '적의 공격을 막기 위해 도시를 둘러싼 벽', firstScreen: '#/decision/D2' },
  { term: '스파르타', definition: '그리스 남쪽에 있던 군사 강국 폴리스', firstScreen: '#/compare' },
  { term: '시민', definition: '폴리스에서 정치에 참여할 권리를 가진 사람', firstScreen: '#/sources' },
  { term: '식민시', definition: '다른 폴리스가 새로 세운 도시', firstScreen: '#/decision/D5' },
  { term: '아테네', definition: '그리스의 대표적인 민주정 폴리스', firstScreen: '#/sources' },
  { term: '역병', definition: '많은 사람에게 빠르게 퍼지는 큰 병', firstScreen: '#/decision/D2' },
  { term: '원정', definition: '먼 곳으로 군대를 보내 싸우는 것', firstScreen: '#/decision/D6' },
  { term: '참주', definition: '법에 따르지 않고 힘으로 권력을 잡은 사람', firstScreen: '#/glossary' },
  { term: '폴리스', definition: '고대 그리스의 작은 도시 국가', firstScreen: '#/sources' },
  { term: '펠로폰네소스 동맹', definition: '스파르타를 중심으로 맺은 폴리스 동맹', firstScreen: '#/compare' },
  { term: '헤일로타이', definition: '스파르타에서 지배를 받던 사람들', firstScreen: '#/compare' },
  { term: '휴전', definition: '전쟁을 잠시 멈추기로 약속하는 것', firstScreen: '#/decision/D4' }
];

export const glossaryMap = {};
glossary.forEach(item => {
  glossaryMap[item.term] = item.definition;
});
