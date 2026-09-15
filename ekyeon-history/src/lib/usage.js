import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// 이용현황 집계: 개인정보를 저장하지 않고 날짜·페이지별 카운터만 +1 합니다.
// 보안 규칙에서 '1 증가'만 허용하므로 임의 조작이 불가능합니다.
const today = () => new Date().toISOString().slice(0, 10);

export async function logVisit(pathname) {
  if (!isFirebaseConfigured) return;
  const page = pathname === '/' ? 'home' : pathname.replace(/\//g, '_').replace(/^_/, '');
  const date = today();
  const onceKey = `visit:${date}:${page}`;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(onceKey)) return;

  const write = (id, extra) =>
    setDoc(
      doc(db, 'stats', id),
      { key: id, date, count: increment(1), updatedAt: serverTimestamp(), ...extra },
      { merge: true }
    );

  try {
    await write(`daily_${date}`, { page: 'all' });
    await write(`page_${date}_${page}`, { page });
    sessionStorage?.setItem(onceKey, '1');
  } catch (e) {
    // 집계 실패가 화면을 막지 않도록 조용히 무시합니다.
    if (import.meta.env.DEV) console.warn('usage log skipped', e);
  }
}
