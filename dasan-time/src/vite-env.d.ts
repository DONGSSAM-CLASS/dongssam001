/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  /** '1' 이면 로컬 에뮬레이터에 붙는다 (개발용) */
  readonly VITE_USE_EMULATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
