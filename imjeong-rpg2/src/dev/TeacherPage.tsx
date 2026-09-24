import { useMemo, useState } from 'react';
import { acts, quests } from '../data/quests';
import { relics } from '../data/relics';
import { figures } from '../data/figures';
import { notePrompts } from '../data/notes';
import { prequelLinks, PREQUEL_TITLE } from '../data/prequel';
import { decodeProgress } from '../engine/progressCode';

/**
 * 교사용 화면 — 주소 끝에 `?teacher` 를 붙이면 열린다.
 *
 * 서버가 없으므로 학생 기록을 자동으로 모을 수는 없다. 대신 학생이 적어 낸 「진행 코드」를
 * 한꺼번에 붙여 넣으면 학급 현황과 「많이 틀린 문제」를 보여 준다.
 *
 * ⚠ 확인 번호는 학생이 정답표를 바로 여는 것을 막는 가벼운 문일 뿐, 보안 장치가 아니다.
 */
const PIN = '0411';

export default function TeacherPage() {
  const [pin, setPin] = useState('');
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem('imjeong-rpg2:teacher') === '1';
    } catch {
      return false;
    }
  });
  const [tab, setTab] = useState<'class' | 'answers' | 'notes' | 'links'>('class');

  if (!open) {
    return (
      <div className="teacher">
        <div className="teacher-gate frame">
          <h1>교사용 화면</h1>
          <p>정답과 해설이 들어 있습니다. 수업 안내서(docs/TEACHER_GUIDE.md)에 적힌 확인 번호를 넣어 주세요.</p>
          <input
            value={pin}
            inputMode="numeric"
            placeholder="확인 번호 4자리"
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pin === PIN) unlock();
            }}
          />
          <button className="btn primary" disabled={pin !== PIN} onClick={unlock}>
            열기
          </button>
        </div>
      </div>
    );
  }

  function unlock() {
    setOpen(true);
    try {
      sessionStorage.setItem('imjeong-rpg2:teacher', '1');
    } catch {
      /* 무시 */
    }
  }

  return (
    <div className="teacher">
      <header className="teacher-head">
        <h1>『임시정부 : 새로운 나라를 향해』 교사용 화면</h1>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'class'} onClick={() => setTab('class')}>
            학급 진행 현황
          </button>
          <button role="tab" aria-selected={tab === 'answers'} onClick={() => setTab('answers')}>
            정답·해설표
          </button>
          <button role="tab" aria-selected={tab === 'notes'} onClick={() => setTab('notes')}>
            생각 노트 질문
          </button>
          <button role="tab" aria-selected={tab === 'links'} onClick={() => setTab('links')}>
            1탄 연결표
          </button>
          <button className="btn small" onClick={() => window.print()}>
            🖨️ 인쇄
          </button>
        </div>
      </header>
      {tab === 'class' && <ClassView />}
      {tab === 'answers' && <Answers />}
      {tab === 'notes' && <NotesView />}
      {tab === 'links' && <Links />}
    </div>
  );
}

