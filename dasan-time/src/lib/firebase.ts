import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * .env.local 이 아직 없으면 Firebase를 켜지 않는다.
 * 이렇게 해야 키 없이도 체험 모드로 앱을 열어 볼 수 있다.
 */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase 설정이 없어요. .env.local 파일에 VITE_FIREBASE_* 값을 넣어 주세요. (README 참고)',
    );
  }
  if (!app) app = initializeApp(config);
  return app;
}

/** 개발 중 에뮬레이터에 붙일지 (.env.local 에 VITE_USE_EMULATOR=1 을 넣으면 켜진다) */
const useEmulator = import.meta.env.VITE_USE_EMULATOR === '1';

export function auth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(ensureApp());
    if (useEmulator) {
      connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
  }
  return authInstance;
}

export function db(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(ensureApp());
    if (useEmulator) connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
  }
  return dbInstance;
}
