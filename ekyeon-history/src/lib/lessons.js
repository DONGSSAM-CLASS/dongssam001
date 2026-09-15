import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const dedupe = (rows) => {
  const map = new Map();
  rows.forEach((row) => map.set(row.id, row));
  return [...map.values()];
};

// 수업 기록 정렬: 수업 일자 최신순, 일자가 없으면 등록 시각으로 보완합니다.
export const lessonTime = (item) => {
  if (item.lessonDate) return new Date(item.lessonDate).getTime();
  return (item.createdAt?.seconds || 0) * 1000;
};

export const lessonYear = (item) => {
  const time = lessonTime(item);
  return time ? String(new Date(time).getFullYear()) : '연도 미상';
};

const newestFirst = (a, b) => lessonTime(b) - lessonTime(a);

// 공개 글은 누구나, 비공개 글은 본인 것과 운영진 전체를 함께 불러옵니다.
export async function loadLessons({ uid, canManageContent }) {
  if (!isFirebaseConfigured) return [];
  if (canManageContent) {
    const snap = await getDocs(collection(db, 'lessons'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(newestFirst);
  }

  const published = await getDocs(query(collection(db, 'lessons'), where('published', '==', true)));
  const rows = published.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (uid) {
    const mine = await getDocs(query(collection(db, 'lessons'), where('ownerUid', '==', uid)));
    rows.push(...mine.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  return dedupe(rows).sort(newestFirst);
}
