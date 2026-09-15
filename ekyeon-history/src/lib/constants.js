// 회원 유형 3종 — 본원(에크연)의 5종을 역사연구팀에 맞게 단순화했습니다.
export const MEMBER_TYPES = [
  {
    id: 'staff',
    label: '운영진',
    tagline: '연구팀의 방향을 함께 만듭니다',
    desc: '연구 주제와 모임을 기획하고, 등록된 모든 수업 기록과 운영 도구를 관리합니다.',
    level: 3,
  },
  {
    id: 'member',
    label: '연구팀 교사',
    tagline: '수업을 나누고 기록을 남깁니다',
    desc: '수업 나눔 자료와 수업 공개 실적을 직접 등록하고, 본인이 올린 글을 수정·삭제할 수 있습니다.',
    level: 2,
  },
  {
    id: 'guest',
    label: '참관 회원',
    tagline: '먼저 읽어 보며 함께합니다',
    desc: '연구팀의 수업 기록을 읽어 볼 수 있습니다. 등록 권한이 필요하면 운영진에게 요청해 주세요.',
    level: 1,
  },
];

export const MEMBER_TYPE_MAP = Object.fromEntries(MEMBER_TYPES.map((t) => [t.id, t]));

export const STATUS_LABEL = {
  pending: '승인 대기',
  approved: '승인 완료',
  rejected: '승인 거절',
  suspended: '이용 정지',
};

// 사이트 정체성 — 홈 히어로 / 소개 / 푸터 세 곳에 동일하게 노출합니다.
export const SITE_NAME = '에듀테크 교사 연구회 역사연구팀';
export const SITE_NAME_EN = 'EDUTECH TEACHERS · HISTORY RESEARCH TEAM';
export const IDENTITY_BADGES = ['에크연 스핀오프 연구회', '교육부 역사교사학습공동체'];
export const IDENTITY_LINES = [
  "전국 단위 에듀테크 교육 연구자 모임 '에듀테크 교사 연구회(에크연)'의 스핀오프 연구회",
  '교육부 역사교사학습공동체',
];

export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'dongssam94@gmail.com';
export const ADMIN_APPROVER_EMAIL =
  import.meta.env.VITE_ADMIN_APPROVER_EMAIL || 'dongssam94@gmail.com';
export const ADMIN_ID_DOMAIN = import.meta.env.VITE_ADMIN_ID_DOMAIN || 'admin.ekyeon.kr';

export const PARENT_SITE_URL =
  import.meta.env.VITE_PARENT_SITE_URL || 'https://edutech-teachers.web.app/';
export const NOTION_ABOUT_URL =
  import.meta.env.VITE_NOTION_ABOUT_URL ||
  'https://sore-quicksand-061.notion.site/37bc62e931b58063ab47ffeaaf6fa5f1';
export const DEV_DRIVE_URL =
  import.meta.env.VITE_DEV_DRIVE_URL ||
  'https://drive.google.com/drive/folders/14lOQvytlopW0ONCnCsJJ2y1f2t7iWIWp?usp=sharing';
export const DEV_SPACE_PASSCODE = import.meta.env.VITE_DEV_SPACE_PASSCODE || '2026';

export const LESSON_TYPES = ['수업 나눔', '수업 공개 실적', '연수·발표', '기타'];
export const SCHOOL_LEVELS = ['초등학교', '중학교', '고등학교', '기타'];

export const COLLAB_CATEGORIES = [
  '강의·연수',
  '자료 공동개발',
  '프로젝트',
  '집필·자문',
  '기타',
];
