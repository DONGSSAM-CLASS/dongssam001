import { useEffect, useRef, useState } from 'react';
import { publishStats, subscribeAllReviews, subscribeClass, subscribeGroups, subscribeHighlights, subscribeStudents } from '../../lib/db';
import { computeChoiceStats, statsKey } from '../../lib/stats';
import type { ClassRecord, GroupRecord, ReviewRecord, StudentRecord } from '../../types/db';

export type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/** 교사 화면: 학급 + 학생 전체 + 모둠 + 검토·평가 + 하이라이트를 실시간으로 받는다. */
export function useClassData(classId: string | undefined) {
  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [highlights, setHighlights] = useState<Record<string, true>>({});
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!classId) return;
    setState('loading');
    const u1 = subscribeClass(
      classId,
      (c) => {
        setCls(c);
        setState(c ? 'ready' : 'missing');
      },
      (e) => {
        const code = typeof e === 'object' && e && 'code' in e ? (e as { code: string }).code : '';
        setState(code === 'permission-denied' ? 'missing' : 'error');
      },
    );
    const u2 = subscribeStudents(classId, setStudents, () => undefined);
    const u3 = subscribeHighlights(classId, setHighlights, () => undefined);
    const u4 = subscribeGroups(classId, setGroups, () => undefined);
    const u5 = subscribeAllReviews(classId, setReviews, () => undefined);
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
    };
  }, [classId]);

  return { cls, students, highlights, groups, reviews, state };
}

/**
 * 선택 분포 공개가 켜져 있으면, 학생 기록이 바뀔 때마다 숫자만 모아 public/stats 에 써 둔다.
 * (Cloud Functions 없이 학생이 볼 수 있게 하는 방법 — 교사 화면이 열려 있는 동안 갱신된다)
 */
export function useStatsPublisher(cls: ClassRecord | null, students: StudentRecord[]) {
  const last = useRef<string>('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const on = !!cls?.showDistribution;
  const classId = cls?.id;

  useEffect(() => {
    if (!on || !classId) {
      last.current = '';
      return;
    }
    const stats = computeChoiceStats(students);
    const key = statsKey(stats);
    if (key === last.current) return;
    if (timer.current) clearTimeout(timer.current);
    // 여러 학생이 한꺼번에 선택해도 쓰기가 몰리지 않도록 2초 모아서 쓴다.
    timer.current = setTimeout(() => {
      publishStats(classId, stats)
        .then(() => {
          last.current = key;
        })
        .catch(() => undefined);
    }, last.current ? 2000 : 0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [on, classId, students]);
}
