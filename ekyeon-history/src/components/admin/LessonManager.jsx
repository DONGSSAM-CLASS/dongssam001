import { useCallback, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { readable } from '../../lib/errors';
import { lessonTime } from '../../lib/lessons';

// 운영진용 수업 기록 관리 — 공개 전환과 삭제를 처리합니다.
export default function LessonManager() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const snap = await getDocs(collection(db, 'lessons'));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => lessonTime(b) - lessonTime(a)));
      setError('');
      setState('ready');
    } catch (err) {
      setError(readable(err));
      setState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePublished = async (item) => {
    try {
      await updateDoc(doc(db, 'lessons', item.id), {
        published: item.published === false,
        updatedAt: serverTimestamp(),
      });
      setNotice(item.published === false ? '공개로 바꿨습니다.' : '비공개로 바꿨습니다.');
      await load();
    } catch (err) { setError(readable(err)); }
  };

  const remove = async (item) => {
    if (!window.confirm(`‘${item.title}’ 기록을 삭제할까요?`)) return;
    try {
      await deleteDoc(doc(db, 'lessons', item.id));
      setNotice('수업 기록을 삭제했습니다.');
      await load();
    } catch (err) { setError(readable(err)); }
  };

  return (
    <>
      <div className="content-manager__head">
        <div>
          <h3>수업 기록 관리</h3>
          <p>연구팀 선생님들이 올린 수업 기록 {items.length}건을 관리합니다.</p>
        </div>
      </div>
      {notice && <p className="success resource-notice">{notice}</p>}
      {error && <p className="error resource-notice">{error}</p>}
      {state === 'loading' && <div className="state">불러오는 중…</div>}
      {state === 'ready' && items.length === 0 && <div className="state manager-state">등록된 수업 기록이 없습니다.</div>}
      <div className="manager-list">
        {items.map((item) => (
          <article key={item.id} className="manager-item">
            {item.thumbnailUrl && <img className="manager-item__thumb" src={item.thumbnailUrl} alt="" loading="lazy" />}
            <div className="manager-item__body">
              <p className="manager-item__meta">
                {[item.type, item.lessonDate, item.authorName].filter(Boolean).join(' · ')}
                {item.published === false ? ' · 비공개' : ''}
              </p>
              <h4>{item.title}</h4>
              <p>{[item.schoolLevel, item.grade, item.unit].filter(Boolean).join(' · ')}</p>
              {item.summary && <p>{item.summary}</p>}
            </div>
            <div className="rowactions">
              <button className="btn btn--sm btn--ghost" type="button" onClick={() => togglePublished(item)}>
                {item.published === false ? <><Eye />공개</> : <><EyeOff />비공개</>}
              </button>
              <button className="btn btn--sm btn-ghost text-error" type="button" onClick={() => remove(item)}><Trash2 />삭제</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
