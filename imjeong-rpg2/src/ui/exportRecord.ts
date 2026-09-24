import type { SaveState } from '../types';
import { quests } from '../data/quests';
import { relics } from '../data/relics';
import { figures } from '../data/figures';
import { notePrompts } from '../data/notes';
import { totalDonated } from '../engine/rules';

/**
 * 학습 기록을 글 파일(.txt)로 내려받는다.
 * 서버가 없으므로, 학생이 파일을 선생님께 제출(학급 드라이브·과제방 등)하는 방식으로 쓴다.
 */
export function recordText(s: SaveState, code: string): string {
  const who = s.nickname ? `견습 기록관 ${s.nickname}` : '견습 기록관';
  const lines: string[] = [];
  lines.push('『임시정부 : 새로운 나라를 향해』 학습 기록');
  lines.push(`${who} · ${new Date().toLocaleString('ko-KR')}`);
  lines.push(`진행 코드: ${code}`);
  lines.push(`난이도: ${s.level === 'high' ? '고등학생용' : '중학생용'} · 1탄 경험: ${s.prequelPlayed === 'yes' ? '있음' : s.prequelPlayed === 'no' ? '없음' : '-'}`);
  lines.push('');
  lines.push('■ 기록한 임무');
  for (const q of quests) {
    const mark = s.completed[q.id] ? (s.missed.includes(q.id) ? '○ 다시 풀어 맞힘' : '◎ 한 번에 맞힘') : '· 아직';
    lines.push(`  [${mark}] 제${q.act}막 ${q.title} (${q.dateLabel})`);
  }
  lines.push(`  기록 조각 ${s.relics.length} / ${relics.length}`);
  lines.push('');
  lines.push('■ 생각 노트');
  for (const p of notePrompts) {
    lines.push(`  (${p.act}) ${p.skill} — ${p.question}`);
    lines.push(`      ${s.notes[p.act] ?? '(아직 쓰지 않음)'}`);
  }
  lines.push('');
  lines.push(`■ 보훈 포인트 — 모은 것 ${s.pointsEarned} · 기부한 것 ${totalDonated(s.donations)} (게임 속 포인트이며 실제 돈이 아닙니다)`);
  for (const [id, v] of Object.entries(s.donations)) if (v > 0) lines.push(`  🌼 ${figures[id]?.name ?? id}: ${v}`);
  lines.push('');
  lines.push('■ 감사 편지');
  for (const l of s.letters) {
    lines.push(`  ${figures[l.figureId]?.name ?? l.figureId}께`);
    lines.push(`  ${l.body.replace(/\n/g, '\n  ')}`);
    lines.push(`  — ${who} 올림`);
    lines.push('');
  }
  return lines.join('\n');
}

export function downloadRecord(s: SaveState, code: string): void {
  const blob = new Blob([recordText(s, code)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `임시정부2_학습기록_${s.nickname || '기록관'}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
