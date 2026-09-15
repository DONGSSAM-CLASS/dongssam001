import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import StepIndicator, { STEP_META } from '../components/StepIndicator.jsx';
import Step0Question from '../components/steps/Step0Question.jsx';
import Step1Ask from '../components/steps/Step1Ask.jsx';
import Step2Verdict from '../components/steps/Step2Verdict.jsx';
import Step3Workbench from '../components/steps/Step3Workbench.jsx';
import Step4Citation from '../components/steps/Step4Citation.jsx';
import Step5Narrative from '../components/steps/Step5Narrative.jsx';
import Step6Report from '../components/steps/Step6Report.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { useProgress } from '../hooks/useProgress.jsx';
import { getCase } from '../lib/cases.js';
import { completedSteps } from '../lib/scoring.js';

export default function LearningLoopPage() {
  const { caseId, step } = useParams();
  const navigate = useNavigate();
  const { progress, getCaseState, updateCaseStep, markVisited } = useProgress();

  const caseData = getCase(caseId);
  const stepNo = Math.min(6, Math.max(0, Number.parseInt(step ?? '0', 10) || 0));

  useEffect(() => {
    if (caseData) markVisited(caseId, stepNo);
  }, [caseData, caseId, stepNo, markVisited]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [stepNo]);

  if (!caseData) return <NotFoundPage />;

  const caseState = getCaseState(caseId);
  const done = completedSteps(caseData, caseState);
  const meta = STEP_META[stepNo];

  function goto(next) {
    navigate(`/learn/${caseId}/${next}`);
  }

  const stepProps = {
    caseData,
    onChange: (value) => updateCaseStep(caseId, `step${stepNo}`, value),
  };

  return (
    <div className="space-y-4">
      <StepIndicator current={stepNo} done={done} onJump={goto} />

      <header className="no-print">
        <p className="text-xs tracking-widest text-ink-soft">
          사건 파일 · {caseData.period} · 성취기준 {caseData.curriculum.standards.join(', ')}
        </p>
        <h1 className="text-xl font-bold leading-snug">{caseData.title}</h1>
        <p className="text-sm text-ink-soft">
          {stepNo}단계 · {meta.name} <span className="mx-1">|</span> 교육과정 근거: {meta.basis}
        </p>
      </header>

      {stepNo === 0 ? <Step0Question {...stepProps} state={caseState.step0} /> : null}
      {stepNo === 1 ? <Step1Ask caseData={caseData} /> : null}
      {stepNo === 2 ? <Step2Verdict {...stepProps} state={caseState.step2} /> : null}
      {stepNo === 3 ? <Step3Workbench {...stepProps} state={caseState.step3} /> : null}
      {stepNo === 4 ? <Step4Citation {...stepProps} state={caseState.step4} /> : null}
      {stepNo === 5 ? <Step5Narrative {...stepProps} state={caseState.step5} /> : null}
      {stepNo === 6 ? (
        <Step6Report
          {...stepProps}
          state={caseState.step6}
          caseState={caseState}
          studentName={progress.name}
        />
      ) : null}

      <nav className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-kraft-dark pt-4">
        <button
          type="button"
          onClick={() => goto(stepNo - 1)}
          disabled={stepNo === 0}
          className="btn-quiet disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← 이전 단계
        </button>
        <Link to={`/cases/${caseData.track}`} className="text-sm underline underline-offset-2">
          사건부 목록으로
        </Link>
        <button
          type="button"
          onClick={() => goto(stepNo + 1)}
          disabled={stepNo === 6}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음 단계 →
        </button>
      </nav>

      <p className="no-print text-xs text-ink-soft">
        단계를 오가도 입력한 내용은 이 기기에 그대로 남는다.
      </p>
    </div>
  );
}
