/**
 * Firebase 초기화 (Spark 요금제 범위: Auth + Firestore + Hosting 만 사용)
 * - 설정값은 .env 의 VITE_FIREBASE_* 에서만 읽는다(하드코딩 금지).
 * - VITE_USE_EMULATORS=true 이면 로컬 에뮬레이터(Auth 9099 / Firestore 8080)에 연결한다.
 * - Firestore 는 영속 로컬 캐시를 켜서 재방문·탭 간 중복 읽기를 줄인다(무료 할당량 절약).
 */
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const useEmulators = env.VITE_USE_EMULATORS === 'true';
export const isFirebaseConfigured = Boolean(firebaseConfig.projectId);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function init() {
  if (getApps().length) return;
  app = initializeApp({
    ...firebaseConfig,
    // 에뮬레이터 전용 실행 시 실제 키가 없어도 동작하도록 데모 값을 채운다
    apiKey: firebaseConfig.apiKey || (useEmulators ? 'demo-api-key' : ''),
    projectId: firebaseConfig.projectId || (useEmulators ? 'demo-history-globe' : ''),
    appId: firebaseConfig.appId || (useEmulators ? '1:demo:web:demo' : ''),
  });

  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  if (useEmulators) {
    const host = env.VITE_EMULATOR_HOST || '127.0.0.1';
    const authPort = Number(env.VITE_AUTH_EMULATOR_PORT || 9099);
    const fsPort = Number(env.VITE_FIRESTORE_EMULATOR_PORT || 8080);
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, fsPort);
  }
}

init();

export { app, auth, db };
