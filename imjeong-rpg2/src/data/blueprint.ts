import type { BlueprintKey } from '../types';

/**
 * 「새 나라 설계도」 — 퀘스트를 풀 때마다 새 나라의 기둥이 하나씩 선다.
 * 게임을 끝내면 학생 앞에 오늘의 대한민국을 이루는 원리들이 한 장의 설계도로 완성된다.
 */
export interface BlueprintPillar {
  key: BlueprintKey;
  icon: string;
  label: string;
  /** 오늘의 대한민국에서 찾을 수 있는 모습 */
  today: string;
}

export const blueprint: BlueprintPillar[] = [
  { key: 'name', icon: '🏷️', label: '나라 이름 「대한민국」', today: '1919년 4월에 정한 이름을 오늘도 씁니다.' },
  { key: 'republic', icon: '📜', label: '민주공화제', today: '헌법 제1조 「대한민국은 민주공화국이다」.' },
  { key: 'rights', icon: '🗽', label: '평등과 자유', today: '헌법의 기본권 — 평등권과 여러 자유.' },
  { key: 'assembly', icon: '🏛️', label: '국민의 대표 기관', today: '임시의정원의 뒤를 잇는 국회.' },
  { key: 'sovereignty', icon: '🤝', label: '하나의 정부', today: '흩어진 뜻을 하나로 모은 통합 정부.' },
  { key: 'separation', icon: '⚖️', label: '삼권분립', today: '국회·정부·법원이 서로 견제합니다.' },
  { key: 'network', icon: '🧭', label: '행정 조직', today: '중앙과 지방을 잇는 행정.' },
  { key: 'press', icon: '📰', label: '신문과 여론', today: '언론의 자유와 공론장.' },
  { key: 'finance', icon: '💰', label: '나라 살림(재정)', today: '국민이 낸 세금으로 꾸리는 나라 살림.' },
  { key: 'diplomacy', icon: '🌐', label: '외교', today: '세계와 관계를 맺는 외교.' },
  { key: 'crisis', icon: '🗣️', label: '토론과 합의', today: '생각이 달라도 대화로 푸는 민주주의.' },
  { key: 'impeachment', icon: '🔨', label: '법 아래의 권력', today: '헌법이 정한 탄핵 제도.' },
  { key: 'collective', icon: '👥', label: '함께 책임지는 정부', today: '국무회의에서 함께 논의하는 정부.' },
  { key: 'party', icon: '🧩', label: '정당', today: '뜻이 같은 사람들이 모인 정당 정치.' },
  { key: 'army', icon: '🎖️', label: '정부의 군대', today: '헌법 아래 나라를 지키는 국군.' },
  { key: 'samgyun', icon: '📐', label: '고르게 사는 나라(삼균)', today: '보통선거와 의무교육.' },
  { key: 'women', icon: '🌸', label: '남녀가 함께하는 정치', today: '여성의 참정권과 정치 참여.' },
  { key: 'coalition', icon: '🤲', label: '연합과 통합', today: '다른 생각을 한 정부 안에 담는 일.' },
  { key: 'constitution-history', icon: '📚', label: '헌법을 고치는 절차', today: '헌법 개정의 절차.' },
  { key: 'return', icon: '✈️', label: '광복과 환국', today: '되찾은 나라에 돌아온 사람들.' },
  { key: 'founding-1948', icon: '🇰🇷', label: '1948년 헌법', today: '제헌헌법이 잇고, 오늘의 헌법으로 이어진 뜻.' },
  { key: 'legitimacy', icon: '🏛️', label: '임시정부의 법통', today: '헌법 전문 「대한민국임시정부의 법통을 계승」.' },
];
