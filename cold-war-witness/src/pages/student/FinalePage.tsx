/**
 * FINALE — 나의 AI 윤리 실천 선언문
 * “나는 AI를 사용할 때 ___을(를) 지키겠습니다. 왜냐하면 냉전 시대의 ___에서 ___을(를) 배웠기 때문입니다.” + 자유 서술
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ScrollText, Send, Award as AwardIcon } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { PrincipleIcon, ValueIcon } from '../../components/icons';
import { Button, LinkButton, Notice, TextInput, friendlyError } from '../../components/ui';
import { PrincipleCardView } from '../../components/PrincipleCard';
import { WritingBox } from '../../components/WritingBox';
import { StudentBadge } from './StudentHome';
import { useReadyStudent } from '../../app/StudentContext';
import { CORE_VALUES, PRINCIPLES } from '../../data/principles';
import { saveDeclaration } from '../../lib/db';
import { LIMITS } from '../../config';
import type { PrincipleId } from '../../types/content';
import { eulReul } from '../../lib/josa';

/** ‘냉전 시대의 ___에서’ 빈칸 추천 (챕터 이야기에서) */
const ERA_SUGGESTIONS = ['슈타지의 감시', '매카시의 명단', '쿠바 미사일 위기'];
const FREE_STARTERS = ['AI를 쓸 때 나는', '친구들과 함께 지키고 싶은 것은', '냉전 시대를 살았던 사람들에게 하고 싶은 말은'];

