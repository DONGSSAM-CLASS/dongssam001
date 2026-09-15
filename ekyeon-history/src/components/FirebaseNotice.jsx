import { isFirebaseConfigured } from '../lib/firebase';

// .env 의 Firebase 설정값이 아직 없을 때 화면이 깨지지 않도록 안내만 보여 줍니다.
export default function FirebaseNotice() {
  if (isFirebaseConfigured) return null;
  return (
    <p className="notice">
      Firebase 설정이 아직 연결되지 않아 회원 기능을 사용할 수 없습니다.
      운영자는 <code>.env</code> 파일에 Firebase 웹 앱 설정값을 넣어 주세요.
    </p>
  );
}
