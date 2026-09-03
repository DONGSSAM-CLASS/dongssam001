import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore } from 'firebase/firestore';
const app = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-history-globe', appId: '1:demo:web:demo' });
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
await signInWithEmailAndPassword(auth, 'demo24-13@student.local', '1234#DEMO24');
for (const id of ['demo_session_13']) {
  try { const s = await getDoc(doc(db, 'student_work', id)); console.log('READ', id, s.exists() ? `pins=${(s.data() as {pins:unknown[]}).pins.length}` : 'NOT FOUND'); }
  catch (e) { console.log('READ FAIL', id, (e as {code?:string}).code); }
}
try { const m = await getDoc(doc(db, 'class_members', 'demo_class_13')); console.log('member', m.exists(), m.data()?.uid?.slice(0,6)); } catch (e) { console.log('member FAIL', (e as {code?:string}).code); }
process.exit(0);
