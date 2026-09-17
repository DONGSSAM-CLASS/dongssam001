import type { MinistryDoc } from '../types';

/**
 * 기본 부처 템플릿(요구사항 4-2). 교사가 이름·직책명·업무·정원·월급을 모두 바꿀 수 있고
 * 추가·삭제·순서 변경도 됩니다. 권한은 이름이 아니라 roleKey 에 붙어 있으므로
 * 이름을 바꿔도 권한은 그대로입니다.
 *
 * officialName2026 은 설정 화면의 "2026년 실제 정부조직 명칭으로 일괄 변경" 버튼이 쓰는 값입니다.
 * 확정되지 않은 부처는 현재 이름을 그대로 두었으니 교사가 직접 고쳐 주세요.
 */
export const MINISTRY_TEMPLATE: (MinistryDoc & { id: string })[] = [
  {
    id: 'finance', name: '기획재정부', officialName2026: '재정경제부', positionTitle: '장관',
    roleKey: 'FINANCE_MINISTER', salary: 600, capacity: 1, order: 1,
    duty: '학급 경제·은행·세금을 관리합니다. 전체 보유고를 보고 대출을 심사합니다.',
  },
  {
    id: 'education', name: '교육부', officialName2026: '교육부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 2,
    duty: '학습 준비물과 과제 제출을 확인합니다.',
  },
  {
    id: 'science', name: '과학기술정보통신부', officialName2026: '과학기술정보통신부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 3,
    duty: '태블릿과 전자기기를 관리하고 충전 상태를 점검합니다.',
  },
  {
    id: 'foreign', name: '외교부', officialName2026: '외교부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 1, order: 4,
    duty: '전학생과 손님을 안내하고 다른 학급과 연락합니다.',
  },
  {
    id: 'justice', name: '법무부', officialName2026: '법무부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 5,
    duty: '학급 규칙이 잘 지켜지는지 점검합니다.',
  },
  {
    id: 'defense', name: '국방부', officialName2026: '국방부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 6,
    duty: '교실 안전, 소등, 창문 잠금을 점검합니다.',
  },
  {
    id: 'interior', name: '행정안전부', officialName2026: '행정안전부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 7,
    duty: '출결을 돕고 교실 시설을 점검합니다.',
  },
  {
    id: 'culture', name: '문화체육관광부', officialName2026: '문화체육관광부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 8,
    duty: '게시판을 꾸미고 학급 행사를 준비합니다.',
  },
  {
    id: 'health', name: '보건복지부', officialName2026: '보건복지부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 9,
    duty: '보건 물품을 관리하고 급식 도우미를 맡습니다.',
  },
  {
    id: 'climate', name: '기후에너지환경부', officialName2026: '기후에너지환경부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 10,
    duty: '분리수거와 에너지 절약을 담당합니다.',
  },
  {
    id: 'labor', name: '고용노동부', officialName2026: '고용노동부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 11,
    duty: '1인 1역 수행 체크리스트를 관리합니다.',
  },
  {
    id: 'land', name: '국토교통부', officialName2026: '국토교통부', positionTitle: '장관',
    roleKey: 'MINISTER', salary: 500, capacity: 2, order: 12,
    duty: '자리 배치와 청약 진행을 돕습니다.',
  },
];
