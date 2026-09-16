import type { ClassDoc, GroupBoard, Submission } from './types';
import type { ActivityId, SessionKey } from '../content/lessons';

export const DEFAULT_SESSIONS: Record<SessionKey, ClassDoc['sessions'][SessionKey]> = {
  pre: 'locked',
  s1: 'locked',
  s2: 'locked',
  s3: 'locked',
  home: 'locked',
  post: 'locked',
};

export function emptySubmission(activityId: ActivityId, ownerUid: string): Submission {
  return {
    id: `${ownerUid}_${activityId}`,
    ownerUid,
    activityId,
    data: {},
    status: 'draft',
    updatedAt: 0,
  };
}

export function emptyGroupBoard(activityId: ActivityId, group: number): GroupBoard {
  return {
    id: `${activityId}_${group}`,
    activityId,
    group,
    cells: {},
    notes: [],
    lastEditor: '',
    updatedAt: 0,
  };
}

/** 한 칸에 넣을 수 있는 최대 글자 수. 보안 규칙에서도 같은 값을 쓴다. */
export const MAX_FIELD_LENGTH = 500;

export function clampField(value: string): string {
  return value.slice(0, MAX_FIELD_LENGTH);
}
