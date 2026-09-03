import { describe, expect, it } from 'vitest';
import { buildRows, detailCsv, rowsToCsv, studentColor, summarize } from './monitor';
import type { ClassMemberDoc, StudentWorkDoc, SubmissionDoc } from '@/types/firestore';

const members = [
  { id: 'c_1', classId: 'c', number: 1, uid: 'u1', displayName: '가나', active: true, authGeneration: 0, resetPending: false, joinedAt: null, lastSeenAt: null },
  { id: 'c_2', classId: 'c', number: 2, uid: null, displayName: '다라', active: true, authGeneration: 0, resetPending: false, joinedAt: null, lastSeenAt: null },
] as (ClassMemberDoc & { id: string })[];

const works = [
  {
    id: 's_1', sessionId: 's', classId: 'c', number: 1, uid: 'u1', updatedAt: null,
    pins: [
      { id: 'p1', name: '개경', lat: 37.97, lon: 126.55, year: 1200, memo: '수도', createdAt: 1 },
      { id: 'p2', name: '하카타', lat: 33.59, lon: 130.4, year: 1274, memo: '', createdAt: 2 },
    ],
    routes: [{ id: 'r1', title: '항로', description: '', pinIds: ['p1', 'p2'], totalKm: 598, createdAt: 3 }],
  },
] as unknown as (StudentWorkDoc & { id: string })[];

describe('monitor', () => {
  it('builds a row per member, sorted by number', () => {
    const rows = buildRows(members, works, []);
    expect(rows.map((r) => r.number)).toEqual([1, 2]);
    expect(rows[0]).toMatchObject({ name: '가나', joined: true, pins: 2, routes: 1, totalKm: 598, lastYear: 1274, submitted: false });
    expect(rows[1]).toMatchObject({ joined: false, pins: 0 });
  });

  it('summarizes class progress', () => {
    expect(summarize(buildRows(members, works, []))).toEqual({ total: 2, joined: 1, working: 1, submitted: 0, pins: 2, routes: 1 });
  });

  it('marks submitted students', () => {
    const subs = [{ id: 'm_1', missionId: 'm', sessionId: 's', classId: 'c', number: 1, uid: 'u1', answers: {}, pinIds: [], routeIds: [], status: 'submitted', submittedAt: null, updatedAt: null }] as unknown as (SubmissionDoc & { id: string })[];
    expect(buildRows(members, works, subs)[0].submitted).toBe(true);
  });

  it('exports CSV with a BOM and Korean headers', () => {
    const csv = rowsToCsv(buildRows(members, works, []), '1200년의 세계');
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('번호,이름,가입');
    expect(csv).toContain('1274년');
    const detail = detailCsv(members, works, '1200년의 세계');
    expect(detail).toContain('개경');
    expect(detail).toContain('개경 → 하카타');
  });

  it('gives each student a distinct stable colour', () => {
    expect(studentColor(1)).toBe(studentColor(1));
    expect(studentColor(1)).not.toBe(studentColor(2));
  });
});
