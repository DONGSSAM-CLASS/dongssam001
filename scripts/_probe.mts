import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';
const app = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-history-globe', appId: '1:demo:web:demo' });
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
await signInWithEmailAndPassword(auth, 'teacher@example.com', 'password123');
const t = setTimeout(() => { console.log('TIMEOUT: write did not resolve in 8s'); process.exit(1); }, 8000);
try {
  await updateDoc(doc(db, 'sessions', 'demo_session'), {
    follow: { enabled: true, year: 1200, camera: { lat: 30, lon: 105, zoom: 2.6 }, updatedAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  });
  console.log('WRITE OK');
} catch (e) { console.log('WRITE FAIL', (e as {code?: string}).code, (e as Error).message.slice(0, 200)); }
clearTimeout(t);
process.exit(0);
