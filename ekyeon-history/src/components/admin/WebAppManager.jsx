import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { Edit3, LoaderCircle, Plus, Save, Trash2, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { readable } from '../../lib/errors';
import { ALL_SEED_WEBAPPS } from '../../data/webapps';

const EMPTY = { title: '', description: '', url: '', tags: '', order: '', group: 'teacher', published: true };
const cleanTags = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean);

// 운영진용 웹앱 관리 — Firestore 에 데이터가 없으면 갤러리는 시드 상수를 보여 줍니다.
export default function WebAppManager() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState('loading');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const editorRef = useRef(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const snap = await getDocs(collection(db, 'webapps'));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 999) - (b.order ?? 999)));
      setError('');
      setState('ready');
    } catch (err) { setError(readable(err)); setState('error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const reset = () => { setForm(EMPTY); setEditingId(null); setError(''); };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '', description: item.description || '', url: item.url || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      order: item.order ?? '', group: item.group || 'teacher', published: item.published !== false,
    });
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return setError('제목을 입력해 주세요.');
    if (!form.url.trim()) return setError('주소를 입력해 주세요.');
    setBusy(true); setError('');
    try {
      const ref = editingId ? doc(db, 'webapps', editingId) : doc(collection(db, 'webapps'));
      await setDoc(ref, {
        title: form.title.trim(),
        description: form.description.trim(),
        url: form.url.trim(),
        tags: cleanTags(form.tags),
        order: Number(form.order) || 999,
        group: form.group,
        published: form.published,
        updatedAt: serverTimestamp(),
        ...(!editingId && { createdAt: serverTimestamp() }),
      }, { merge: true });
      setNotice(editingId ? '웹앱 정보를 수정했습니다.' : '웹앱을 등록했습니다.');
      reset();
      await load();
    } catch (err) { setError(readable(err)); }
    finally { setBusy(false); }
    return undefined;
  };

  const remove = async (item) => {
    if (!window.confirm(`‘${item.title}’ 을 삭제할까요?`)) return;
    try {
      await deleteDoc(doc(db, 'webapps', item.id));
      setNotice('웹앱을 삭제했습니다.');
      await load();
    } catch (err) { setError(readable(err)); }
  };

  // 시드 상수 8건을 Firestore 로 한 번에 옮겨 둘 수 있습니다.
  const importSeed = async () => {
    if (!window.confirm('코드에 들어 있는 웹앱 8건을 Firestore 로 등록할까요?')) return;
    setBusy(true);
    try {
      await Promise.all(ALL_SEED_WEBAPPS.map((app, index) => setDoc(doc(db, 'webapps', app.id), {
        title: app.title,
        description: app.description,
        url: app.url,
        tags: [],
        order: app.order ?? index + 1,
        group: app.id === 'seed-edutech-teachers' ? 'parent' : 'teacher',
        published: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })));
      setNotice('시드 웹앱을 Firestore 로 등록했습니다.');
      await load();
    } catch (err) { setError(readable(err)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="content-manager__head">
        <div>
          <h3>웹앱 관리</h3>
          <p>Firestore 에 등록된 웹앱이 없으면 갤러리는 코드에 들어 있는 8건을 그대로 보여 줍니다.</p>
        </div>
        <button className="btn btn--sm btn--ghost" type="button" onClick={importSeed} disabled={busy}>
          시드 8건 불러오기
        </button>
      </div>

      {notice && <p className="success resource-notice">{notice}</p>}
      {error && <p className="error resource-notice">{error}</p>}

      <div className="manager-grid">
        <form className="form manager-editor" ref={editorRef} onSubmit={save}>
          <div className="editor-heading">
            <h4>{editingId ? <><Edit3 />웹앱 수정</> : <><Plus />웹앱 등록</>}</h4>
            {editingId && <button className="btn btn--sm btn--ghost" type="button" onClick={reset}><X />취소</button>}
          </div>
          <label>제목<input value={form.title} onChange={set('title')} maxLength={120} required /></label>
          <label>한 줄 설명<input value={form.description} onChange={set('description')} maxLength={200} /></label>
          <label>주소<input type="url" value={form.url} onChange={set('url')} placeholder="https://" required /></label>
          <div className="form__row">
            <label>구분
              <select value={form.group} onChange={set('group')}>
                <option value="teacher">선생님 개발 웹앱</option>
                <option value="parent">본원 연구회</option>
              </select>
            </label>
            <label>정렬 순서<input type="number" value={form.order} onChange={set('order')} placeholder="1" /></label>
          </div>
          <label>태그 <span className="label-hint">쉼표로 구분</span><input value={form.tags} onChange={set('tags')} /></label>
          <label className="content-check">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))} />
            갤러리에 공개
          </label>
          <button className="btn btn--solid" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Save />}{editingId ? '수정 저장' : '웹앱 등록'}
          </button>
        </form>

        <div className="manager-list">
          {state === 'loading' && <div className="state">불러오는 중…</div>}
          {state === 'ready' && items.length === 0 && (
            <div className="state manager-state">Firestore 에 등록된 웹앱이 없습니다. 갤러리는 코드의 8건을 보여 주는 중입니다.</div>
          )}
          {items.map((item) => (
            <article key={item.id} className="manager-item">
              <div className="manager-item__body">
                <p className="manager-item__meta">
                  {item.group === 'parent' ? '본원 연구회' : '선생님 개발'} · 순서 {item.order ?? '-'}
                  {item.published === false ? ' · 비공개' : ''}
                </p>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <p className="mono">{item.url}</p>
              </div>
              <div className="rowactions">
                <button className="btn btn--sm btn--ghost" type="button" onClick={() => edit(item)}><Edit3 />수정</button>
                <button className="btn btn--sm btn-ghost text-error" type="button" onClick={() => remove(item)}><Trash2 />삭제</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
