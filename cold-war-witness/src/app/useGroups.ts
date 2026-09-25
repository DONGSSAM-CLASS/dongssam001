import { useEffect, useState } from 'react';
import { subscribeGroups } from '../lib/db';
import type { GroupRecord } from '../types/db';

/** 학급의 모든 모둠 (그 화면에 있는 동안만 구독한다) */
export function useGroups(classId: string | undefined) {
  const [groups, setGroups] = useState<GroupRecord[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    if (!classId) return;
    setGroups(null);
    return subscribeGroups(classId, setGroups, setError);
  }, [classId]);
  return { groups, error };
}