export default function FinalePage() {
  const { student, cls, session } = useReadyStudent();
  const nav = useNavigate();
  const d = student.declaration;
  const [keep, setKeep] = useState(d?.keep ?? '');
  const [principleId, setPrincipleId] = useState<PrincipleId | null>(d?.principleId ?? null);
  const [era, setEra] = useState(d?.era ?? '');
  const [lesson, setLesson] = useState(d?.lesson ?? '');
  const [free, setFree] = useState(d?.free ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cls.unlocked.finale) {
    return (
      <Layout right={<StudentBadge />}>
        <Notice tone="warn">
          <Lock className="mr-1 inline h-4 w-4" aria-hidden="true" />선언문은 선생님이 열어 줄 때 쓸 수 있어요.
          <div className="mt-3">
            <LinkButton to="/play" variant="secondary">
              사건 파일 목록으로
            </LinkButton>
          </div>
        </Notice>
      </Layout>
    );
  }

  const owned = PRINCIPLES.filter((p) => student.cards.includes(p.id));
  const others = PRINCIPLES.filter((p) => !student.cards.includes(p.id));
  const ok = keep.trim() && era.trim() && lesson.trim();

  const submit = async () => {
    if (!ok) {
      setError('빈칸 세 개를 모두 채워 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveDeclaration(session.classId, session.studentId, {
        keep: keep.trim(),
        principleId,
        era: era.trim(),
        lesson: lesson.trim(),
        free: free.trim(),
      });
      nav('/play/certificate');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const blank = (v: string) => (
    <span className="mx-1 inline-block min-w-16 border-b-2 border-ink px-1 font-bold text-ch-900">{v.trim() || '　　　'}</span>
  );

  return (
    <Layout right={<StudentBadge />} wide>
      <h1 className="typewriter flex items-center gap-2 text-2xl font-bold">
        <ScrollText className="h-7 w-7 text-declass" aria-hidden="true" />나의 AI 윤리 실천 선언문
      </h1>
      <p className="text-ink-soft">세 챕터에서 모은 원칙 카드를 살펴보고, 나에게 가장 중요한 가치를 골라 선언문을 써요.</p>

      {/* 카드 보드: 3대 가치를 위에, 7장의 원칙 카드를 아래에 */}
      <section className="dossier mt-5 p-4 sm:p-5" aria-label="원칙 카드 보드">
        <h2 className="typewriter text-lg font-bold">카드 보드</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {CORE_VALUES.map((v) => (
            <li key={v.id} className="rounded-box border-2 border-accent bg-accent/30 px-3 py-3 text-center">
              <p className="typewriter flex items-center justify-center gap-2 font-bold">
                <ValueIcon id={v.id} className="h-5 w-5 text-accent-content" />
                {v.name}
              </p>
              <p className="text-[15px] text-ink-soft">{v.description}</p>
            </li>
          ))}
        </ul>
        <p className="my-2 text-center text-ink-soft" aria-hidden="true">
          ▲ 7대 원칙이 함께 지키는 가치 ▲
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <li key={p.id}>
              <PrincipleCardView principle={p} owned={student.cards.includes(p.id)} compact />
            </li>
          ))}
        </ul>
      </section>

      <section className="dossier mt-6 flex flex-col gap-5 p-5" aria-label="선언문 쓰기">
        <h2 className="typewriter text-xl font-bold">선언문 쓰기</h2>

        <div className="flex flex-col gap-2">
          <p className="font-bold">① 나는 AI를 사용할 때 무엇을 지킬까요? (나에게 가장 중요한 가치)</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="원칙 고르기">
            {[...owned, ...others].map((p) => {
              const on = principleId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setPrincipleId(p.id);
                    setKeep(p.name);
                  }}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3 text-[16px] ${on ? 'font-bold text-white' : 'bg-white'}`}
                  style={{ borderColor: p.color, backgroundColor: on ? p.color : undefined, color: on ? undefined : p.color }}
                >
                  <PrincipleIcon id={p.id} className="h-4 w-4" />
                  <span className={on ? '' : 'text-ink'}>{p.name}</span>
                </button>
              );
            })}
          </div>
          <TextInput
            label="지킬 것 (고르거나 직접 쓰기)"
            value={keep}
            onChange={(v) => {
              setKeep(v);
              setPrincipleId(PRINCIPLES.find((p) => p.name === v.trim())?.id ?? null);
            }}
            maxLength={LIMITS.declarationKeep}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-bold">② 냉전 시대의 어떤 일에서 배웠나요?</p>
          <div className="flex flex-wrap gap-2">
            {ERA_SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setEra(s)} className="btn h-auto min-h-11 rounded-full border-base-300 bg-white px-3 text-[16px] font-medium hover:bg-accent">
                {s}
              </button>
            ))}
          </div>
          <TextInput label="냉전 시대의 ___에서" value={era} onChange={setEra} maxLength={LIMITS.declarationEra} />
        </div>

        <TextInput
          label="③ 무엇을 배웠나요? (___을(를) 배웠기 때문입니다)"
          hint="예: 필요 이상으로 모인 정보가 사람 사이의 믿음을 깨뜨린다는 것"
          value={lesson}
          onChange={setLesson}
          maxLength={LIMITS.declarationLesson}
        />

        <div className="rounded-box border-2 border-dashed border-secondary-content/50 bg-secondary/25 p-4 text-[18px] leading-loose" aria-live="polite">
          <p className="text-[15px] text-ink-soft">미리 보기</p>
          나는 AI를 사용할 때{blank(keep)}
          {keep.trim() ? eulReul(keep) : '을(를)'} 지키겠습니다. 왜냐하면 냉전 시대의{blank(era)}에서{blank(lesson)}
          {lesson.trim() ? eulReul(lesson) : '을(를)'} 배웠기 때문입니다.
        </div>

        <WritingBox
          label={`④ 더 하고 싶은 말 (자유롭게, ${LIMITS.declarationFree}자까지)`}
          starters={FREE_STARTERS}
          value={free}
          onChange={setFree}
          maxLength={LIMITS.declarationFree}
        />

        {error && <Notice tone="error">{error}</Notice>}
        <Button className="text-[19px]" onClick={submit} disabled={busy}>
          <Send className="h-5 w-5" aria-hidden="true" />
          {busy ? '제출하는 중…' : d ? '고쳐서 다시 제출하기' : '선언문 제출하고 인증서 받기'}
        </Button>
        {d && (
          <LinkButton to="/play/certificate" variant="secondary">
            <AwardIcon className="h-5 w-5" aria-hidden="true" />
            내 인증서 보기
          </LinkButton>
        )}
      </section>
    </Layout>
  );
}
