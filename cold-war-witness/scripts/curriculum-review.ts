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
import type { CurriculumLink } from '../src/types/content';

const L: string[] = [
  '# 교육과정 연계표 (교사 검토용)',
  '',
  '> `npm run curriculum:doc` 으로 `src/data/curriculum.ts`·`scenarios.ts` 에서 자동 생성됩니다. 직접 고치지 마세요.',
  `> 출처: ① ${HISTORY_DOC.title} ② 「${KSEL_DOC.title}」(${KSEL_DOC.reportNo}, ${KSEL_DOC.publisher}, ${KSEL_DOC.year})`,
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
  '## 3. 차시·챕터별 연계',
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
for (const c of CHAPTERS) row(`${c.no}차시 · CHAPTER ${c.no} 「${c.title}」`, c.curriculum);
row('3차시 후반 · FINALE 「나의 AI 윤리 실천 선언문」', FINALE_CURRICULUM);

L.push('## 4. 설계 근거 — 교육과정 원문과 이 앱의 반영', '');
L.push('| 문서 | 위치 | 원문 | 이 앱에서 |', '|---|---|---|---|');
for (const q of HISTORY_QUOTES) L.push(`| 역사 | ${q.where} | ${q.text} | ${q.applied} |`);
for (const q of KSEL_QUOTES) L.push(`| K-SEL | ${q.where} | ${q.text} | ${q.applied} |`);
L.push('');

writeFileSync(new URL('../docs/curriculum-map.md', import.meta.url), L.join('\n'));
console.log('docs/curriculum-map.md 생성');
