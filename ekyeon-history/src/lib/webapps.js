import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { PARENT_WEBAPPS, TEACHER_WEBAPPS } from '../data/webapps';

const byOrder = (a, b) => (a.order ?? 999) - (b.order ?? 999);

// Firestore `webapps` 에 공개 데이터가 있으면 그것을 쓰고, 없으면 시드 상수를 그대로 보여줍니다.
export async function loadWebApps() {
  const seed = { teacher: [...TEACHER_WEBAPPS].sort(byOrder), parent: [...PARENT_WEBAPPS].sort(byOrder) };
  if (!isFirebaseConfigured) return { ...seed, source: 'seed' };

  try {
    const snap = await getDocs(collection(db, 'webapps'));
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((row) => row.published !== false && row.url);
    if (rows.length === 0) return { ...seed, source: 'seed' };
    return {
      teacher: rows.filter((row) => row.group !== 'parent').sort(byOrder),
      parent: rows.filter((row) => row.group === 'parent').sort(byOrder),
      source: 'firestore',
    };
  } catch {
    // 규칙·네트워크 문제로 못 읽으면 시드 상수로 보여 줍니다.
    return { ...seed, source: 'seed' };
  }
}
