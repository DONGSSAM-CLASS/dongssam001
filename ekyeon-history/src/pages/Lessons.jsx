import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, writeBatch } from 'firebase/firestore';
import { Edit3, ExternalLink, EyeOff, Info, Trash2, UserPlus } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { readable } from '../lib/errors';
import { lessonYear, loadLessons } from '../lib/lessons';
import { LESSON_TYPES } from '../lib/constants';
import SectionTitle from '../components/SectionTitle';
import LessonComposer from '../components/LessonComposer';

export default function Lessons() {
  const { user, member, canWriteLesson, canManageContent, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [state, setState] = useState('loading');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [tagFilter, setTagFilter] = useState('전체');

  const load = async () => {
    if (loading) return;
    setState('loading');
    try {
      const rows = await loadLessons({ uid: user?.uid, canManageContent });
      setItems(rows);
      setState('ready');
    } catch (err) {
      setError(readable(err));
      setState('error');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.uid, canManageContent]);

  const tags = useMemo(() => {
    const all = new Set();
    items.forEach((item) => (item.tags || []).forEach((tag) => all.add(tag)));
    return [...all].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [items]);

  const filtered = useMemo(() => items.filter((item) => {
    if (typeFilter !== '전체' && item.type !== typeFilter) return false;
    if (tagFilter !== '전체' && !(item.tags || []).includes(tagFilter)) return false;
    return true;
  }), [items, typeFilter, tagFilter]);

  const byYear = useMemo(() => {
    const groups = new Map();
    filtered.forEach((item) => {
      const year = lessonYear(item);
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(item);
    });
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const saved = async (message) => { setEditing(null); setNotice(message); setError(''); await load(); };

  const remove = async (item) => {
    if (!window.confirm(`‘${item.title}’ 기록을 삭제할까요?`)) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'lessons', item.id));
      await batch.commit();
      setNotice('수업 기록을 삭제했습니다.');
      setEditing(null);
      await load();
    } catch (err) {
      setError(readable(err));
    }
  };

  return (
    <div className="page">
      <SectionTitle
        eyebrow="Lessons"
        title="에크연 역사쌤들의 수업 공간"
        lead="연구팀 선생님들의 수업 나눔 자료와 수업 공개 실적을 한곳에 모았습니다. 연도별로 차곡차곡 쌓아 갑니다."
      />

      <div className="statstrip">
        <span className="statstrip__num">{items.length}건</span>
        <span className="statstrip__label">지금까지 쌓인 수업 기록</span>
      </div>

      {!loading && !canWriteLesson && (
        <div className="guest-note">
          <UserPlus />
          <span>
            <strong>회원 가입 후 관리자 승인을 받으면 직접 올릴 수 있습니다</strong>
            <small>
              지금은 등록된 기록을 읽어 보실 수 있습니다.{' '}
              <Link className="font-semibold text-primary underline underline-offset-4" to="/signup">회원 가입하기</Link>
              {member?.status === 'pending' && ' — 신청하신 가입은 승인 대기 중입니다.'}
            </small>
          </span>
        </div>
      )}

      {canWriteLesson && (
        <LessonComposer editing={editing} onCancel={() => setEditing(null)} onSaved={saved} />
      )}
      {notice && <p className="success resource-notice">{notice}</p>}
      {error && <p className="error resource-notice">{error}</p>}

      <div className="filterbar">
        <div className="filterbar__row">
          <span className="filterbar__title">유형</span>
          {['전체', ...LESSON_TYPES].map((type) => (
            <button
              key={type}
              type="button"
              className={`filterchip ${typeFilter === type ? 'is-on' : ''}`}
              aria-pressed={typeFilter === type}
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
        {tags.length > 0 && (
          <div className="filterbar__row">
            <span className="filterbar__title">태그</span>
            {['전체', ...tags].map((tag) => (
              <button
                key={tag}
                type="button"
                className={`filterchip ${tagFilter === tag ? 'is-on' : ''}`}
                aria-pressed={tagFilter === tag}
                onClick={() => setTagFilter(tag)}
              >
                {tag === '전체' ? '전체' : `#${tag}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {state === 'loading' && <div className="state">수업 기록을 불러오는 중…</div>}
      {state === 'error' && <div className="state">수업 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>}
      {state === 'ready' && filtered.length === 0 && (
        <div className="state">
          <h2>아직 등록된 수업 기록이 없습니다</h2>
          <p>연구팀 선생님들의 첫 기록을 기다리고 있습니다.</p>
        </div>
      )}

      {byYear.map(([year, rows]) => (
        <section className="yearsec" key={year}>
          <div className="yearsec__head">
            <span className="yearsec__year">{year}</span>
            <span className="yearsec__count">{rows.length}건</span>
          </div>
          <div className="cards">
            {rows.map((item) => (
              <article key={item.id} className="lessoncard">
                {item.thumbnailUrl && (
                  <img className="lessoncard__thumb" src={item.thumbnailUrl} alt="" loading="lazy" />
                )}
                <div className="lessoncard__top">
                  {item.type && <span className="card__type">{item.type}</span>}
                  {item.published === false && (
                    <span className="lessoncard__private"><EyeOff className="mr-1 inline h-3 w-3" />비공개</span>
                  )}
                  {item.lessonDate && <span className="lessoncard__date">{item.lessonDate}</span>}
                </div>
                <h3>{item.title}</h3>
                <p className="lessoncard__meta">
                  {[item.schoolLevel, item.grade, item.unit].filter(Boolean).join(' · ')}
                  {item.authorName ? ` / 등록 ${item.authorName}` : ''}
                </p>
                {item.summary && <p className="lessoncard__summary">{item.summary}</p>}
                {item.body && <p className="lessoncard__body">{item.body}</p>}
                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <ul className="chips">{item.tags.map((tag) => <li key={tag}>#{tag}</li>)}</ul>
                )}
                {item.link && (
                  <a className="mt-4 inline-flex items-center gap-1 font-semibold text-primary" href={item.link} target="_blank" rel="noreferrer noopener">
                    자료 열기 <ExternalLink size={15} />
                  </a>
                )}
                {(user?.uid === item.ownerUid || canManageContent) && (
                  <div className="lessoncard__actions">
                    <button className="btn btn--sm btn--ghost" type="button" onClick={() => setEditing(item)}><Edit3 />수정</button>
                    <button className="btn btn--sm btn-ghost text-error" type="button" onClick={() => remove(item)}><Trash2 />삭제</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="hint">
        <Info className="mr-1 inline h-4 w-4" aria-hidden="true" />
        자료는 파일 업로드 대신 외부 공유 링크로 연결합니다. 링크 열람 권한을 함께 확인해 주세요.
      </p>
    </div>
  );
}
