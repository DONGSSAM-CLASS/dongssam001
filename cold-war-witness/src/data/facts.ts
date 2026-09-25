/**
 * 사실 카드 — "실제 역사에서는?"
 *
 * ⚠️ 이 파일에는 수업 명세서에 적힌 사실만 넣습니다.
 *    날짜·숫자·인명을 새로 넣지 마세요. 꼭 넣어야 하면 needsCheck: true 로 표시하고
 *    docs/work-log.md 의 [검증필요] 목록에 적어 주세요.
 *
 * - 어려운 낱말은 괄호 안에 쉬운 말로 풀었습니다.
 * - source.url 이 빈 문자열이면 명세서에 URL 이 없는 카드입니다. 화면에는 기관명만 보입니다.
 * - needsCheck 는 화면에 드러나지 않는 교사용 표시입니다.
 */
import type { FactCard } from '../types/content';

const BUNDESARCHIV_INTRO: FactCard['source'] = {
  org: '독일 연방기록원 슈타지 기록보관소',
  url: 'https://www.bundesarchiv.de/en/stasi-records-archive/education/what-was-the-state-security/introduction/',
};
const BUNDESARCHIV_IM: FactCard['source'] = {
  org: '독일 연방기록원 슈타지 기록보관소',
  url: 'https://www.bundesarchiv.de/en/stasi-records-archive/education/what-was-the-state-security/the-unofficial-collaborators-of-the-mfs/',
};
const NARA_FOUNDATION: FactCard['source'] = {
  org: 'National Archives Foundation (미국 국립기록보관소 재단)',
  url: 'https://archivesfoundation.org/newsletter/the-loyalty-test/',
};
const LEVIN_CENTER: FactCard['source'] = {
  org: 'Levin Center',
  url: 'https://levin-center.org/joe-mccarthys-oversight-abuses/',
};
const CIVIL_LIBERTIES: FactCard['source'] = {
  org: 'Today in Civil Liberties History',
  url: 'https://todayinclh.com/?event=senate-censures-joe-mccarthy',
};
const STATE_DEPT: FactCard['source'] = {
  org: '미국 국무부 역사실',
  url: 'https://history.state.gov/milestones/1961-1968/cuban-missile-crisis',
};
const JFK_LIBRARY: FactCard['source'] = {
  org: 'JFK 도서관',
  url: 'https://www.jfklibrary.org/learn/about-jfk/jfk-in-history/cuban-missile-crisis',
};
/** 명세서에 출처가 적혀 있지 않은 카드 */
const SOURCE_PENDING: FactCard['source'] = { org: '출처 확인 중', url: '' };

