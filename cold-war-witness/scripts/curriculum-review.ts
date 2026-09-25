/**
 * 교사 검토용 교육과정 연계표를 Markdown 으로 만든다.
 *   npm run curriculum:doc   →  docs/curriculum-map.md
 */
import { writeFileSync } from 'node:fs';
import {
  FINALE_CURRICULUM,
  HISTORY_DOC,
  HISTORY_QUOTES,
  HISTORY_STANDARDS,
  KSEL_COMPETENCIES,
  KSEL_DOC,
  KSEL_QUOTES,
  KSEL_STANDARDS,
  getKselCompetency,
} from '../src/data/curriculum';
import { CHAPTERS } from '../src/data/scenarios';
import { CORE_VALUES, PRINCIPLES, PRINCIPLES_NOTE, PRINCIPLES_TITLE } from '../src/data/principles';
import { ACTIVITY_LABEL, ETHICS_CHECKS, LESSON_SESSIONS, PROJECT_TITLE, ROLES } from '../src/data/project';
import type { CurriculumLink } from '../src/types/content';

const L: string[] = [
  '# 교육과정 연계표 (교사 검토용)',
  '',
  '> `npm run curriculum:doc` 으로 `src/data/curriculum.ts`·`project.ts`·`principles.ts`·`scenarios.ts` 에서 자동 생성됩니다. 직접 고치지 마세요.',
  `> 수업: ${PROJECT_TITLE} (6차시)`,
  `> 출처: ① ${HISTORY_DOC.title} ② 「${KSEL_DOC.title}」(${KSEL_DOC.reportNo}, ${KSEL_DOC.publisher}, ${KSEL_DOC.year}) ③ 「${PRINCIPLES_TITLE}」(${PRINCIPLES_NOTE})`,
  '',
  '## 1. 성취기준 원문',
  '',
  '| 코드 | 성취기준 | 해설 |',
  '|---|---|---|',
  ...HISTORY_STANDARDS.map((s) => `| ${s.code} | ${s.text} | ${s.commentary ?? ''} |`),
  ...KSEL_STANDARDS.map((s) => `| ${s.code} (${s.domain}) | ${s.text} | ${s.commentary ?? ''} |`),
  '',
  '## 2. K-SEL 4대 사회정서역량',
  '',
  '| 역량 | 정의 (원문) | 중학교 목표 (원문) | 학생용 풀이 |',
  '|---|---|---|---|',
  ...KSEL_COMPETENCIES.map((c) => `| ${c.name} | ${c.definition} | ${c.middleSchoolGoal} | ${c.studentText} |`),
  '',
  '## 3. 「대한민국 인공지능 윤리원칙」과 이 수업',
  '',
  '| 원칙 | 세부 항목 (원문) | 중심 차시 | 윤리 점검 문항 | 이어지는 역할 | 사건 파일 |',
  '|---|---|---|---|---|---|',
  ...PRINCIPLES.map((p) => {
    const sessions = LESSON_SESSIONS.filter((s) => s.principleIds.includes(p.id)).map((s) => `${s.no}차시`).join(', ');
    const checks = ETHICS_CHECKS.filter((c) => c.principleId === p.id).map((c) => `${c.id}(${c.aspectTag})`).join(', ');
    const roles = ROLES.filter((r) => r.principleIds.includes(p.id)).map((r) => r.name).join(', ');
    const ch = CHAPTERS.find((c) => c.id === p.chapter)!;
    return `| ${p.name} | ${p.aspects.map((a) => a.tag).join(' · ')} | ${sessions} | ${checks} | ${roles || '—'} | 「${ch.title}」 |`;
  }),
  '',
  `3대 가치: ${CORE_VALUES.map((v) => v.name).join(' · ')} — 기획서에서 작품이 지키려는 가치를 고른다.`,
  '',
  '## 4. 차시별 연계 (6차시)',
  '',
];

const row = (title: string, l: CurriculumLink) => {
  L.push(`### ${title}`, '');
  L.push('| 구분 | 역사 (2022 개정) | 한국형 사회정서교육 |', '|---|---|---|');
  L.push(`| 성취기준 | ${l.history.standards.join(' ')} | ${l.ksel.standards.join(' ')} |`);
  L.push(`| 역량·영역 | — | ${l.ksel.competencies.map((id) => getKselCompetency(id).name).join(', ')} / ${l.ksel.domains.join(', ')} |`);
  L.push(`| 지식·이해 | ${l.history.knowledge.join(', ')} | ${l.ksel.knowledge.join(', ')} |`);
  L.push(`| 과정·기능 | ${l.history.skills.join(', ')} | ${l.ksel.skills.join(', ')} |`);
  L.push(`| 가치·태도 | ${l.history.values.join(', ')} | ${l.ksel.values.join(', ')} |`, '');
};
for (const ses of LESSON_SESSIONS) {
  row(`${ses.no}차시 (${ses.block}) · ${ses.title}`, ses.curriculum);
  L.splice(L.length - 1, 0, `| 앱 활동 | ${ses.activities.map((a) => ACTIVITY_LABEL[a].name).join(', ')} | AI 윤리원칙: ${ses.principleIds.map((id) => PRINCIPLES.find((p) => p.id === id)!.name).join(', ')} |`);
}

L.push('## 5. 사건 파일(시뮬레이션)별 연계 — 2차시 탐구', '');
for (const c of CHAPTERS) row(`CHAPTER ${c.no} 「${c.title}」`, c.curriculum);
row('6차시 후반 · 「나의 AI 윤리 실천 선언문」', FINALE_CURRICULUM);

L.push('## 6. 설계 근거 — 교육과정 원문과 이 앱의 반영', '');
L.push('| 문서 | 위치 | 원문 | 이 앱에서 |', '|---|---|---|---|');
for (const q of HISTORY_QUOTES) L.push(`| 역사 | ${q.where} | ${q.text} | ${q.applied} |`);
for (const q of KSEL_QUOTES) L.push(`| K-SEL | ${q.where} | ${q.text} | ${q.applied} |`);
L.push('');

writeFileSync(new URL('../docs/curriculum-map.md', import.meta.url), L.join('\n'));
console.log('docs/curriculum-map.md 생성');
