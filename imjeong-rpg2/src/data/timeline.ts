import type { TimelineEntry } from '../types';

/**
 * 연표 — 「새 나라가 만들어진 길」.
 * 2탄의 중심인 헌법·제도의 변화를 따라간다. 이설이 있는 일자는 sourceNote 에 밝힌다.
 */
export const timeline: TimelineEntry[] = [
  { date: '1919-03-01', label: '1919. 3. 1.', title: '3·1운동', detail: '전국에서 독립 만세 운동이 일어나다. 임시정부 수립의 바탕이 된다.', track: 'unity', sourceNote: '국사편찬위원회 우리역사넷.' },
  { date: '1919-03-17', label: '1919. 3.', title: '대한국민의회(연해주)', detail: '연해주에서 대한국민의회가 정부 역할을 선포하다.', track: 'unity', sourceNote: '조직 2월, 선포 3월 17일로 설명하는 경우가 많다.' },
  { date: '1919-04-11', label: '1919. 4. 11.', title: '대한민국 임시정부 수립', detail: '임시의정원이 국호 「대한민국」과 임시헌장 10개조를 의결하다. 제1조 「대한민국은 민주공화제로 함」.', track: 'law', map: 'assembly', sourceNote: '정부는 2019년부터 4월 11일을 수립 기념일로 한다.' },
  { date: '1919-04-23', label: '1919. 4. 23.', title: '한성정부 선포', detail: '서울에서 13도 대표 명의로 한성정부가 선포되다.', track: 'unity', sourceNote: '국사편찬위원회 우리역사넷.' },
  { date: '1919-07-10', label: '1919. 7.', title: '연통제 공포', detail: '국무원령 제1호로 국내 비밀 행정 조직인 연통제를 두다.', track: 'finance', map: 'hafei', sourceNote: '『대한민국임시정부자료집』 1권.' },
  { date: '1919-08-21', label: '1919. 8. 21.', title: '『독립』 창간', detail: '임시정부 기관지 역할을 한 신문 창간. 10월 『독립신문』으로 이름을 바꾸다.', track: 'propaganda', map: 'hafei', sourceNote: '『독립신문』 영인본.' },
  { date: '1919-09-11', label: '1919. 9. 11.', title: '통합 임시정부와 임시헌법', detail: '세 정부가 하나로 합치고, 국민주권·삼권분립·대통령제를 담은 임시헌법을 공포하다.', track: 'law', map: 'hafei', sourceNote: '『대한민국임시정부자료집』 1권.' },
  { date: '1921-01-01', label: '1920~1921', title: '연통제 붕괴', detail: '일제의 검거로 국내 연락망이 크게 무너지다.', track: 'finance', sourceNote: '연구서마다 붕괴 시점 서술이 조금씩 다르다.' },
  { date: '1923-01-03', label: '1923. 1.~6.', title: '국민대표회의', detail: '개조파와 창조파가 맞서다 결렬되다.', track: 'unity', map: 'madang', sourceNote: '『대한민국임시정부자료집』 별책.' },
  { date: '1925-03-23', label: '1925. 3.', title: '임시대통령 탄핵', detail: '임시의정원이 이승만을 탄핵·면직하고 박은식을 제2대 대통령으로 선출하다.', track: 'law', map: 'madang', sourceNote: '의결·공포 일자는 자료마다 다르게 소개된다.' },
  { date: '1925-04-07', label: '1925. 4.', title: '제2차 개헌 — 국무령제', detail: '대통령제를 국무령 중심의 내각책임제로 바꾸다.', track: 'law', sourceNote: '『대한민국임시정부자료집』 1권.' },
  { date: '1927-03-05', label: '1927. 3.', title: '제3차 개헌 — 국무위원 집단지도제', detail: '「임시약헌」으로 국무위원회 중심 체제를 두다.', track: 'law', map: 'madang', sourceNote: '『대한민국임시정부자료집』 1권.' },
  { date: '1930-01-25', label: '1930. 1.', title: '한국독립당 결성', detail: '임정 중심 인사들이 삼균주의를 이념으로 한 한국독립당을 만들다.', track: 'unity', map: 'madang', sourceNote: '결성일은 자료마다 조금씩 다르다.' },
  { date: '1932-04-29', label: '1932. 4. 29.', title: '상하이를 떠나다', detail: '윤봉길 의거 뒤 임시정부가 상하이를 떠나 8년간 이동하다. (1탄에서 다룸)', track: 'military', sourceNote: '김구, 『백범일지』.' },
  { date: '1940-09-17', label: '1940. 9. 17.', title: '한국광복군 창설', detail: '충칭에서 한국광복군 총사령부 성립 전례식을 거행하다.', track: 'military', map: 'chongqing', sourceNote: '『대한민국임시정부자료집』 한국광복군 편.' },
  { date: '1940-10-09', label: '1940. 10.', title: '제4차 개헌 — 주석제', detail: '주석에게 권한을 모은 전시 체제로 바꾸고 김구가 주석이 되다.', track: 'law', map: 'chongqing', sourceNote: '『대한민국임시정부자료집』 1권.' },
  { date: '1941-11-28', label: '1941. 11. 28.', title: '대한민국 건국강령', detail: '삼균주의에 바탕을 둔 광복 뒤 나라의 설계도를 발표하다.', track: 'law', map: 'chongqing', sourceNote: '『대한민국임시정부자료집』 1권.' },
  { date: '1941-12-10', label: '1941. 12. 10.', title: '대일 선전 성명', detail: '태평양 전쟁 발발 직후 일본에 선전을 포고하다. (1탄에서 다룸)', track: 'diplomacy', sourceNote: '발표일은 12월 9일·10일로 달리 소개된다.' },
  { date: '1944-04-22', label: '1944. 4.', title: '제5차 개헌 — 주석·부주석제', detail: '「임시헌장」으로 김구 주석·김규식 부주석의 좌우 연합 정부를 구성하다.', track: 'unity', map: 'chongqing', sourceNote: '『대한민국임시정부자료집』 1권.' },
  { date: '1945-08-15', label: '1945. 8. 15.', title: '광복', detail: '일본의 항복으로 광복을 맞다.', track: 'unity', sourceNote: '국사편찬위원회 우리역사넷.' },
  { date: '1945-11-23', label: '1945. 11. 23.', title: '임정 요인 환국', detail: '김구 등 제1진이 개인 자격으로 귀국하다. 제2진은 12월.', track: 'diplomacy', map: 'seoul', sourceNote: '김구, 『백범일지』.' },
  { date: '1948-07-17', label: '1948. 7. 17.', title: '제헌헌법 공포', detail: '국호 대한민국, 제1조 「대한민국은 민주공화국이다」. 전문에 3·1운동의 독립정신 계승을 밝히다.', track: 'law', map: 'seoul', sourceNote: '국가법령정보센터 헌법 연혁.' },
  { date: '1948-08-15', label: '1948. 8. 15.', title: '대한민국 정부 수립', detail: '정부 수립을 선포하다. 9월 1일 관보 제1호는 「대한민국 30년」을 쓰다.', track: 'law', sourceNote: '국가기록원.' },
  { date: '1987-10-29', label: '1987. 10. 29.', title: '현행 헌법 — 임시정부 법통 명시', detail: '헌법 전문에 「3·1운동으로 건립된 대한민국임시정부의 법통」 계승을 명시하다.', track: 'law', map: 'memorial', sourceNote: '국가법령정보센터.' },
  { date: '2019-04-11', label: '2019. 4. 11.', title: '임시정부 수립 100주년', detail: '수립 기념일을 4월 11일로 바꾸어 100주년을 기념하다.', track: 'unity', map: 'memorial', sourceNote: '국가보훈부.' },
];
