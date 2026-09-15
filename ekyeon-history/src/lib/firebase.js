import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// .env 가 아직 채워지지 않은 상태(초기 셋업·디자인 확인)에서도 화면이 뜨도록 합니다.
// 값이 채워지면 아래 플래그가 true 가 되고 인증·Firestore 가 정상 동작합니다.
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app = null;
let authInstance = null;
let dbInstance = null;

if (isFirebaseConfigured) {
  app = initializeApp(config);

  // App Check: 무료 등급(reCAPTCHA v3). 키가 없으면 건너뜁니다.
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  authInstance = getAuth(app);
  dbInstance = getFirestore(app);

  // 로컬 에뮬레이터 (npm run emulate)
  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
    connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
  }
} else if (import.meta.env.DEV) {
  console.warn('[ekyeon-history] Firebase 설정값(.env)이 없어 인증·데이터 기능이 꺼진 상태로 실행합니다.');
}

export { app };
export const auth = authInstance;
export const db = dbInstance;
