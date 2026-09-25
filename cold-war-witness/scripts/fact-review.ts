/**
 * 교사 검토용 사실 카드 목록을 Markdown 으로 만든다.
 *   npm run facts:doc   →  docs/fact-cards.md
 */
import { writeFileSync } from 'node:fs';
import { FACTS } from '../src/data/facts';
import { CHAPTERS } from '../src/data/scenarios';

const where = new Map<string, string[]>();
for (const c of CHAPTERS) {
  const add = (id: string, label: string) => where.set(id, [...(where.get(id) ?? []), label]);
  c.introFactIds.forEach((id) => add(id, `CH${c.no} 인트로`));
  c.scenes.forEach((s) => s.factIds.forEach((id) => add(id, `CH${c.no} 장면 ${s.no}`)));
  c.outroFactIds.forEach((id) => add(id, `CH${c.no} 마무리`));
}

const lines: string[] = [
  '# 사실 카드 전체 목록 (교사 검토용)',
  '',
  '> 이 파일은 `npm run facts:doc` 으로 `src/data/facts.ts` 에서 자동 생성됩니다. 직접 고치지 말고 facts.ts 를 고쳐 주세요.',
  '> ⚠️ 표시는 명세서에 출처 URL 이 없거나 교사 확인이 더 필요한 카드입니다.',
  '',
];
for (const c of CHAPTERS) {
  lines.push(`## CHAPTER ${c.no} — ${c.title}`, '');
  lines.push('| | id | 날짜 | 제목 | 본문 | 출처 | 쓰이는 곳 |', '|---|---|---|---|---|---|---|');
  for (const f of FACTS.filter((x) => x.chapter === c.id)) {
    const src = f.source.url ? `[${f.source.org}](${f.source.url})` : `${f.source.org} (URL 없음)`;
    const flag = f.needsCheck ? '⚠️' : '';
    const kind = f.kind ? ` \`${f.kind}\`` : '';
    lines.push(
      `| ${flag} | \`${f.id}\`${kind} | ${f.dateLabel ?? ''} | ${f.title} | ${f.body} | ${src} | ${(where.get(f.id) ?? []).join(', ')} |`,
    );
    if (f.note) lines.push(`| | | | | ↳ 메모: ${f.note} | | |`);
  }
  lines.push('');
}
writeFileSync(new URL('../docs/fact-cards.md', import.meta.url), lines.join('\n'));
console.log(`docs/fact-cards.md — 사실 카드 ${FACTS.length}장`);