function ClassView() {
  const [raw, setRaw] = useState('');
  const questIds = quests.map((q) => q.id);
  const relicIds = relics.map((r) => r.id);
  const rows = useMemo(
    () =>
      raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          // 「이름 코드」 또는 「코드」 — 코드는 마지막 덩어리
          const m = line.match(/^(.*?)[\s,\t:]*([0-9A-Za-z]{4}(?:-?[0-9A-Za-z]{1,4})+)\s*$/);
          const name = m ? m[1].trim() : '';
          const code = m ? m[2] : line;
          return { name: name || '(이름 없음)', code, snap: decodeProgress(code, questIds, relicIds) };
        }),
    [raw],
  );
  const valid = rows.filter((r) => r.snap);
  const missCount = new Map<string, number>();
  for (const r of valid) for (const id of r.snap!.missed) missCount.set(id, (missCount.get(id) ?? 0) + 1);
  const hardest = [...missCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <section className="teacher-section">
      <p>
        학생이 도움말의 「다른 컴퓨터에서 이어 하기」나 감사 증서에 나온 <strong>진행 코드</strong>를 적어 내면, 아래에 한 줄에 한 명씩
        붙여 넣으세요. <code>3반 별빛 1A2B-3C4D-…</code> 처럼 앞에 부름말을 붙여도 됩니다. (이 화면은 아무 데도 보내지 않습니다)
      </p>
      <textarea className="teacher-input" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={'3반 별빛 1A2B-3C4D-5E6F-7G8H-9J\n3반 파랑새 …'} />
      {rows.length > 0 && (
        <table className="teacher-table">
          <thead>
            <tr>
              <th>학생</th>
              <th>난이도</th>
              <th>기록</th>
              <th>한 번에</th>
              <th>진행</th>
              <th>기록 조각</th>
              <th>생각 노트</th>
              <th>다시 풀었던 문제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) =>
              r.snap ? (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.snap.level === 'high' ? '고' : '중'}</td>
                  <td>
                    {r.snap.completed.length}/{quests.length}
                  </td>
                  <td>{r.snap.completed.filter((id) => !r.snap!.missed.includes(id)).length}</td>
                  <td>{actLabel(r.snap.completed)}</td>
                  <td>
                    {r.snap.relics.length}/{relics.length}
                  </td>
                  <td>{r.snap.notes.length}/6</td>
                  <td className="teacher-missed">{r.snap.missed.map((id) => quests.find((q) => q.id === id)?.title).join(', ')}</td>
                </tr>
              ) : (
                <tr key={i} className="bad">
                  <td>{r.name}</td>
                  <td colSpan={7}>코드를 읽을 수 없습니다 — 옮겨 적을 때 틀린 글자가 없는지 확인해 주세요 ({r.code})</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
      {hardest.length > 0 && (
        <div className="teacher-hard">
          <h3>우리 반이 많이 틀린 문제 — 다시 짚어 볼 곳</h3>
          <ol>
            {hardest.map(([id, n]) => {
              const q = quests.find((x) => x.id === id)!;
              return (
                <li key={id}>
                  <strong>{q.title}</strong> ({n}명) — 제{q.act}막 · {figures[q.giver]?.name} · {q.dateLabel}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

function actLabel(completed: string[]): string {
  const done = new Set(completed);
  let act = 0;
  for (const a of acts) if (quests.filter((q) => q.act === a.act).every((q) => done.has(q.id))) act = a.act;
  return act >= acts.length ? '완주' : `제${act + 1}막 진행 중`;
}

function Answers() {
  return (
    <section className="teacher-section">
      {acts.map((a) => (
        <div key={a.act}>
          <h2>{a.title}</h2>
          <table className="teacher-table">
            <thead>
              <tr>
                <th>퀘스트</th>
                <th>주는 사람</th>
                <th>정답</th>
                <th>핵심 사료</th>
                <th>확인할 점</th>
              </tr>
            </thead>
            <tbody>
              {quests
                .filter((q) => q.act === a.act)
                .map((q) => (
                  <tr key={q.id}>
                    <td>
                      <strong>{q.title}</strong>
                      <br />
                      <small>{q.dateLabel}</small>
                    </td>
                    <td>{figures[q.giver]?.name}</td>
                    <td>
                      {q.kind === 'order' ? '순서: ' : ''}
                      {q.answer.map((id) => q.choices.find((c) => c.id === id)?.label).join(q.kind === 'order' ? ' → ' : ' / ')}
                    </td>
                    <td>
                      {q.sources.map((s) => (
                        <div key={s.id}>
                          {s.title}
                          <br />
                          <small>{s.citationApa}</small>
                        </div>
                      ))}
                    </td>
                    <td>
                      <small>{q.caveat ?? '—'}</small>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

function NotesView() {
  return (
    <section className="teacher-section">
      <p>생각 노트는 채점하지 않는 열린 질문입니다. 학생의 학습 기록 파일(.txt)이나 인쇄한 감사 증서에서 답을 볼 수 있습니다.</p>
      {notePrompts.map((p) => (
        <div className="teacher-note" key={p.act}>
          <h3>
            {p.act === 6 ? '에필로그' : `제${p.act}막`} · {p.skill}
          </h3>
          <p>{p.question}</p>
          <p>
            <small>살펴볼 점: 게임에서 본 사실(재료)을 근거로 들었는가 · {p.act === 3 || p.act === 5 ? '양쪽 입장을 모두 이해하려 했는가' : '과거와 오늘을 연결했는가'}</small>
          </p>
        </div>
      ))}
    </section>
  );
}

function Links() {
  return (
    <section className="teacher-section">
      <p>
        2탄의 퀘스트가 1탄 『{PREQUEL_TITLE}』의 어느 장면과 이어지는지 정리한 표입니다. 1탄을 먼저 한 반은 「같은 사건, 다른 질문」으로
        비교해 보게 하면 좋습니다.
      </p>
      <table className="teacher-table">
        <thead>
          <tr>
            <th>2탄 퀘스트</th>
            <th>1탄 장면</th>
            <th>두 게임이 보는 각도</th>
          </tr>
        </thead>
        <tbody>
          {quests
            .filter((q) => prequelLinks[q.id])
            .map((q) => (
              <tr key={q.id}>
                <td>
                  제{q.act}막 {q.title}
                </td>
                <td>{prequelLinks[q.id].title}</td>
                <td>{prequelLinks[q.id].text}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}
