/**
 * CSV 내보내기 — 번호·닉네임·선택·감정·성찰 답변·선언문 (평가·기록용)
 * 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 을 붙인다.
 */
import { CHAPTERS } from '../data/scenarios';
import { EMOTIONS } from '../data/emotions';
import { getPrinciple } from '../data/principles';
import { FACTS } from '../data/facts';
import { CORE_VALUES } from '../data/principles';
import { FORMATS, PLAN_FIELDS, ROLES, RUBRIC, STAGES } from '../data/project';
import type { FinalReviewDoc, GroupDoc, PlanReviewDoc, ReviewDoc, StudentDoc } from '../types/db';
import { stepLabel } from './progress';
import { averageScores, checksDone, membersOf } from './project';

/** 엑셀 수식으로 읽히지 않게(=, +, -, @ 로 시작) 앞에 작은따옴표를 붙이고, 따옴표로 감싼다. */
export function csvCell(value: string | number | null | undefined): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsv(students: Pick<StudentDoc, 'number' | 'nickname' | 'groupNo' | 'progress' | 'choices' | 'emotions' | 'answers' | 'cards' | 'declaration'>[]): string {
  const header: string[] = ['번호', '닉네임', '모둠', '받은 원칙 카드 수', '받은 원칙 카드'];
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
        st.groupNo ? `${st.groupNo}모둠` : '',
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

const PLAN_STATUS_LABEL = { draft: '작성 중', submitted: '제출', approved: '승인', revise: '고칠 점 있음' } as const;

/** 모둠별 CSV — 기획서·윤리 점검·동료 검토·제작 기록·제출·발표 평가 */
export function buildGroupCsv(groups: GroupDoc[], reviews: ReviewDoc[]): string {
  const roleName = (id: string) => ROLES.find((r) => r.id === id)?.name.split(' (')[0] ?? id;
  const header = [
    '모둠',
    '모둠 이름',
    '모둠원(번호 닉네임: 역할)',
    '사건 파일',
    '모둠 약속',
    '콘텐츠 형식',
    ...PLAN_FIELDS.map((f) => f.label),
    '근거 사실 카드',
    '중심 원칙',
    '세부 항목',
    '3대 가치',
    '기획 윤리 점검',
    '기획서 상태',
    '교사 의견',
    '받은 기획서 검토',
    '제작 단계',
    '스토리보드',
    '쓴 AI 도구',
    'AI를 쓴 곳',
    '사람이 한 일',
    'AI 활용 표기',
    '출처',
    '최종 윤리 점검',
    '작품 링크',
    '작품 소개',
    '제작 후기',
    '발표 평가 수',
    ...RUBRIC.map((r) => `평균: ${r.name}`),
    '받은 칭찬',
    '받은 제안',
  ];
  const rows = [...groups]
    .sort((a, b) => a.no - b.no)
    .map((g) => {
      const p = g.plan;
      const fmt = FORMATS.find((f) => f.id === p.format);
      const planRev = reviews.filter((r): r is PlanReviewDoc => r.kind === 'plan' && r.toGroup === g.no);
      const finals = reviews.filter((r): r is FinalReviewDoc => r.kind === 'final' && r.toGroup === g.no);
      const avg = averageScores(finals);
      const pc = checksDone(g.planChecks);
      const fc = checksDone(g.finalChecks);
      return [
        `${g.no}모둠`,
        g.name,
        membersOf(g.members)
          .map((m) => `${m.number} ${m.nickname}: ${m.roles.map(roleName).join('·')}`)
          .join(' / '),
        CHAPTERS.find((c) => c.id === g.caseId)?.title ?? '',
        g.pledge,
        fmt ? (fmt.id === 'other' ? `기타(${p.formatOther})` : fmt.name) : '',
        ...PLAN_FIELDS.map((f) => p[f.id]),
        p.factIds.map((id) => FACTS.find((f) => f.id === id)?.title ?? id).join(', '),
        p.principleIds.map((id) => getPrinciple(id).name).join(', '),
        p.aspectTags.join(', '),
        p.valueIds.map((id) => CORE_VALUES.find((v) => v.id === id)?.name ?? id).join(', '),
        `${pc.done}/${pc.total}`,
        PLAN_STATUS_LABEL[g.planStatus],
        g.teacherComment,
        planRev.map((r) => `[${r.fromGroup}모둠] 칭찬: ${r.praise} / 제안: ${r.suggest} / 윤리: ${r.ethics}`).join('\n'),
        STAGES.find((s) => s.id === g.stage)?.name ?? '',
        Object.entries(g.storyboard)
          .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
          .map(([k, v]) => `${k.slice(1)}: ${v}`)
          .join('\n'),
        g.aiLog.tools,
        g.aiLog.where,
        g.aiLog.human,
        g.aiLog.label,
        g.sources,
        `${fc.done}/${fc.total}`,
        g.submission?.url ?? '',
        g.submission?.intro ?? '',
        g.submission?.note ?? '',
        avg.count,
        ...RUBRIC.map((r) => (avg.count ? avg[r.id] : '')),
        finals.map((r) => r.praise).filter(Boolean).join('\n'),
        finals.map((r) => r.suggest).filter(Boolean).join('\n'),
      ];
    });
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}
