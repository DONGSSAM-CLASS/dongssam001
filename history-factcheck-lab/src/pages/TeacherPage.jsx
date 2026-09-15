import { useRef, useState } from 'react';

import rubric from '../data/rubric.json';
import { ALL_CASES, ERROR_TYPES, SOURCE_KINDS, getSource } from '../lib/cases.js';
import { TEMPLATES } from '../lib/apa.js';

/**
 * 교내에서 학생 화면과 교사 화면을 가르는 간단한 가림막이다. 보안 장치가 아니다.
 *
 * 암호는 빌드할 때 VITE_TEACHER_PASSCODE 환경변수에서 읽는다. 이렇게 하면 암호가
 * 저장소에 커밋되지 않는다. 다만 백엔드가 없는 앱이라 빌드 결과물 안에는 여전히
 * 들어가므로, 개발자 도구를 열어 볼 줄 아는 사람은 찾아낼 수 있다.
 * 학생 기기에서 실수로 정답 화면이 열리는 것을 막는 용도로만 쓴다.
 */
const GATE_WORD = (import.meta.env.VITE_TEACHER_PASSCODE ?? 'teacher').trim().toLowerCase();
const IS_DEFAULT_PASSCODE = !import.meta.env.VITE_TEACHER_PASSCODE;
const GATE_KEY = 'hfl.teacherGate';

