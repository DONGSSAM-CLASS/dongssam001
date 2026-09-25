import { useState } from 'react';
import { Award, ImageDown, Pencil, Printer, FolderOpen } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { PrincipleIcon } from '../../components/icons';
import { Button, LinkButton, Notice, Stamp } from '../../components/ui';
import { StudentBadge } from './StudentHome';
import { useReadyStudent } from '../../app/StudentContext';
import { PRINCIPLES } from '../../data/principles';
import { APP_TITLE } from '../../config';
import { drawCertificate } from '../../lib/certificate';
import { declarationSentence } from '../../lib/josa';

export default function CertificatePage() {
  const { student, session } = useReadyStudent();
  const [busy, setBusy] = useState(false);
  const d = student.declaration;

  if (!d) {
    return (
      <Layout right={<StudentBadge />}>
        <Notice tone="info">
          아직 선언문을 제출하지 않았어요.
          <div className="mt-3">
            <LinkButton to="/play/finale">선언문 쓰러 가기</LinkButton>
          </div>
        </Notice>
      </Layout>
    );
  }

  const sentence = declarationSentence(d);
  const cards = PRINCIPLES.filter((p) => student.cards.includes(p.id));
  const date = d.submittedAt?.toDate?.() ?? new Date();
  const dateText = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

  const saveImage = async () => {
    setBusy(true);
    try {
      const url = await drawCertificate({
        appTitle: APP_TITLE,
        className: session.className,
        number: student.number,
        nickname: student.nickname,
        sentence,
        free: d.free,
        cards: cards.map((c) => ({ icon: c.icon, name: c.name, color: c.color })),
        dateText,
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI윤리실천인증서_${student.number}번.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout right={<StudentBadge />}>
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <Button onClick={() => window.print()}>
          <Printer className="h-5 w-5" aria-hidden="true" />
          인쇄하기
        </Button>
        <Button variant="secondary" onClick={saveImage} disabled={busy}>
          <ImageDown className="h-5 w-5" aria-hidden="true" />
          {busy ? '만드는 중…' : '이미지로 저장'}
        </Button>
        <LinkButton to="/play/finale" variant="ghost">
          <Pencil className="h-5 w-5" aria-hidden="true" />
          선언문 고치기
        </LinkButton>
        <LinkButton to="/play" variant="ghost">
          <FolderOpen className="h-5 w-5" aria-hidden="true" />
          사건 파일 목록
        </LinkButton>
      </div>

      <article
        className="dossier relative mx-auto flex max-w-2xl flex-col gap-5 border-4 border-double border-secondary-content/40 px-6 py-10 text-center sm:px-10"
        aria-label="AI 윤리 실천 인증서"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-content">
          <Award className="h-9 w-9" aria-hidden="true" />
        </span>
        <p className="text-[15px] text-ink-soft">{APP_TITLE}</p>
        <h1 className="typewriter text-3xl font-extrabold sm:text-4xl">AI 윤리 실천 인증서</h1>
        <p className="text-lg">
          {session.className} · {student.number}번 <strong>{student.nickname}</strong>
        </p>
        <p className="text-left text-[20px] font-bold leading-relaxed">{sentence}</p>
        {d.free && <p className="whitespace-pre-wrap text-left text-[17px]">{d.free}</p>}
        <div>
          <p className="text-[15px] text-ink-soft">모은 원칙 카드 {cards.length}장</p>
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {cards.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[15px] font-bold text-white"
                style={{ backgroundColor: c.color }}
              >
                <PrincipleIcon id={c.id} className="h-4 w-4" />
                {c.name}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4">{dateText}</p>
        <div className="absolute right-6 bottom-6" aria-hidden="true">
          <Stamp tone="declass" animate>
            기밀 해제
          </Stamp>
        </div>
      </article>
    </Layout>
  );
}
