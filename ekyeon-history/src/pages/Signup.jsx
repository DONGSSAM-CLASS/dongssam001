import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Info } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { CONTACT_EMAIL, MEMBER_TYPES, MEMBER_TYPE_MAP } from '../lib/constants';
import { readable } from '../lib/errors';
import SectionTitle from '../components/SectionTitle';
import FirebaseNotice from '../components/FirebaseNotice';

// 가입 화면에서 고를 수 있는 유형 — 운영진(staff)은 승인 후 운영진이 직접 올려 줍니다.
const SIGNUP_TYPES = MEMBER_TYPES.filter((type) => type.id !== 'staff');

const EMPTY = {
  email: '', password: '', password2: '',
  displayName: '', school: '', region: '', subject: '역사', intro: '',
};

export default function Signup() {
  const [params] = useSearchParams();
  const requested = params.get('type');
  const [type, setType] = useState(
    SIGNUP_TYPES.some((t) => t.id === requested) ? requested : 'member'
  );
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isFirebaseConfigured) return setError('아직 회원 기능이 연결되지 않았습니다.');
    if (form.password.length < 8) return setError('비밀번호는 8자 이상으로 정해 주세요.');
    if (form.password !== form.password2) return setError('비밀번호 확인이 일치하지 않습니다.');
    if (!form.displayName.trim()) return setError('이름을 입력해 주세요.');

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await updateProfile(cred.user, { displayName: form.displayName.trim() });
      await sendEmailVerification(cred.user);

      // 가입 문서는 언제나 승인 대기 상태로만 만들어집니다(보안 규칙에서도 강제).
      await setDoc(doc(db, 'members', cred.user.uid), {
        uid: cred.user.uid,
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        school: form.school.trim(),
        region: form.region.trim(),
        subject: form.subject.trim(),
        intro: form.intro.trim(),
        memberType: type,
        status: 'pending',
        role: 'member',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate('/pending', { replace: true });
    } catch (err) {
      setError(readable(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page--narrow">
      <SectionTitle
        eyebrow="Join us"
        title="역사연구팀 회원 가입"
        lead="가입 신청을 보내면 운영진 확인 후 승인해 드립니다. 승인된 연구팀 교사는 수업 공간에 직접 글을 올릴 수 있습니다."
      />

      <FirebaseNotice />

      <div className="typetabs" role="tablist" aria-label="회원 유형">
        {SIGNUP_TYPES.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={type === t.id}
            className={`typetab ${type === t.id ? 'is-active' : ''}`}
            onClick={() => setType(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="typetabs__desc">{MEMBER_TYPE_MAP[type].desc}</p>

      <form className="form" onSubmit={submit}>
        <label>
          메일 주소
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>
        <div className="form__row">
          <label>
            비밀번호 (8자 이상)
            <input type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" />
          </label>
          <label>
            비밀번호 확인
            <input type="password" value={form.password2} onChange={set('password2')} required autoComplete="new-password" />
          </label>
        </div>
        <div className="form__row">
          <label>
            이름
            <input value={form.displayName} onChange={set('displayName')} required maxLength={40} />
          </label>
          <label>
            담당 과목
            <input value={form.subject} onChange={set('subject')} placeholder="역사" />
          </label>
        </div>
        <div className="form__row">
          <label>
            소속 학교
            <input value={form.school} onChange={set('school')} />
          </label>
          <label>
            지역
            <input value={form.region} onChange={set('region')} placeholder="서울" />
          </label>
        </div>
        <label>
          함께하고 싶은 활동 · 관심 주제
          <textarea value={form.intro} onChange={set('intro')} rows={4} maxLength={500} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn btn--solid btn--lg" disabled={busy || !isFirebaseConfigured} type="submit">
          {busy ? '보내는 중…' : '가입 신청 보내기'}
        </button>

        <div className="join-note">
          <Info />
          <span>
            가입 신청은 항상 <strong>승인 대기</strong> 상태로 접수됩니다. 스스로 등급을 올릴 수 없으며,
            운영진 승인 후에 등록 권한이 생깁니다. 문의: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </span>
        </div>
        <p className="hint">이미 계정이 있나요? <Link to="/login">회원 로그인</Link></p>
      </form>
    </div>
  );
}
