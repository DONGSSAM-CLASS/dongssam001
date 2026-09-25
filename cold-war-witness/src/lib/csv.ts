/**
 * CSV 내보내기 — 번호·닉네임·선택·감정·성찰 답변·선언문 (평가·기록용)
 * 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 을 붙인다.
 */
import { CHAPTERS } from '../data/scenarios';
import { EMOTIONS } from '../data/emotions';
import { getPrinciple } from '../data/principles';
import type { StudentDoc } from '../types/db';
import { stepLabel } from './progress';

/** 엑셀 수식으로 읽히지 않게(=, +, -, @ 로 시작) 앞에 작은따옴표를 붙이고, 따옴표로 감싼다. */
export function csvCell(value: string | number | null | undefined): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsv(students: Pick<StudentDoc, 'number' | 'nickname' | 'progress' | 'choices' | 'emotions' | 'answers' | 'cards' | 'declaration'>[]): string {
  const header: string[] = ['번호', '닉네임', '받은 원칙 카드 수', '받은 원칙 카드'];
  for (const c of CHAPTERS) {
    header.push(`CH${c.no} 진행`);
    for (const s of c.scenes) header.push(`CH${c.no}-장면${s.no} 감정`, `CH${c.no}-장면${s.no} 선택`);
    c.reflection.questions.forEach((_, i) => header.push(`CH${c.no} AI 연결 질문${i + 1}`));
    header.push(`CH${c.no} 마무리 성찰`);
  }
  header.push('선언문: 지킬 것', '선언문: 냉전 시대의', '선언문: 배운 것', '선언문: 자유 서술');

  const rows = [...students]
    .sort((a, b) => a.number - b.number)
    .map((st) => {
      const row: (string | number)[] = [
        st.number,
        st.nickname,
        st.cards.length,
        st.cards.map((id) => getPrinciple(id).name).join(', '),
      ];
      for (const c of CHAPTERS) {
        row.push(stepLabel(st.progress[c.id]));
        for (const s of c.scenes) {
          const emo = EMOTIONS.find((e) => e.id === st.emotions[s.id]);
          const choice = s.choices.find((x) => x.id === st.choices[s.id]);
          row.push(emo?.label ?? '', choice ? `${choice.id}) ${choice.label}` : '');
        }
        for (const q of c.reflection.questions) row.push(st.answers[q.id] ?? '');
        row.push(st.answers[c.wrapupId] ?? '');
      }
      const d = st.declaration;
      row.push(d?.keep ?? '', d?.era ?? '', d?.lesson ?? '', d?.free ?? '');
      return row;
    });

  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}
