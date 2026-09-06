// 원칙 3 — 저작권 고정 문구 (푸터에 항상 노출)
export const COPYRIGHT_FOOTER =
  '문항 원문의 저작권은 한국교육과정평가원에 있으며, 본 사이트는 공식 자료로 연결하는 링크와 학습용 메타데이터만 제공합니다.';

// 평가원 수능 기출문제 게시판 (원본 확인 경로)
export const KICE_BOARD_URL =
  'https://www.suneung.re.kr/boardCnts/list.do?boardID=1500234&m=0403&s=suneung';

import type { ItemType } from './types/schema';

// itemType 허용값 (프롬프트 4장)
export const ITEM_TYPES: ItemType[] = [
  '사료제시형',
  '지도·시각자료형',
  '인물형',
  '연표·순서형',
  '개념이해형',
  '기타',
];
