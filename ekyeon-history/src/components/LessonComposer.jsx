import { useEffect, useRef, useState } from 'react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Edit3, LoaderCircle, Plus, Save, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { readable } from '../lib/errors';
import { LESSON_TYPES, SCHOOL_LEVELS } from '../lib/constants';

const EMPTY = {
  type: LESSON_TYPES[0], title: '', schoolLevel: SCHOOL_LEVELS[1], grade: '', unit: '',
  summary: '', body: '', lessonDate: '', link: '', thumbnailUrl: '', tags: '', published: true,
};

const cleanTags = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 12);

export default function LessonComposer({ editing, onCancel, onSaved }) {
  const { user, member } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (!editing) { setForm(EMPTY); return; }
    setForm({
      type: editing.type || LESSON_TYPES[0],
      title: editing.title || '',
      schoolLevel: editing.schoolLevel || SCHOOL_LEVELS[1],
      grade: editing.grade || '',
      unit: editing.unit || '',
      summary: editing.summary || '',
      body: editing.body || '',
      lessonDate: editing.lessonDate || '',
      link: editing.link || '',
      thumbnailUrl: editing.thumbnailUrl || '',
      tags: Array.isArray(editing.tags) ? editing.tags.join(', ') : '',
      published: editing.published !== false,
    });
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [editing]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return setError('제목을 입력해 주세요.');
    setBusy(true); setError('');
    try {
      const ref = editing ? doc(db, 'lessons', editing.id) : doc(collection(db, 'lessons'));
      const common = {
        type: form.type,
        title: form.title.trim(),
        schoolLevel: form.schoolLevel,
        grade: form.grade.trim(),
        unit: form.unit.trim(),
        summary: form.summary.trim(),
        body: form.body.trim(),
        lessonDate: form.lessonDate,
        link: form.link.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
        tags: cleanTags(form.tags),
        published: form.published,
        updatedAt: serverTimestamp(),
      };
      const data = editing ? common : {
        ...common,
        ownerUid: user.uid,
        authorName: member.displayName || user.email,
        createdAt: serverTimestamp(),
      };
      const batch = writeBatch(db);
      batch.set(ref, data, { merge: true });
      await batch.commit();
      setForm(EMPTY);
      await onSaved(editing ? '수업 기록을 수정했습니다.' : '수업 기록을 등록했습니다.');
    } catch (err) {
      setError(readable(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <form ref={formRef} className="form member-resource-form" onSubmit={submit}>
      <div className="editor-heading">
        <h3>{editing ? <><Edit3 />수업 기록 수정</> : <><Plus />수업 기록 등록</>}</h3>
        {editing && <button className="btn btn--sm btn--ghost" type="button" onClick={onCancel}><X />취소</button>}
      </div>
      <p className="member-resource-form__guide">
        파일은 구글 드라이브·블로그·유튜브 등에서 공유 링크를 만든 뒤 주소로 등록해 주세요.
        링크의 열람 권한도 함께 확인해 주시면 좋습니다.
      </p>

      <div className="form__row">
        <label>유형
          <select value={form.type} onChange={set('type')}>
            {LESSON_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label>수업 일자
          <input type="date" value={form.lessonDate} onChange={set('lessonDate')} />
        </label>
      </div>

      <label>제목
        <input value={form.title} onChange={set('title')} maxLength={120} required />
      </label>

      <div className="form__row">
        <label>학교급
          <select value={form.schoolLevel} onChange={set('schoolLevel')}>
            {SCHOOL_LEVELS.map((level) => <option key={level}>{level}</option>)}
          </select>
        </label>
        <label>학년
          <input value={form.grade} onChange={set('grade')} placeholder="2학년" maxLength={30} />
        </label>
      </div>

      <label>단원 또는 주제
        <input value={form.unit} onChange={set('unit')} placeholder="고려의 성립과 변천" maxLength={120} />
      </label>

      <label>한 줄 요약
        <input value={form.summary} onChange={set('summary')} maxLength={300} />
      </label>

      <label>본문
        <textarea rows={7} value={form.body} onChange={set('body')} maxLength={5000} />
      </label>

      <div className="media-fields">
        <p className="media-fields__title">자료 링크와 썸네일</p>
        <label>자료 링크 <span className="label-hint">구글 드라이브·블로그 등 외부 주소</span>
          <input type="url" value={form.link} onChange={set('link')} placeholder="https://" />
        </label>
        <label>썸네일 이미지 URL <span className="label-hint">선택</span>
          <input type="url" value={form.thumbnailUrl} onChange={set('thumbnailUrl')} placeholder="https://" />
        </label>
      </div>

      <label>태그 <span className="label-hint">쉼표로 구분, 최대 12개</span>
        <input value={form.tags} onChange={set('tags')} placeholder="고려, 사료탐구, 모둠수업" />
      </label>

      <label className="content-check">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
        />
        수업 공간에 공개하기 <span className="label-hint">해제하면 본인과 운영진에게만 보입니다</span>
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn btn--solid" type="submit" disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" /> : <Save />}
        {busy ? '저장 중…' : editing ? '수정 저장' : '수업 기록 등록'}
      </button>
    </form>
  );
}
