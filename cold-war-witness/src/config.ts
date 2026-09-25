/**
 * 앱 전체 설정. 제목을 바꾸려면 APP_TITLE 만 고치면 된다.
 */

/** 앱 제목 (기본값) */
export const APP_TITLE = '냉전의 목격자 — 감시 속에서 내리는 선택';

/** 제목 후보 (교사가 고를 때 참고용, 화면에는 쓰지 않음) */
export const APP_TITLE_CANDIDATES = [
  '커튼 뒤의 시선 — 냉전에서 AI까지',
  '레드라인: 냉전의 감시자들',
] as const;

/** 학급 코드 길이와 글자 모음 (헷갈리는 0·O·1·I·L 은 뺐다) */
export const CLASS_CODE_LENGTH = 6;
export const CLASS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** 입력 길이 제한 — firestore.rules 와 같은 값이어야 한다. */
export const LIMITS = {
  className: 30,
  nickname: 10,
  studentNumberMax: 99,
  pinLength: 4,
  answer: 500,
  declarationKeep: 30,
  declarationEra: 40,
  declarationLesson: 80,
  declarationFree: 300,
} as const;

/** PIN 해시에 섞는 앱 고유 문자열 (비밀 값은 아니며, 다른 앱의 해시와 섞이지 않게 하는 용도) */
export const PIN_SALT = 'cold-war-witness/v1';

/** 가상 인물 안내 문구 — 챕터 화면 하단에 항상 표시 */
export const FICTION_NOTICE = '이 인물은 실제 역사적 상황을 바탕으로 만든 가상 인물입니다.';

/** 입장 화면 개인정보 안내 문구 */
export const PRIVACY_NOTICE = '실명 대신 번호와 닉네임만 입력하세요.';
