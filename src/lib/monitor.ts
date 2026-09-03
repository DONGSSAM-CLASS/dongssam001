/**
 * 실시간 모니터링 보조 (순수 함수) — 학생별 색상, 요약 통계, CSV 내보내기.
 */
import { formatYear } from '@/lib/history';
import type { ClassMemberDoc, MissionDoc, StudentWorkDoc, SubmissionDoc } from '@/types/firestore';

/** 번호에서 안정적인 색상을 만든다(황금각으로 분산, 색약을 고려해 채도·명도 고정) */
export function studentColor(number: number): string {
  const hue = (number * 137.508) % 360;
  return `hsl(${hue.toFixed(0)} 70% 58%)`;
}

export interface MonitorRow {
  number: number;
  name: string;
  uid: string | null;
  joined: boolean;
  active: boolean;
  pins: number;
  routes: number;
  totalKm: number;
  lastYear: number | null;
  submitted: boolean;
  submittedAt: Date | null;
  color: string;
}

function toDate(ts: unknown): Date | null {
  const t = ts as { toDate?: () => Date } | null;
  return t?.toDate ? t.toDate() : null;
}

export function buildRows(
  members: (ClassMemberDoc & { id: string })[],
  works: (StudentWorkDoc & { id: string })[],
  submissions: (SubmissionDoc & { id: string })[],
): MonitorRow[] {
  const workByNumber = new Map(works.map((w) => [w.number, w]));
  const subByNumber = new Map(submissions.filter((s) => s.status === 'submitted').map((s) => [s.number, s]));
  return members
    .map((m) => {
      const w = workByNumber.get(m.number);
      const sub = subByNumber.get(m.number);
      const pins = w?.pins ?? [];
      return {
        number: m.number,
        name: m.nickname ?? m.displayName,
        uid: m.uid,
        joined: Boolean(m.uid),
        active: m.active,
        pins: pins.length,
        routes: w?.routes?.length ?? 0,
        totalKm: (w?.routes ?? []).reduce((n, r) => n + r.totalKm, 0),
        lastYear: pins.length ? pins[pins.length - 1].year : null,
        submitted: Boolean(sub),
        submittedAt: sub ? toDate(sub.submittedAt) : null,
        color: studentColor(m.number),
      };
    })
    .sort((a, b) => a.number - b.number);
}

export interface MonitorSummary {
  total: number;
  joined: number;
  working: number;
  submitted: number;
  pins: number;
  routes: number;
}

export function summarize(rows: MonitorRow[]): MonitorSummary {
  return {
    total: rows.length,
    joined: rows.filter((r) => r.joined).length,
    working: rows.filter((r) => r.pins > 0 || r.routes > 0).length,
    submitted: rows.filter((r) => r.submitted).length,
    pins: rows.reduce((n, r) => n + r.pins, 0),
    routes: rows.reduce((n, r) => n + r.routes, 0),
  };
}

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** 엑셀에서 한글이 깨지지 않도록 BOM 을 붙인다 */
export const CSV_BOM = '﻿';

export function rowsToCsv(rows: MonitorRow[], sessionTitle: string): string {
  const head = ['번호', '이름', '가입', '활성', '핀 수', '루트 수', '총 이동거리(km)', '마지막 핀 연대', '미션 제출', '제출 시각'];
  const body = rows.map((r) => [
    r.number,
    r.name,
    r.joined ? 'O' : 'X',
    r.active ? 'O' : 'X',
    r.pins,
    r.routes,
    Math.round(r.totalKm),
    r.lastYear === null ? '' : formatYear(r.lastYear),
    r.submitted ? 'O' : 'X',
    r.submittedAt ? r.submittedAt.toLocaleString('ko-KR') : '',
  ]);
  return CSV_BOM + [[`# ${sessionTitle}`], head, ...body].map((line) => line.map(csvCell).join(',')).join('\r\n');
}

/** 핀·루트 상세 CSV (한 줄 = 핀 하나) */
export function detailCsv(
  members: (ClassMemberDoc & { id: string })[],
  works: (StudentWorkDoc & { id: string })[],
  sessionTitle: string,
): string {
  const nameOf = new Map(members.map((m) => [m.number, m.nickname ?? m.displayName]));
  const head = ['번호', '이름', '종류', '제목', '연대', '위도', '경도', '메모/설명', '총거리(km)'];
  const lines: unknown[][] = [[`# ${sessionTitle} — 핀·루트 상세`], head];
  for (const w of works.slice().sort((a, b) => a.number - b.number)) {
    for (const p of w.pins) lines.push([w.number, nameOf.get(w.number) ?? '', '핀', p.name, formatYear(p.year), p.lat.toFixed(3), p.lon.toFixed(3), p.memo, '']);
    for (const r of w.routes) {
      const names = r.pinIds.map((id) => w.pins.find((p) => p.id === id)?.name ?? '?').join(' → ');
      lines.push([w.number, nameOf.get(w.number) ?? '', '루트', r.title, '', '', '', `${names}${r.description ? ` / ${r.description}` : ''}`, Math.round(r.totalKm)]);
    }
  }
  return CSV_BOM + lines.map((line) => line.map(csvCell).join(',')).join('\r\n');
}

/** 미션 요구 조건 자동 점검(교사 확인용 보조) */
export function checkRequirements(mission: MissionDoc, work: StudentWorkDoc | undefined): { text: string; ok: boolean }[] {
  return (mission.requirements ?? []).map((req) => {
    const check = req.check;
    if (!check || !work) return { text: req.text, ok: false };
    if (check.type === 'min_pins') return { text: req.text, ok: work.pins.length >= check.value };
    if (check.type === 'min_routes') return { text: req.text, ok: work.routes.length >= check.value };
    return { text: req.text, ok: false };
  });
}