function Gate({ onPass }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (value.trim().toLowerCase() === GATE_WORD) {
      try {
        window.sessionStorage.setItem(GATE_KEY, '1');
      } catch {
        /* 저장이 막혀도 이번 세션 동안은 열어 둔다 */
      }
      onPass();
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={submit} className="card-file max-w-md">
      <h1 className="text-2xl font-bold">교사 모드</h1>
      <p className="mt-2 text-sm leading-reading text-ink-soft">
        정답과 해설이 한꺼번에 보이는 화면입니다. 학생 기기에서 실수로 열리지 않도록 가림막을 두었을
        뿐, 보안 장치가 아닙니다. 백엔드가 없는 앱이라 암호는 빌드 결과물 안에 들어 있으니,
        다른 곳에서 쓰는 비밀번호를 재사용하지 마세요.
      </p>
      <label htmlFor="gate" className="mt-4 block text-sm font-bold">
        암호
      </label>
      <input
        id="gate"
        type="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        className="mt-1 w-full rounded-sm border border-kraft-dark bg-white/80 p-2"
        autoComplete="off"
      />
      {IS_DEFAULT_PASSCODE ? (
        <p className="mt-1 rounded-sm border border-alert/50 bg-alert/5 p-2 text-xs leading-reading">
          <strong>기본 암호(teacher)가 그대로 쓰이고 있습니다.</strong> 배포 전에{' '}
          <code>.env.local</code>에 <code>VITE_TEACHER_PASSCODE</code>를 설정하고 다시 빌드해 주세요.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-alert">암호가 맞지 않습니다.</p> : null}
      <button type="submit" className="btn-primary mt-3">
        들어가기
      </button>
    </form>
  );
}

function CaseAnswerSheet({ caseData }) {
  return (
    <article className="card-file break-inside-avoid">
      <header className="border-b-2 border-ink pb-2">
        <h3 className="text-lg font-bold leading-snug">{caseData.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {caseData.id} · {caseData.period} · 난이도 {caseData.difficulty}/3 · 약{' '}
          {caseData.estimatedMinutes}분 · 성취기준 {caseData.curriculum.standards.join(', ')}
          {caseData.contested ? ' · 논쟁적 주제' : ''}
        </p>
      </header>

      <section className="mt-3">
        <h4 className="font-bold">교육과정 유의 사항</h4>
        <p className="mt-1 text-sm leading-reading">{caseData.curriculum.note}</p>
      </section>

      <section className="mt-3">
        <h4 className="font-bold">교사 메모</h4>
        <p className="mt-1 text-sm leading-reading">{caseData.teacherNotes}</p>
      </section>

      <section className="mt-3">
        <h4 className="font-bold">0단계 · 탐구 질문 보기별 판정</h4>
        <ul className="mt-1 space-y-1 text-sm leading-reading">
          {caseData.questionStage.options.map((o) => (
            <li key={o.id}>
              <span
                className={`mr-1 rounded-sm px-1.5 py-0.5 text-xs ${
                  o.good ? 'bg-ink text-kraft-light' : 'bg-alert text-white'
                }`}
              >
                {o.good ? '적합' : '부적합'}
              </span>
              {o.text} — {o.why}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-3">
        <h4 className="font-bold">
          1~2단계 · AI 답변 문장별 정답 (심어 둔 오류{' '}
          {caseData.aiResponse.sentences.filter((s) => s.errorType).length}건)
        </h4>
        <p className="mt-1 text-xs text-ink-soft">프롬프트: {caseData.aiResponse.prompt}</p>
        <ol className="mt-1 space-y-2 text-sm leading-reading">
          {caseData.aiResponse.sentences.map((s) => (
            <li key={s.no}>
              <p>
                <span className="font-bold">{s.no}. </span>
                {s.text}
              </p>
              <p className="mt-0.5">
                <span
                  className={`mr-1 rounded-sm px-1.5 py-0.5 text-xs ${
                    s.verdict === 'supported' ? 'bg-ink text-kraft-light' : 'bg-alert text-white'
                  }`}
                >
                  {s.verdict === 'supported'
                    ? '사실'
                    : s.verdict === 'unverifiable'
                      ? '확인 불가'
                      : '의심스러움'}
                </span>
                {s.errorType ? (
                  <span className="mr-1 rounded-sm border border-alert px-1.5 py-0.5 text-xs text-alert">
                    {ERROR_TYPES[s.errorType]?.label}
                  </span>
                ) : null}
                {s.explanation}
              </p>
              {s.checkWith?.length ? (
                <p className="text-xs text-ink-soft">검증 자료: {s.checkWith.join(', ')}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-3">
        <h4 className="font-bold">사료 목록</h4>
        <ul className="mt-1 space-y-1 text-sm leading-reading">
          {caseData.sources.map((s) => (
            <li key={s.id}>
              <span className="font-bold">{s.id}</span> [{SOURCE_KINDS[s.kind] ?? s.kind}
              {s.nonText ? ' · 비문자' : ''}
              {s.synthetic ? ' · 수업용 가상 예시' : ''}] {s.title} — 신뢰도 {s.reliability}
              {s.url ? (
                <span className="block break-all text-xs text-ink-soft">
                  {s.url} ({s.urlVerified ? '링크 확인됨' : '링크 미확인'})
                </span>
              ) : (
                <span className="block text-xs text-alert">
                  실제 문서가 아닌 수업용 가상 예시 — 학생에게 반드시 안내할 것
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-3">
        <h4 className="font-bold">3단계 · 워크벤치 정답과 해설</h4>
        {['sourcing', 'contextualization', 'corroboration'].map((k) => {
          const stage = caseData.workbench[k];
          return (
            <div key={k} className="mt-2">
              <p className="text-sm font-bold">{stage.label}</p>
              <ol className="mt-1 space-y-1.5 text-sm leading-reading">
                {stage.questions.map((q) => (
                  <li key={q.id}>
                    <p>
                      <span className="font-bold">[{q.id}] </span>
                      {q.text}
                    </p>
                    <p>
                      <span className="font-bold">정답: </span>
                      {q.type === 'choice'
                        ? `${q.answerIndex + 1}번 — ${q.options[q.answerIndex]}`
                        : `단답 (채점 키워드: ${q.acceptKeywords.join(', ')})`}
                    </p>
                    <p className="text-ink-soft">힌트: {q.hint}</p>
                    <p>해설: {q.explanation}</p>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </section>

      {caseData.interpretations?.length ? (
        <section className="mt-3">
          <h4 className="font-bold">복수 해석 (어느 하나를 정답으로 제시하지 말 것)</h4>
          <ul className="mt-1 space-y-1 text-sm leading-reading">
            {caseData.interpretations.map((i) => (
              <li key={i.label}>
                <span className="font-bold">
                  {i.label}. {i.claim}
                </span>{' '}
                — {i.basis}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-3">
        <h4 className="font-bold">4단계 · APA 정답</h4>
        <p className="mt-1 break-all font-mono text-sm">{caseData.apaTarget.correctFormat}</p>
        <p className="mt-1 text-sm text-ink-soft">
          양식: {TEMPLATES[caseData.apaTarget.template]?.label ?? caseData.apaTarget.template} ·
          대상 자료: {getSource(caseData, caseData.apaTarget.sourceId)?.title}
        </p>
        {caseData.apaTarget.note ? (
          <p className="mt-1 text-sm leading-reading">{caseData.apaTarget.note}</p>
        ) : null}
      </section>

      <section className="mt-3">
        <h4 className="font-bold">5단계 · 서사 과제</h4>
        <p className="mt-1 text-sm leading-reading">{caseData.narrativePrompt}</p>
      </section>
    </article>
  );
}

function Worksheet({ caseData }) {
  return (
    <article className="card-file break-inside-avoid">
      <header className="border-b-2 border-ink pb-2">
        <p className="text-xs tracking-widest text-ink-soft">역사탐정 프로젝트 · 학급용 활동지</p>
        <h3 className="mt-1 text-lg font-bold leading-snug">{caseData.title}</h3>
        <p className="mt-2 text-sm">
          학년 반 번호 ______________ 이름 ______________
        </p>
      </header>

      <section className="mt-3">
        <p className="text-sm font-bold">0단계 · 나의 탐구 질문</p>
        <div className="mt-1 h-12 border-b border-dashed border-ink-soft" />
      </section>

      <section className="mt-3">
        <p className="text-sm font-bold">2단계 · 문장 판정 (사실 / 의심스러움 / 확인 불가)</p>
        <ol className="mt-1 space-y-1 text-sm">
          {caseData.aiResponse.sentences.map((s) => (
            <li key={s.no} className="flex gap-2">
              <span className="font-bold">{s.no}.</span>
              <span className="flex-1">{s.text}</span>
              <span className="shrink-0 text-ink-soft">□사실 □의심 □불가</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-3">
        <p className="text-sm font-bold">3단계 · 내가 고른 사료와 그 이유</p>
        <div className="mt-1 h-12 border-b border-dashed border-ink-soft" />
      </section>

      <section className="mt-3">
        <p className="text-sm font-bold">4단계 · APA 출처 기재</p>
        <div className="mt-1 h-10 border-b border-dashed border-ink-soft" />
        <p className="mt-1 text-xs text-ink-soft">
          {TEMPLATES[caseData.apaTarget.template]?.pattern}
        </p>
      </section>

      <section className="mt-3">
        <p className="text-sm font-bold">5단계 · 세 줄 출처 메모</p>
        <ol className="mt-1 space-y-2 text-sm">
          {caseData.memoPrompts.map((m) => (
            <li key={m}>
              {m}
              <div className="mt-1 h-7 border-b border-dashed border-ink-soft" />
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-3">
        <p className="text-sm font-bold">나의 서사 (3~5문장)</p>
        <p className="text-xs leading-reading text-ink-soft">{caseData.narrativePrompt}</p>
        <div className="mt-1 space-y-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-dashed border-ink-soft" />
          ))}
        </div>
      </section>
    </article>
  );
}

export default function TeacherPage() {
  const [passed, setPassed] = useState(() => {
    try {
      return window.sessionStorage.getItem(GATE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [tab, setTab] = useState('answers');
  const [selectedId, setSelectedId] = useState(ALL_CASES[0]?.id ?? null);
  const [importMsg, setImportMsg] = useState(null);
  const [overrides, setOverrides] = useState(null);
  const fileRef = useRef(null);

  if (!passed) return <Gate onPass={() => setPassed(true)} />;

  const cases = overrides ?? ALL_CASES;
  const selected = cases.find((c) => c.id === selectedId) ?? cases[0];

  function downloadJson(name, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const bad = list.filter((c) => !c.id || !c.aiResponse?.sentences || !c.sources);
      if (bad.length) {
        setImportMsg({ tone: 'error', text: '케이스 형식이 맞지 않는 항목이 있습니다.' });
        return;
      }
      setOverrides(list);
      setSelectedId(list[0].id);
      setImportMsg({
        tone: 'ok',
        text: `${list.length}건을 불러왔습니다. 이 화면에서 미리 보기용으로만 쓰이며, 새로고침하면 원래 자료로 돌아갑니다.`,
      });
    } catch {
      setImportMsg({ tone: 'error', text: 'JSON을 읽지 못했습니다.' });
    }
  }

  const TABS = [
    { key: 'answers', label: '정답·해설 일괄 보기' },
    { key: 'worksheet', label: '학급용 활동지' },
    { key: 'rubric', label: '루브릭 원본' },
    { key: 'data', label: '케이스 JSON' },
  ];

  return (
    <div className="space-y-4">
      <header className="no-print flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">교사 모드</h1>
          <p className="text-sm text-ink-soft">
            케이스 {cases.length}건 · 학생 화면에서는 볼 수 없는 정답과 해설이 표시됩니다.
          </p>
        </div>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          이 화면 인쇄
        </button>
      </header>

      <nav className="no-print flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={[
              'rounded-sm border px-3 py-1.5 text-sm transition-colors duration-150',
              tab === t.key ? 'border-ink bg-ink text-kraft-light' : 'border-kraft-dark bg-white/70',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'rubric' ? (
        <section className="card-file">
          <h2 className="text-xl font-bold">루브릭 원본</h2>
          <p className="mt-1 text-sm text-ink-soft">{rubric.source}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-kraft-dark bg-kraft-dark/40 p-2 text-left">평가 축</th>
                  {rubric.levels.map((l) => (
                    <th key={l.key} className="border border-kraft-dark bg-kraft-dark/40 p-2 text-left">
                      {l.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rubric.axes.map((axis, i) => (
                  <tr key={axis.id}>
                    <th className="border border-kraft-dark p-2 text-left align-top">
                      <span className="block">
                        {i + 1}. {axis.title}
                      </span>
                      <span className="mt-1 block text-xs font-normal text-ink-soft">{axis.basis}</span>
                    </th>
                    {rubric.levels.map((l) => (
                      <td key={l.key} className="border border-kraft-dark p-2 align-top leading-reading">
                        {axis.descriptors[l.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => downloadJson('rubric.json', rubric)}
            className="btn-quiet no-print mt-3"
          >
            rubric.json 내려받기
          </button>
        </section>
      ) : null}

      {tab === 'data' ? (
        <section className="card-file">
          <h2 className="text-xl font-bold">케이스 JSON 내려받기 · 올리기</h2>
          <p className="mt-1 text-sm leading-reading text-ink-soft">
            케이스를 내려받아 고친 뒤 다시 올리면 이 화면에서 미리 볼 수 있습니다. 브라우저에
            영구 저장되지는 않으므로, 실제로 반영하려면 고친 파일을{' '}
            <code>src/data/</code>에 넣고 다시 배포해야 합니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                downloadJson(
                  'cases.korea.json',
                  cases.filter((c) => c.track === 'korea'),
                )
              }
              className="btn-quiet"
            >
              한국사 JSON 내려받기
            </button>
            <button
              type="button"
              onClick={() =>
                downloadJson(
                  'cases.world.json',
                  cases.filter((c) => c.track === 'world'),
                )
              }
              className="btn-quiet"
            >
              세계사 JSON 내려받기
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-primary">
              JSON 올려서 미리 보기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleUpload}
              className="hidden"
            />
            {overrides ? (
              <button
                type="button"
                onClick={() => {
                  setOverrides(null);
                  setSelectedId(ALL_CASES[0].id);
                  setImportMsg(null);
                }}
                className="btn-quiet"
              >
                원래 자료로 되돌리기
              </button>
            ) : null}
          </div>
          {importMsg ? (
            <p
              className={[
                'mt-3 rounded-sm p-2 text-sm leading-reading',
                importMsg.tone === 'error' ? 'bg-alert/10 text-alert' : 'bg-ink/10',
              ].join(' ')}
            >
              {importMsg.text}
            </p>
          ) : null}

          <h3 className="mt-5 text-lg font-bold">링크 점검</h3>
          <p className="mt-1 text-sm leading-reading">
            사료 링크는 시간이 지나면 끊어집니다. 학기 시작 전에 아래 명령으로 한 번 확인해
            주세요.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-sm bg-ink p-3 text-xs text-kraft-light">
            npm run verify-links{'\n'}npm run verify-links -- --write
          </pre>
          <p className="mt-2 text-sm leading-reading text-ink-soft">
            교내망에서는 외부 접속이 막혀 살아 있는 링크도 실패로 나올 수 있습니다. 결과에
            &lsquo;차단됨&rsquo;이 많다면 교내망 밖에서 다시 돌려 보세요.
          </p>
          <p className="mt-2 text-sm leading-reading">
            현재 링크 확인 상태:{' '}
            <strong>
              {cases.flatMap((c) => c.sources).filter((s) => s.url && s.urlVerified).length}건 확인 /{' '}
              {cases.flatMap((c) => c.sources).filter((s) => s.url).length}건
            </strong>
          </p>
        </section>
      ) : null}

      {tab === 'answers' || tab === 'worksheet' ? (
        <>
          <div className="no-print card-file">
            <label htmlFor="case-select" className="block text-sm font-bold">
              케이스 선택
            </label>
            <select
              id="case-select"
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-sm border border-kraft-dark bg-white/80 p-2"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.track === 'korea' ? '한국사' : '세계사'}] {c.title}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-ink-soft">
              인쇄하면 아래 내용만 출력됩니다. 여러 케이스를 한꺼번에 인쇄하려면 케이스를 바꿔 가며
              인쇄해 주세요.
            </p>
          </div>

          {selected ? (
            tab === 'answers' ? (
              <CaseAnswerSheet caseData={selected} />
            ) : (
              <Worksheet caseData={selected} />
            )
          ) : null}
        </>
      ) : null}
    </div>
  );
}
