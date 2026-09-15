import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useProgress } from '../hooks/useProgress.jsx';
import { ALL_CASES, ERROR_TYPES, TRACKS } from '../lib/cases.js';
import { isCaseComplete } from '../lib/scoring.js';
import { exportCode, importCode } from '../lib/storage.js';

export default function HomePage() {
  const { progress, getCaseState, setName, replaceProgress, resetAll, storageOk } = useProgress();
  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage] = useState(null);
  const [exported, setExported] = useState(null);

  const completed = useMemo(
    () => ALL_CASES.filter((c) => isCaseComplete(c, getCaseState(c.id))).length,
    [getCaseState],
  );
  const percent = ALL_CASES.length ? Math.round((completed / ALL_CASES.length) * 100) : 0;

  function handleExport() {
    setExported(exportCode(progress));
    setMessage(null);
  }

  function handleImport() {
    const result = importCode(codeInput);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    replaceProgress(result.progress);
    setCodeInput('');
    setMessage({ tone: 'ok', text: `불러왔습니다. 확인 번호 ${result.verifyNumber}` });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(exported.code);
      setMessage({ tone: 'ok', text: '코드를 복사했습니다.' });
    } catch {
      setMessage({ tone: 'error', text: '자동 복사가 막혀 있습니다. 코드를 직접 선택해 복사해 주세요.' });
    }
  }

  return (
    <div className="space-y-5">
      <section className="card-file">
        <h1 className="text-2xl font-bold">역사탐정 프로젝트</h1>
        <p className="mt-3 leading-reading">
          AI가 알려 준 역사 이야기는 어디까지 믿을 수 있을까? 이 앱에서는 미리 준비된 AI 답변을 한
          문장씩 따져 보고, 사료를 직접 열어 <strong>출처 확인 → 맥락화 → 교차검증</strong> 세
          단계로 검증한 뒤, APA 7판 양식으로 출처를 기재하고 나만의 역사 서사를 쓴다. 목표는{' '}
          <strong>정답을 외우는 것이 아니라, 무엇을 근거로 믿을지 스스로 정하는 기준을 갖는 것</strong>이다.
        </p>
        <p className="mt-3 rounded-sm border-2 border-alert bg-alert/5 p-3 text-sm leading-reading">
          이 앱의 &lsquo;AI 답변&rsquo;은 수업용으로 미리 작성된 예시다. 실제 AI 답변과 마찬가지로
          오류가 섞여 있으며, 몇 번을 눌러도 같은 답변이 나온다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.values(TRACKS).map((t) => (
            <Link key={t.key} to={`/cases/${t.key}`} className="btn-primary">
              {t.label} 트랙
            </Link>
          ))}
          <Link to="/guide" className="btn-quiet">
            아카이브 사용법
          </Link>
        </div>
      </section>

      <section className="card-file">
        <h2 className="text-lg font-bold">학습 진행률</h2>
        <p className="mt-1 text-sm text-ink-soft">
          전체 {ALL_CASES.length}건 가운데 {completed}건 완료
        </p>
        <div className="mt-2 h-4 w-full overflow-hidden rounded-sm bg-kraft-dark/40">
          <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>

        <div className="mt-4">
          <label htmlFor="student-name" className="block text-sm font-bold">
            이름 (선택 사항)
          </label>
          <input
            id="student-name"
            type="text"
            value={progress.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="적지 않아도 된다"
            className="mt-1 w-full max-w-xs rounded-sm border border-kraft-dark bg-white/80 p-2"
          />
          <p className="mt-1 text-xs leading-reading text-ink-soft">
            이름은 리포트에 표시되는 용도로만 쓰이며, 이 기기 밖으로 전송되지 않는다. 로그인도,
            서버 저장도 없다.
          </p>
        </div>

        {!storageOk ? (
          <p className="mt-3 rounded-sm border border-alert bg-alert/5 p-2 text-sm">
            이 기기에서는 저장 기능이 막혀 있다. 진행 내용이 새로고침하면 사라질 수 있으니, 중요한
            내용은 따로 적어 두자.
          </p>
        ) : null}
      </section>

      <section className="card-file">
        <h2 className="text-lg font-bold">다른 기기에서 이어 하기</h2>
        <p className="mt-1 text-sm leading-reading text-ink-soft">
          이 앱은 서버에 아무것도 저장하지 않는다. 그래서 기기를 옮길 때는 진행 내용을 통째로 담은
          <strong> 이어받기 코드</strong>를 복사해 옮긴다. 함께 나오는{' '}
          <strong>6자리 확인 번호</strong>는 코드를 빠짐없이 옮겼는지 대조하는 번호이며, 그 6자리만
          으로는 복원되지 않는다.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="btn-primary">
            내 진행 내용 코드 만들기
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('이 기기의 모든 진행 내용을 지웁니다. 계속할까요?')) resetAll();
            }}
            className="btn-quiet"
          >
            모두 지우기
          </button>
        </div>

        {exported ? (
          <div className="mt-3 rounded-sm border border-kraft-dark bg-white/70 p-3">
            <p className="text-sm font-bold">확인 번호 {exported.verifyNumber}</p>
            <textarea
              readOnly
              value={exported.code}
              rows={4}
              onFocus={(e) => e.target.select()}
              className="mt-2 w-full break-all rounded-sm border border-kraft-dark bg-white p-2 font-mono text-xs"
            />
            <button type="button" onClick={copyCode} className="btn-quiet mt-2 text-sm">
              코드 복사
            </button>
          </div>
        ) : null}

        <div className="mt-4">
          <label htmlFor="restore-code" className="block text-sm font-bold">
            이어받기 코드 붙여넣기
          </label>
          <textarea
            id="restore-code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            rows={3}
            placeholder="다른 기기에서 만든 코드를 붙여넣자"
            className="mt-1 w-full rounded-sm border border-kraft-dark bg-white/80 p-2 font-mono text-xs"
          />
          <button type="button" onClick={handleImport} className="btn-primary mt-2">
            불러오기
          </button>
        </div>

        {message ? (
          <p
            className={[
              'mt-3 rounded-sm p-2 text-sm leading-reading',
              message.tone === 'error' ? 'bg-alert/10 text-alert' : 'bg-ink/10',
            ].join(' ')}
          >
            {message.text}
          </p>
        ) : null}
      </section>

      <section className="card-file">
        <h2 className="text-lg font-bold">오류 유형 범례</h2>
        <p className="mt-1 text-sm text-ink-soft">
          AI 답변에 섞여 있는 오류는 대체로 아래 열 가지 가운데 하나다. 배지를 보면 어떤 종류의
          오류인지 알 수 있다.
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(ERROR_TYPES).map(([key, meta]) => (
            <div key={key} className="rounded-sm bg-kraft-dark/25 p-2 text-sm">
              <dt className="font-bold">{meta.label}</dt>
              <dd className="leading-reading">{meta.desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
