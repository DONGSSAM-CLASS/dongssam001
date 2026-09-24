import { useState } from 'react';
import { PREQUEL_TITLE, PREQUEL_URL, prequelActs, prologueRecall, type RecallQuestion } from '../data/prequel';
import { NOTE_MIN, getNotePrompt, pledgeExamples } from '../data/notes';
import { POINTS } from '../engine/rules';

/* ───────────────────────── 1탄 기억 퀴즈 한 문제 ───────────────────────── */

export function RecallQuiz({
  q,
  solved,
  onAnswer,
}: {
  q: RecallQuestion;
  solved: boolean;
  onAnswer(correct: boolean): void;
}) {
  const [picked, setPicked] = useState<number | null>(solved ? q.answer : null);
  const done = picked !== null;
  return (
    <div className="recall">
      <div className="recall-from">🔗 {q.from}</div>
      <div className="recall-prompt">{q.prompt}</div>
      <div className="recall-choices">
        {q.choices.map((c, i) => (
          <button
            key={c}
            className="choice"
            disabled={done}
            data-verdict={done ? (i === q.answer ? 'right' : i === picked ? 'wrong' : undefined) : undefined}
            onClick={() => {
              setPicked(i);
              onAnswer(i === q.answer);
            }}
          >
            <span className="choice-mark">{done && i === q.answer ? '✓' : ''}</span>
            <span className="choice-label">{c}</span>
          </button>
        ))}
      </div>
      {done && (
        <div className="recall-explain">
          {picked === q.answer ? `✓ 기억하고 있군요! ${solved ? '' : `(+${POINTS.recall})`} ` : '✗ 괜찮아요. '}
          {q.explain}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── 1탄 돌아보기 ───────────────────────── */

/**
 * 1탄을 하지 않은 학생에게는 요약을, 한 학생에게는 기억 퀴즈를.
 * 두 게임의 연결 고리를 한 화면에 모았다.
 */
export function PrequelRecap({
  played,
  solved,
  onAnswer,
  onClose,
}: {
  played: 'yes' | 'no' | null;
  solved: string[];
  onAnswer(id: string, correct: boolean): void;
  onClose(): void;
}) {
  const [tab, setTab] = useState<'story' | 'quiz'>(played === 'yes' ? 'quiz' : 'story');
  return (
    <div className="quest-overlay" role="dialog" aria-label="1탄 돌아보기">
      <div className="quest-sheet recap-sheet">
        <div className="quest-meta">
          <span className="tag">1탄</span>
          <span>『{PREQUEL_TITLE}』</span>
        </div>
        <h2 className="quest-title">1탄 돌아보기 — 광복을 향한 27년</h2>
        <p className="quest-brief">
          1탄에서는 임시정부의 <strong>외교와 군사</strong> — 광복을 향한 선택들을 따라갔어요. 2탄에서는 같은 사람들이 세운{' '}
          <strong>정부의 제도와 운영</strong>, 그리고 그것이 오늘의 대한민국으로 어떻게 이어졌는지 봐요. 같은 인물을 다시 만나게 될
          거예요.
        </p>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'story'} onClick={() => setTab('story')}>
            📖 1탄 줄거리
          </button>
          <button role="tab" aria-selected={tab === 'quiz'} onClick={() => setTab('quiz')}>
            🧠 기억 꺼내기 ({solved.filter((id) => prologueRecall.some((q) => q.id === id)).length}/{prologueRecall.length})
          </button>
        </div>
        {tab === 'story' && (
          <div className="recap-acts">
            {prequelActs.map((a) => (
              <div className="recap-act" key={a.act}>
                <div className="recap-act-head">
                  <span>제{a.act}막</span>
                  <strong>{a.title}</strong>
                  <em>{a.period}</em>
                </div>
                <p>{a.text}</p>
              </div>
            ))}
            <p className="list-sub">
              1탄을 직접 해 보고 싶다면 →{' '}
              <a href={PREQUEL_URL} target="_blank" rel="noopener noreferrer">
                『{PREQUEL_TITLE}』
              </a>
            </p>
          </div>
        )}
        {tab === 'quiz' && (
          <div style={{ marginTop: 12 }}>
            <p className="list-sub" style={{ marginTop: 0 }}>
              1탄에서 본 장면을 기억해 보세요. 맞히면 한 문제에 보훈 포인트 {POINTS.recall}. 1탄을 안 했어도 줄거리를 읽고 풀 수 있어요.
            </p>
            {prologueRecall.map((q) => (
              <RecallQuiz key={q.id} q={q} solved={solved.includes(q.id)} onAnswer={(c) => onAnswer(q.id, c)} />
            ))}
          </div>
        )}
        <div className="dialogue-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={onClose}>
            2탄으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 생각 노트 ───────────────────────── */

export function NoteCard({
  act,
  existing,
  onSave,
  onClose,
}: {
  act: number;
  existing: string | undefined;
  onSave(text: string): void;
  onClose(): void;
}) {
  const prompt = getNotePrompt(act);
  const [text, setText] = useState(existing && !existing.startsWith('(다른 기기') ? existing : '');
  if (!prompt) return null;
  const length = text.replace(/\s+/g, '').length;
  const ok = length >= NOTE_MIN;
  const isPledge = act === 6;
  return (
    <div className="quest-overlay" role="dialog" aria-label="생각 노트">
      <div className="quest-sheet note-sheet">
        <div className="quest-meta">
          <span className="tag law">{isPledge ? '에필로그' : `제${act}막을 마치며`}</span>
          <span>🧠 {prompt.skill}</span>
        </div>
        <h2 className="quest-title">{isPledge ? '나의 보훈 다짐' : '기록관의 생각 노트'}</h2>
        <p className="note-question">{prompt.question}</p>
        <div className="letter-hints">
          <strong>떠올릴 재료 (게임에서 본 것)</strong>
          <ul>
            {prompt.materials.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <strong>글머리 (누르면 붙어요)</strong>
          <div className="starter-row">
            {prompt.starters.map((s) => (
              <button key={s} className="starter" onClick={() => setText((t) => (t.trim() ? `${t.trimEnd()} ${s} ` : `${s} `))}>
                {s}
              </button>
            ))}
          </div>
          {isPledge && (
            <>
              <strong style={{ display: 'block', marginTop: 8 }}>예시 다짐 (골라서 고쳐 써도 돼요)</strong>
              <div className="starter-row">
                {pledgeExamples.map((p) => (
                  <button key={p} className="starter" onClick={() => setText(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <textarea
          className="letter-area note-area"
          value={text}
          maxLength={600}
          placeholder={isPledge ? '나는 앞으로…' : '정답은 없어요. 게임에서 본 사실을 근거로 내 생각을 적어 보세요.'}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <div className="letter-foot">
          <span className={ok ? 'letter-count ok' : 'letter-count warn'}>
            {ok ? `좋아요! (${length}자)` : `공백 빼고 ${NOTE_MIN}자 이상 써 주세요 (지금 ${length}자)`}
          </span>
          <span className="letter-sign">{existing ? '다시 쓰면 바뀌어요' : `처음 쓰면 보훈 포인트 +${POINTS.note}`}</span>
        </div>
        <div className="dialogue-actions">
          <button className="btn primary" disabled={!ok} onClick={() => onSave(text)}>
            ✍️ 수첩에 적기
          </button>
          <button className="btn ghost" onClick={onClose}>
            {isPledge ? '조금 뒤에 쓰기' : '나중에 쓰기 (생각 노트 목록에서 다시 쓸 수 있어요)'}
          </button>
        </div>
      </div>
    </div>
  );
}
