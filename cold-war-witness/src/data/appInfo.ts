/**
 * 앱 정보 페이지 — 공모전 제출용 정보
 */

export const DEVELOPER = {
  name: '동쌤 김동은',
  school: '번동중학교',
};

export const CONTEST = {
  name: '2026 인공지능 윤리교육 콘텐츠 공모전',
  hosts: ['과학기술정보통신부', '정보통신정책연구원'],
};

export const TARGET = {
  grade: '중학교 2학년',
  subject: '중학교 역사① (2022 개정 교육과정)',
  sessions: '3차시 (각 45분 수업 중 앱 사용 약 20~25분)',
};

/**
 * 교과 성취기준과 K-SEL 틀은 src/data/curriculum.ts 에 원문으로 있습니다.
 * 앱 정보 페이지는 그 파일을 그대로 가져다 씁니다.
 */
export { HISTORY_STANDARDS as STANDARDS, KSEL_COMPETENCIES, KSEL_DOC } from './curriculum';

/** 생성형 AI 활용 범위 */
export const GENERATIVE_AI_USE = [
  '웹앱 코드 개발에 Claude Code를 활용했습니다.',
  '시나리오 초안 작성 보조에 생성형 AI를 활용했고, 교사가 사실을 검증하고 수정했습니다.',
  '앱 안에서는 외부 AI 서비스를 부르지 않습니다. (비용과 개인정보 보호를 위해)',
];

/** 심사 기준 대응 */
export const JUDGING_POINTS = [
  { criterion: '윤리원칙 이해', how: '7대 원칙 카드와 3대 가치 카드 보드, 원칙마다 냉전 연결 한 줄' },
  { criterion: '교육적 효과성', how: 'AI 시대 연결 성찰 쓰기, 한국형 사회정서교육 교육과정의 역량·성취기준과 연계한 감정 체크와 마무리 성찰' },
  { criterion: '현장 활용성', how: '교사 대시보드(챕터 잠금·실시간 현황·선택 분포·CSV), 인쇄용 과정안·활동지·가이드' },
  { criterion: '창의성', how: '냉전 속 평범한 시민이 되어 보는 역사 의사결정 시뮬레이션' },
  { criterion: '참여성', how: '장면마다 선택, 학급 선택 분포를 보며 토론, 나의 AI 윤리 실천 선언문' },
];

/** 역사 정확성 원칙 (앱 정보 페이지에 함께 표시) */
export const ACCURACY_NOTES = [
  '챕터의 주인공과 주변 인물은 실제 역사적 상황을 바탕으로 만든 가상 인물입니다.',
  '사건·날짜·수치·실존 인물의 행동은 출처가 있는 사실 카드에만 담았습니다.',
  '실존 인물의 말은 따옴표로 직접 인용하지 않고 간접적으로 전했습니다.',
  '냉전 시기 감시와 인권 침해는 동독(사회주의 진영)과 미국(자본주의 진영) 모두에서 일어났습니다. 이 앱은 어느 한쪽을 선이나 악으로 그리지 않습니다.',
];
