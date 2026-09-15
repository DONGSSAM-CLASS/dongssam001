import { expectedVerdictKey } from './cases.js';

export function emptyCaseState() {
  return {
    step0: { chosenOptionId: null, myQuestion: '' },
    step2: { verdicts: {} },
    step3: { answers: {}, attempts: {}, revealed: {}, correct: {} },
    step4: { fields: { author: '', year: '', title: '', container: '', url: '' }, attempts: 0, bestScore: 0, revealed: false },
    step5: { memo: ['', '', ''], narrative: '' },
    step6: { rubric: {}, completedAt: null },
    visited: [],
  };
}

/** 워크벤치 전체 문항을 평평한 배열로 펼친다. */
export function workbenchQuestions(caseData) {
  if (!caseData?.workbench) return [];
  return ['sourcing', 'contextualization', 'corroboration'].flatMap((stageKey) => {
    const stage = caseData.workbench[stageKey];
    if (!stage) return [];
    return stage.questions.map((q) => ({ ...q, stageKey, stageLabel: stage.label }));
  });
}

export function scoreSentences(caseData, caseState) {
  const sentences = caseData.aiResponse.sentences;
  const picks = caseState?.step2?.verdicts ?? {};
  let correct = 0;
  let answered = 0;
  const detail = sentences.map((s) => {
    const expected = expectedVerdictKey(s.verdict);
    const got = picks[s.no] ?? null;
    if (got) answered += 1;
    const isCorrect = got === expected;
    if (isCorrect) correct += 1;
    return { no: s.no, expected, got, isCorrect };
  });
  return {
    correct,
    answered,
    total: sentences.length,
    percent: sentences.length ? Math.round((correct / sentences.length) * 100) : 0,
    detail,
  };
}

export function scoreWorkbench(caseData, caseState) {
  const questions = workbenchQuestions(caseData);
  const correctMap = caseState?.step3?.correct ?? {};
  const correct = questions.filter((q) => correctMap[q.id]).length;
  return {
    correct,
    total: questions.length,
    percent: questions.length ? Math.round((correct / questions.length) * 100) : 0,
  };
}

export function scoreApa(caseState) {
  return {
    best: caseState?.step4?.bestScore ?? 0,
    attempts: caseState?.step4?.attempts ?? 0,
  };
}

/** 6단계 가운데 학생이 실제로 내용을 채운 단계 수 */
export function completedSteps(caseData, caseState) {
  if (!caseState) return [];
  const done = [];
  if (caseState.step0?.chosenOptionId && caseState.step0?.myQuestion?.trim()) done.push(0);
  if (caseState.visited?.includes(1)) done.push(1);
  const sentenceCount = caseData.aiResponse.sentences.length;
  if (Object.keys(caseState.step2?.verdicts ?? {}).length === sentenceCount) done.push(2);
  const wb = workbenchQuestions(caseData);
  const answeredWb = wb.filter(
    (q) => caseState.step3?.correct?.[q.id] || caseState.step3?.revealed?.[q.id],
  ).length;
  if (wb.length > 0 && answeredWb === wb.length) done.push(3);
  if ((caseState.step4?.attempts ?? 0) > 0) done.push(4);
  if (caseState.step5?.narrative?.trim() && caseState.step5?.memo?.every((m) => m.trim())) done.push(5);
  if (Object.keys(caseState.step6?.rubric ?? {}).length === 4) done.push(6);
  return done;
}

export function isCaseComplete(caseData, caseState) {
  return completedSteps(caseData, caseState).length === 7;
}
