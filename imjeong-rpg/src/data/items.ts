import type { Item } from '../types';

/**
 * 아이템 — 임시정부가 실제로 다룬 문서·물건만 넣는다.
 * 거상의 「무역 물품」 자리에 해당하지만, 사고파는 상품이 아니라
 * 퀘스트를 풀면서 손에 넣는 사료 그 자체다.
 */
export const items: Record<string, Item> = {
  charter: {
    id: 'charter',
    name: '대한민국 임시헌장',
    icon: '📜',
    description: {
      middle: '1919년 4월 11일에 선포한 10개조 헌장이에요. 첫 조항이 「대한민국은 민주공화제로 함」입니다.',
      high: '1919년 4월 11일 임시의정원이 공포한 전문 10개조의 헌장. 민주공화제와 남녀·귀천·빈부의 평등을 규정했다.',
    },
    sourceNote: '국사편찬위원회 『대한민국임시정부자료집』.',
  },
  bond: {
    id: 'bond',
    name: '독립공채표',
    icon: '🧾',
    description: {
      middle: '독립한 뒤에 갚겠다고 약속하고 발행한 증서예요. 동포들이 이걸 사서 자금을 보탰습니다.',
      high: '독립 완성 후 원리금 상환을 약속한 채권. 미주·중국·국내 동포가 매입했다.',
    },
    sourceNote: '독립기념관 소장 실물 자료.',
  },
  press: {
    id: 'press',
    name: '『독립신문』',
    icon: '📰',
    description: {
      middle: '임시정부가 상하이에서 펴낸 신문이에요. 독립운동 소식을 국내외에 알렸습니다.',
      high: '1919년 8월 21일 상하이에서 창간된 임시정부 기관지. 독립운동 여론 형성과 대외 선전을 맡았다.',
    },
    sourceNote: '창간일 1919년 8월 21일.',
  },
  correLibre: {
    id: 'correLibre',
    name: '『La Corée Libre』',
    icon: '🗞️',
    description: {
      middle: '파리위원부가 프랑스말로 만든 잡지예요. 유럽 사람들에게 한국을 알렸습니다.',
      high: '파리위원부가 발행한 프랑스어 선전지. 외교 창구가 막힌 조건에서 유럽 여론전을 폈다.',
    },
    sourceNote: '국가보훈부 공훈전자사료관 파리위원부 관련 자료.',
  },
  oath: {
    id: 'oath',
    name: '한인애국단 선서문',
    icon: '✒️',
    description: {
      middle: '한인애국단에 들어갈 때 쓴 맹세의 글이에요. 이봉창·윤봉길의 선서문이 사진으로 남아 있습니다.',
      high: '단원이 거사 전 작성한 선서문. 의거가 조직의 결정에 따른 것임을 보여 주는 문서 증거다.',
    },
    sourceNote: '독립기념관·국가보훈부 소장 사진 자료.',
  },
  gwangbokDecl: {
    id: 'gwangbokDecl',
    name: '한국광복군 선언문',
    icon: '🎖️',
    description: {
      middle: '1940년 9월 17일 광복군을 세운다고 세상에 알린 글이에요.',
      high: '1919년 군사조직법을 근거로 광복군이 임시정부의 정규군임을 선언한 문서.',
    },
    sourceNote: '국사편찬위원회 『대한민국임시정부자료집』.',
  },
  gangnyeong: {
    id: 'gangnyeong',
    name: '대한민국 건국강령',
    icon: '⚖️',
    description: {
      middle: '광복 뒤 어떤 나라를 세울지 미리 정해 놓은 문서예요. 삼균주의가 바탕입니다.',
      high: '1941년 11월 채택. 총강·복국·건국 3장으로 정치·경제·교육 균등의 국가 건설 방향을 제시했다.',
    },
    sourceNote: '국사편찬위원회 『대한민국임시정부자료집』.',
  },
  warDecl: {
    id: 'warDecl',
    name: '대일 선전 성명서',
    icon: '📢',
    description: {
      middle: '1941년 12월 10일 일본에 전쟁을 선포한 성명서예요. 병합조약이 무효라는 내용도 들어 있습니다.',
      high: '주석 김구·외무부장 조소앙 명의의 5개 항 성명. 교전 당사자 지위 주장과 병합조약 무효 선언을 담았다.',
    },
    sourceNote: '우리역사넷 「대한민국 임시정부 대일 선전 성명서」.',
  },
  taegeukgi: {
    id: 'taegeukgi',
    name: '임시정부 태극기',
    icon: '🇰🇷',
    description: {
      middle: '임시정부가 쓰던 태극기예요. 지금의 태극기와 괘의 위치나 태극 모양이 조금씩 달랐습니다.',
      high: '임시정부 시기 태극기는 4괘의 배치와 태극의 형태가 오늘날 국기 제작법과 다른 사례가 여럿 확인된다.',
    },
    sourceNote:
      '태극기 도안은 시기·제작자에 따라 차이가 크다. 실물은 독립기념관·국립중앙박물관 소장 자료에서 확인할 것.',
  },
  jangganggi: {
    id: 'jangganggi',
    name: '『장강일기』',
    icon: '📔',
    description: {
      middle: '정정화가 임시정부의 27년을 기록한 회고록이에요. 살림과 피난길의 이야기가 담겼습니다.',
      high: '정정화의 회고록. 요인 중심 기록에서 잘 보이지 않는 가족·여성의 역할을 보여 주는 생활사 사료다.',
    },
    sourceNote: '정정화. (1998). 장강일기. 학민사.',
  },
  baekbeom: {
    id: 'baekbeom',
    name: '『백범일지』',
    icon: '📖',
    description: {
      middle: '김구가 직접 쓴 회고록이에요. 임시정부의 안쪽 이야기를 볼 수 있습니다.',
      high: '김구의 자서전. 한인애국단 조직 경위와 광복 당시의 심경 등 임정사의 핵심 대목이 기록되어 있다.',
    },
    sourceNote: '김구. (1997). 백범일지 (도진순 주해). 돌베개.',
  },
};

export const itemList = Object.values(items);
