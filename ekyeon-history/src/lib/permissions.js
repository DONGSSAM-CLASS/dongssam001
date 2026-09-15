import { MEMBER_TYPE_MAP } from './constants';

// 섹션별 접근 가능한 회원 유형 (회원 3종 기준)
export const SECTION_ACCESS = {
  lessonWrite: ['staff', 'member'], // 수업 기록 등록
  admin: ['staff'],                 // 운영 도구(관리자 계정은 별도)
};

export function canAccess(section, member) {
  if (!member || member.status !== 'approved') return false;
  const allowed = SECTION_ACCESS[section] || [];
  return allowed.includes(member.memberType);
}

export function typeLabel(id) {
  return MEMBER_TYPE_MAP[id]?.label ?? id;
}