export const FACTS: FactCard[] = [
  /* ───────────── CHAPTER 1 · 슈타지의 벽 ───────────── */
  {
    id: 'c1-founding',
    chapter: 'ch1',
    title: '슈타지가 세워지다',
    dateLabel: '1950년 2월 8일',
    body: '동독의 국가보안부, 흔히 ‘슈타지’라고 부르는 기관은 1950년 2월 8일에 세워졌다.',
    source: { org: '슈타지 기록청(Stasi Records Agency) 관련 기록', url: '' },
    needsCheck: true,
    note: '명세서 출처가 “Stasi Records Agency 관련 기록”으로만 되어 있고 URL 이 없음.',
  },
  {
    id: 'c1-staff',
    chapter: 'ch1',
    title: '슈타지의 정규 직원',
    dateLabel: '1989년',
    body: '1989년 슈타지의 정규 직원은 약 9만 1천 명이었다.',
    source: BUNDESARCHIV_INTRO,
  },
  {
    id: 'c1-im-count',
    chapter: 'ch1',
    title: '비공식 협력자(IM)',
    dateLabel: '1989년',
    body: '1989년 슈타지의 비공식 협력자(IM)는 약 18만 9천 명이었다. 동독 주민 약 90명당 1명꼴이었다.',
    source: BUNDESARCHIV_IM,
  },
  {
    id: 'c1-im-watch',
    chapter: 'ch1',
    title: '가까운 사람이 감시자였다',
    body: '슈타지의 비공식 협력자들은 동료·친구·이웃·가족을 감시해 보고했다.',
    source: BUNDESARCHIV_IM,
    note: '명세서의 IM 사실 한 문장을 장면 2·3 에 나눠 쓰려고 두 장으로 나눔 (c1-im-count 와 같은 출처).',
  },
  {
    id: 'c1-committees',
    chapter: 'ch1',
    title: '시민들이 문서를 지키다',
    dateLabel: '1989년 12월 ~ 1990년 1월 15일',
    body:
      '1989년 12월부터 시민위원회가 곳곳의 슈타지 사무소를 점거해 문서가 파기(없애 버림)되는 것을 막았다. ' +
      '1990년 1월 15일에는 시민들이 베를린의 슈타지 본부에 들어갔다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '명세서에 출처 없음.',
  },
  {
    id: 'c1-files',
    chapter: 'ch1',
    title: '내 파일을 볼 수 있게 되다',
    dateLabel: '1992년 1월',
    body:
      '1992년 1월부터 누구나 자신에 대한 슈타지 파일을 열람(찾아 읽기)하겠다고 신청할 수 있게 되었다. ' +
      '파일이 공개되자 가까운 사람이 몰래 알린(밀고한) 사실이 드러나 우정이나 결혼이 깨진 경우도 많았다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '명세서에 출처 없음.',
  },
  {
    id: 'c1-wall',
    chapter: 'ch1',
    title: '베를린 장벽이 무너지다',
    dateLabel: '1989년 11월 9일',
    body: '1989년 11월 9일, 베를린 장벽이 무너졌다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '명세서에 출처 없음.',
  },

  /* ───────────── CHAPTER 2 · 명단에 오른 이름 ───────────── */
  {
    id: 'c2-huac',
    chapter: 'ch2',
    title: '하원 위원회와 ‘할리우드 텐’',
    dateLabel: '1947년',
    body:
      '1947년 미국 하원의 비미활동위원회(HUAC, ‘미국답지 않은 활동’을 조사한다는 위원회)가 할리우드 영화계를 조사했다. ' +
      '증언을 거부한 영화인 10명, 이른바 ‘할리우드 텐’은 의회 모독죄로 처벌받았다. ' +
      '이 조사는 매카시 상원의원이 아니라 하원의 위원회가 이끈 것이다.',
    source: NARA_FOUNDATION,
    note: '명세서 출처 표기 “countryreports / National Archives Foundation” 중 URL 이 있는 National Archives Foundation 만 표시함.',
  },
  {
    id: 'c2-blacklist',
    chapter: 'ch2',
    title: '블랙리스트',
    dateLabel: '1947년 이후',
    body: '할리우드 조사 이후 영화사들은 의심받는 사람들을 고용하지 않는 ‘블랙리스트(고용 금지 명단)’를 운영했다.',
    source: NARA_FOUNDATION,
    note: '명세서의 HUAC 사실 한 문장을 장면 3·4 에 나눠 쓰려고 두 장으로 나눔.',
  },
  {
    id: 'c2-wheeling',
    chapter: 'ch2',
    title: '휠링 연설과 ‘205명의 명단’',
    dateLabel: '1950년 2월 9일',
    body:
      '1950년 2월 9일, 조지프 매카시 상원의원은 웨스트버지니아주 휠링에서 한 연설에서 국무부에서 일하는 공산당원 205명의 명단을 갖고 있다고 주장했다. ' +
      '그러나 그는 이 명단을 언론과 대중, 상원 조사위원회에 끝내 내놓지 않았다.',
    source: LEVIN_CENTER,
  },
  {
    id: 'c2-murrow',
    chapter: 'ch2',
    title: '기자 에드워드 머로의 방송',
    dateLabel: '1954년 3월 9일',
    body: '1954년 3월 9일, CBS 방송의 기자 에드워드 머로가 매카시 자신이 한 말들을 중심으로 그를 비판하는 방송을 내보냈다.',
    source: CIVIL_LIBERTIES,
  },
  {
    id: 'c2-army',
    chapter: 'ch2',
    title: '텔레비전으로 중계된 청문회',
    dateLabel: '1954년 봄',
    body: '1954년 봄, 육군-매카시 청문회가 텔레비전으로 생중계되면서 매카시의 방식이 대중에게 그대로 드러났다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '명세서에 출처 없음.',
  },
  {
    id: 'c2-censure',
    chapter: 'ch2',
    title: '상원의 규탄 결의',
    dateLabel: '1954년 12월 2일',
    body: '1954년 12월 2일, 미국 상원은 67대 22로 매카시의 행동을 규탄(잘못을 공식적으로 꾸짖음)하는 결의를 통과시켰다.',
    source: LEVIN_CENTER,
  },
  {
    id: 'c2-context',
    chapter: 'ch2',
    kind: 'context',
    title: '그때 사람들은 왜 불안했을까?',
    body:
      '당시 실제 소련 간첩 사건들이 알려지면서 사회 전체의 불안과 공포가 커졌다. ' +
      '1950년 앨저 히스가 위증(법정에서 거짓 증언을 한 죄)으로 유죄 판결을 받았고, 로젠버그 사건 등도 있었다. ' +
      '그러나 매카시의 고발 가운데 상당수는 근거가 없었고, 죄 없는 많은 사람이 직장과 명예를 잃었다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '맥락 균형 카드. 명세서에 출처 없음.',
  },

  /* ───────────── CHAPTER 3 · 13일간의 선택 ───────────── */
  {
    id: 'c3-u2-photo',
    chapter: 'ch3',
    title: '정찰기가 찍은 사진',
    dateLabel: '1962년 10월 14일',
    body: '1962년 10월 14일, 미국의 U-2 정찰기가 쿠바에서 건설 중인 중거리 탄도미사일 기지를 촬영했다.',
    source: STATE_DEPT,
  },
  {
    id: 'c3-quarantine',
    chapter: 'ch3',
    title: '공습 대신 ‘격리’',
    dateLabel: '1962년 10월 22일',
    body:
      '케네디 대통령은 비공개 자문회의(ExComm)에서 공습 대신 해상(바다) ‘격리(quarantine)’를 선택했다. ' +
      '그리고 10월 22일 텔레비전·라디오 연설로 이를 국민에게 알렸다.',
    source: JFK_LIBRARY,
  },
  {
    id: 'c3-ships',
    chapter: 'ch3',
    title: '방향을 돌린 배들',
    dateLabel: '1962년 10월 24일',
    body: '10월 24일, 격리선에 가장 가까이 다가온 소련 배들이 방향을 돌렸다.',
    source: { org: 'Miller Center', url: '' },
    needsCheck: true,
    note: '명세서에 기관명(Miller Center)만 있고 URL 없음.',
  },
  {
    id: 'c3-u2-down',
    chapter: 'ch3',
    title: '위기가 가장 높아진 날',
    dateLabel: '1962년 10월 27일',
    body: '10월 27일, 미국 U-2 정찰기가 쿠바 상공에서 격추되어(맞아 떨어져) 위기가 가장 높은 단계에 이르렀다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '명세서에 출처 없음.',
  },
  {
    id: 'c3-withdraw',
    chapter: 'ch3',
    title: '미사일 철수 발표',
    dateLabel: '1962년 10월 28일',
    body:
      '10월 28일, 소련 지도자 흐루쇼프는 쿠바의 미사일을 철수하겠다고 발표했다. ' +
      '미국은 쿠바를 침공하지 않겠다고 약속했다.',
    source: JFK_LIBRARY,
  },
  {
    id: 'c3-turkey',
    chapter: 'ch3',
    kind: 'transparency',
    title: '25년 넘게 숨겨진 합의',
    body:
      '미국이 튀르키예에 배치한 자국 핵미사일을 철수하기로 한 별도의 합의는 25년 넘게 비밀로 유지되었다. ' +
      '당시 시민들은 위기가 어떻게 해결됐는지 전부 알 수 없었다.',
    source: JFK_LIBRARY,
    needsCheck: true,
    note: '명세서 출처가 “JFK 도서관”으로만 되어 있어 위 JFK 도서관 URL 을 같이 붙임 — 이 내용이 그 페이지에 있는지 확인 필요.',
  },
  {
    id: 'c3-b59',
    chapter: 'ch3',
    kind: 'safety',
    title: '잠수함 B-59의 순간',
    body:
      '위기 중 격리선 근처에서 미 해군의 연습용 폭뢰(물속에서 터지는 폭탄) 공격을 받던 소련 잠수함 B-59는 모스크바와 연락이 끊긴 상태였다. ' +
      '후일 증언에 따르면, 함장은 전쟁이 시작된 것으로 판단해 핵어뢰 발사를 준비했으나, 함께 동의해야 했던 장교 바실리 아르히포프가 반대해 발사되지 않았다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '“후일 증언에 따르면” 표현을 반드시 유지할 것. 명세서에 출처 없음.',
  },
  {
    id: 'c3-hotline',
    chapter: 'ch3',
    title: '직통 전화, 핫라인',
    dateLabel: '1963년',
    body: '위기 이후 1963년, 오해로 전쟁이 일어나는 것을 막기 위해 미국과 소련 정상 사이에 직통 통신선(핫라인)이 설치되었다.',
    source: SOURCE_PENDING,
    needsCheck: true,
    note: '명세서에 출처 없음.',
  },
  {
    id: 'c3-arms',
    chapter: 'ch3',
    title: '계속된 군비 경쟁',
    body: '위기는 끝났지만 미국과 소련의 군비 경쟁(무기를 더 많이, 더 강하게 만들려는 경쟁)은 계속되었다.',
    source: JFK_LIBRARY,
  },
];

const FACT_MAP = new Map(FACTS.map((f) => [f.id, f]));

export function getFact(id: string): FactCard {
  const fact = FACT_MAP.get(id);
  if (!fact) throw new Error(`사실 카드를 찾을 수 없어요: ${id}`);
  return fact;
}
