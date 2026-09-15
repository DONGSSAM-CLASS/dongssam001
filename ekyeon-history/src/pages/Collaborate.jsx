import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  BookOpen, Check, ClipboardCopy, Copy, GraduationCap, Handshake, Mail, PenTool, Send, Users,
} from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { notifyCollabRequest } from '../lib/notifications';
import { COLLAB_CATEGORIES, CONTACT_EMAIL } from '../lib/constants';

const KINDS = [
  { icon: GraduationCap, title: '교원 연수·강의', desc: '역사과 에듀테크 수업 사례와 도구 활용을 주제로 연수와 특강을 진행해 왔습니다.' },
  { icon: BookOpen, title: '수업 자료 및 웹앱 공동 개발', desc: '수업에 필요한 자료와 웹앱을 현장 교사와 함께 설계하고 만듭니다.' },
  { icon: Users, title: '학교·기관 프로젝트', desc: '학교와 교육기관의 역사 교육 프로젝트에 연구팀이 함께 참여합니다.' },
  { icon: PenTool, title: '집필·자문', desc: '교재와 자료 집필, 역사 교육 관련 자문에 참여합니다.' },
];

const STEPS = [
  { title: '요청 보내기', desc: '아래 양식을 채워 메일로 보내 주시거나, 내용을 복사해 직접 메일로 보내 주세요.' },
  { title: '담당자 확인 및 회신', desc: '영업일 기준 3일 이내 회신을 목표로 확인해 드립니다.' },
  { title: '사전 협의', desc: '일정과 대상, 범위와 형태를 함께 조율합니다.' },
  { title: '진행 및 결과 공유', desc: '협업을 진행하고, 결과와 자료를 함께 정리해 남깁니다.' },
];

const EMPTY = {
  category: COLLAB_CATEGORIES[0], orgName: '', contactName: '', contactInfo: '',
  schedule: '', audience: '', message: '',
};

const buildText = (form) => [
  '[에듀테크 교사 연구회 역사연구팀 협업 요청]',
  '',
  `요청 구분: ${form.category}`,
  `기관 또는 소속: ${form.orgName}`,
  `담당자 이름: ${form.contactName}`,
  `회신 연락처: ${form.contactInfo}`,
  `희망 일정: ${form.schedule}`,
  `대상과 인원: ${form.audience}`,
  '',
  '요청 내용:',
  form.message,
].join('\n');

export default function Collaborate() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const validate = () => {
    if (!form.contactName.trim()) { setError('담당자 이름을 입력해 주세요.'); return false; }
    if (!form.contactInfo.trim()) { setError('회신 연락처를 입력해 주세요.'); return false; }
    setError('');
    return true;
  };

  // 접수 기록과 알림은 보조 수단입니다. 실패해도 메일·복사 경로는 그대로 동작합니다.
  const record = async () => {
    if (isFirebaseConfigured) {
      try {
        await addDoc(collection(db, 'collabRequests'), {
          category: form.category,
          orgName: form.orgName.trim(),
          contactName: form.contactName.trim(),
          contactInfo: form.contactInfo.trim(),
          schedule: form.schedule.trim(),
          audience: form.audience.trim(),
          message: form.message.trim(),
          createdAt: serverTimestamp(),
        });
      } catch {
        // 접수 기록 실패가 요청 자체를 막지 않도록 조용히 넘어갑니다.
      }
    }
    await notifyCollabRequest({ ...form });
  };

  const sendMail = async () => {
    if (!validate()) return;
    await record();
    const subject = `[협업 요청] ${form.category} - ${form.orgName || form.contactName}`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildText(form))}`;
    window.location.href = href;
    setNotice('메일 앱을 열었습니다. 메일이 열리지 않으면 아래 [양식 내용 복사]를 눌러 직접 보내 주세요.');
  };

  const copyText = async () => {
    if (!validate()) return;
    const text = buildText(form);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try { document.execCommand('copy'); } catch { /* 무시 */ }
      document.body.removeChild(field);
    }
    await record();
    setCopied(true);
    setNotice(`양식 내용을 복사했습니다. ${CONTACT_EMAIL} 으로 붙여넣어 보내 주세요.`);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="page">
      <SectionTitle
        eyebrow="Collaborate"
        title="강의 및 협업 요청"
        lead="개인과 기관 모두 편하게 요청해 주세요. 담당자가 확인한 뒤 회신드립니다."
      />

      <h3 className="subhead">이런 협업을 함께해 왔습니다</h3>
      <div className="cards xl:grid-cols-4">
        {KINDS.map((kind) => {
          const Icon = kind.icon;
          return (
            <article key={kind.title} className="card">
              <span className="typecard__icon"><Icon /></span>
              <h3>{kind.title}</h3>
              <p>{kind.desc}</p>
            </article>
          );
        })}
      </div>

      <h3 className="subhead">협업 진행 절차</h3>
      <ol className="steps">
        {STEPS.map((step, index) => (
          <li className="step" key={step.title}>
            <span className="step__no">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </li>
        ))}
      </ol>

      <h3 className="subhead">요청 양식</h3>
      <form className="form" onSubmit={(event) => { event.preventDefault(); sendMail(); }}>
        <div className="form__row">
          <label>요청 구분
            <select value={form.category} onChange={set('category')}>
              {COLLAB_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>기관 또는 소속
            <input value={form.orgName} onChange={set('orgName')} maxLength={120} placeholder="○○중학교 / 개인" />
          </label>
        </div>
        <div className="form__row">
          <label>담당자 이름
            <input value={form.contactName} onChange={set('contactName')} maxLength={40} required />
          </label>
          <label>회신 연락처
            <input value={form.contactInfo} onChange={set('contactInfo')} maxLength={200} placeholder="메일 주소 또는 전화번호" required />
          </label>
        </div>
        <div className="form__row">
          <label>희망 일정
            <input value={form.schedule} onChange={set('schedule')} placeholder="2026년 11월 중 평일 오후" />
          </label>
          <label>대상과 인원
            <input value={form.audience} onChange={set('audience')} placeholder="중학교 역사 교사 30명" />
          </label>
        </div>
        <label>요청 내용
          <textarea rows={7} value={form.message} onChange={set('message')} maxLength={2000} placeholder="어떤 협업을 원하시는지 편하게 적어 주세요." />
        </label>

        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="success">{notice}</p>}

        <div className="flex flex-wrap gap-3">
          <button className="btn btn--solid btn--lg" type="submit"><Send />메일 보내기</button>
          <button className="btn btn--ghost btn--lg" type="button" onClick={copyText}>
            {copied ? <Check /> : <Copy />}{copied ? '복사했습니다' : '양식 내용 복사'}
          </button>
        </div>
        <p className="hint">
          <ClipboardCopy className="mr-1 inline h-4 w-4" aria-hidden="true" />
          메일 앱이 열리지 않는 환경이라면 [양식 내용 복사]를 눌러 아래 주소로 보내 주세요.
        </p>
      </form>

      <div className="linkcard mt-8">
        <div>
          <h3><Handshake className="mr-2 inline h-5 w-5 text-primary" aria-hidden="true" />바로 메일로 문의하기</h3>
          <p>양식 없이 편하게 문의하셔도 됩니다.</p>
        </div>
        <a className="btn btn--solid" href={`mailto:${CONTACT_EMAIL}`}><Mail />{CONTACT_EMAIL}</a>
      </div>
    </div>
  );
}
