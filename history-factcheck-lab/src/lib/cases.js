import koreaCases from '../data/cases.korea.json';
import worldCases from '../data/cases.world.json';

export const ALL_CASES = [...koreaCases, ...worldCases];

export const TRACKS = {
  korea: { key: 'korea', label: '한국사', blurb: '고대부터 근대까지, 우리 역사 자료를 직접 열어 본다.' },
  world: { key: 'world', label: '세계사', blurb: '세계사 속 널리 퍼진 통념을 원사료로 되짚는다.' },
};

export function getCasesByTrack(track) {
  return ALL_CASES.filter((c) => c.track === track);
}

export function getCase(caseId) {
  return ALL_CASES.find((c) => c.id === caseId) ?? null;
}

export function getSource(caseData, sourceId) {
  return caseData?.sources.find((s) => s.id === sourceId) ?? null;
}

/** 오류 유형 코드 → 한국어 라벨과 설명. UI 배지와 범례가 함께 쓴다. */
export const ERROR_TYPES = {
  'date-error': {
    label: '연대 오류',
    desc: '연도·시기를 잘못 적었다. 한 해 차이가 인과관계를 뒤집기도 한다.',
  },
  'person-confusion': {
    label: '인물 혼동',
    desc: '다른 사람이 한 일을 뒤섞었다. 동명이인이나 비슷한 시기의 인물에서 자주 일어난다.',
  },
  'myth-as-fact': {
    label: '전설을 사실처럼',
    desc: '후대에 만들어진 이야기나 야사를 당대의 사실인 것처럼 서술했다.',
  },
  'misattributed-quote': {
    label: '인용 오귀속',
    desc: '그 사람이 하지 않은 말, 그 자료에 없는 내용을 그 출처의 것인 양 붙였다.',
  },
  'no-source': {
    label: '근거 없음',
    desc: '주장만 있고 어떤 자료에 근거했는지 밝히지 않았다.',
  },
  'outdated-scholarship': {
    label: '옛 학설·옛 명칭',
    desc: '바뀐 학설이나 공식 명칭 개편을 반영하지 않은 낡은 서술이다.',
  },
  oversimplification: {
    label: '과도한 단순화',
    desc: '복잡한 사실을 둘로 잘라 나누거나 예외를 지워 버렸다. "모두", "전부"가 신호다.',
  },
  'eurocentric-bias': {
    label: '서구중심 서술',
    desc: '유럽의 시선만으로 사건을 설명하고 다른 지역 사람들을 대상으로만 다룬다.',
  },
  'nationalist-bias': {
    label: '민족주의적 과장',
    desc: '자기 나라를 돋보이게 하려고 근거보다 앞서 나간 서술이다.',
  },
  anachronism: {
    label: '시대착오',
    desc: '뒷날 생긴 개념·제도·용어를 그 이전 시대에 그대로 갖다 붙였다.',
  },
};

/** 문장 판정 라벨 (학생이 고르는 3지선다) */
export const VERDICT_CHOICES = [
  { key: 'fact', label: '사실', hint: '여러 자료에서 확인된다' },
  { key: 'suspicious', label: '의심스러움', hint: '자료와 어긋나거나 지나치게 단정적이다' },
  { key: 'unverifiable', label: '확인 불가', hint: '지금 가진 자료로는 확인할 수 없다' },
];

/**
 * 케이스 데이터의 verdict → 학생 판정 정답 매핑.
 * supported → 사실 / disputed·false → 의심스러움 / unverifiable → 확인 불가
 */
export function expectedVerdictKey(verdict) {
  if (verdict === 'supported') return 'fact';
  if (verdict === 'unverifiable') return 'unverifiable';
  return 'suspicious';
}

export const SOURCE_KINDS = {
  'primary-text': '1차 사료 · 글',
  'primary-image': '1차 사료 · 그림/사진',
  'primary-artifact': '1차 사료 · 유물',
  secondary: '2차 자료 · 연구/해설',
  tertiary: '3차 자료 · 사전/개관',
  news: '언론 보도',
  'example-lowquality': '대조용 저품질 자료',
};

export const RELIABILITY = {
  high: { label: '높음', className: 'bg-ink text-kraft-light' },
  medium: { label: '보통', className: 'bg-kraft-dark text-ink' },
  low: { label: '낮음', className: 'bg-alert text-white' },
};
