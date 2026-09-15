// Firebase 오류 코드를 사용자에게 읽히는 문장으로 바꿉니다.
const MAP = {
  'auth/invalid-email': '메일 주소 형식을 확인해 주세요.',
  'auth/email-already-in-use': '이미 가입된 메일 주소입니다. 로그인해 주세요.',
  'auth/weak-password': '비밀번호는 8자 이상, 영문과 숫자를 섞어 주세요.',
  'auth/invalid-credential': '아이디 또는 비밀번호가 맞지 않습니다.',
  'auth/user-not-found': '등록되지 않은 계정입니다.',
  'auth/wrong-password': '비밀번호가 맞지 않습니다.',
  'auth/too-many-requests': '시도가 너무 잦습니다. 잠시 후 다시 해주세요.',
  'permission-denied': '이 작업을 수행할 권한이 없습니다.',
  'failed-precondition': '데이터 색인이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.',
};

export function readable(err) {
  const code = err?.code || '';
  return MAP[code] || err?.message || '알 수 없는 오류가 발생했습니다.';
}
