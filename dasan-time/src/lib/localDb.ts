/**
 * 체험 모드용 데이터 통로.
 * db.ts 와 같은 인터페이스(DataApi)를 갖기 때문에 화면 코드를 그대로 다시 쓸 수 있다.
 * 저장은 localStorage 에만 한다. 서버로 나가는 값은 하나도 없다.
 */
import { galleryAlias } from './code';
import { clampField, emptyGroupBoard } from './defaults';
import type {
  ClassDoc,
  DataApi,
  EmotionEntry,
  GalleryItem,
  GroupBoard,
  PassCardData,
  Submission,
  SubmissionStatus,
  VoteDoc,
} from './types';
import type { ActivityId } from '../content/lessons';
import { PEER_VOTE } from '../content/lessons';

const KEY = 'dasan-time.trial.v1';

interface TrialStore {
  submissions: Record<string, Submission>;
  emotions: EmotionEntry[];
  groupBoards: Record<string, GroupBoard>;
  gallery: Record<string, GalleryItem>;
  vote: VoteDoc | null;
}

const TRIAL_UID = 'trial';

function emptyStore(): TrialStore {
  return { submissions: {}, emotions: [], groupBoards: {}, gallery: {}, vote: null };
}

function read(): TrialStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    return { ...emptyStore(), ...(JSON.parse(raw) as TrialStore) };
  } catch {
    // 저장 값이 깨졌으면 조용히 처음부터 시작한다. 체험 모드라 잃을 것이 없다.
    return emptyStore();
  }
}

function write(store: TrialStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // 저장 공간이 꽉 찼을 수 있다. 체험 모드에서는 넘어간다.
  }
  listeners.forEach((fn) => fn());
}

const listeners = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  fn();
  return () => listeners.delete(fn);
}

export function clearTrialData() {
  localStorage.removeItem(KEY);
  listeners.forEach((fn) => fn());
}

/** 체험 모드에서는 모든 차시가 열려 있다. */
const TRIAL_CLASS: ClassDoc = {
  id: 'trial',
  teacherUid: 'trial',
  name: '체험 학급',
  code: 'TRIAL0',
  school: '우리 학교',
  teacherName: '선생님',
  sessions: { pre: 'open', s1: 'open', s2: 'open', s3: 'open', home: 'open', post: 'open' },
  editLocked: false,
  commonTime: { start: '20:00', end: '21:00' },
  voteClosed: false,
  statNote: null,
  createdAt: 0,
};

/** 학급 공유 화면(감정 지도·갤러리)에 보여 줄 예시 데이터 */
const SAMPLE_EMOTIONS: EmotionEntry[] = [
  '심심해요',
  '심심해요',
  '심심해요',
  '불안해요',
  '불안해요',
  '답답해요',
  '답답해요',
  '궁금해요',
  '자유로워요',
  '편안해요',
  '외로워요',
  '초조해요',
  '홀가분해요',
].map((word, i) => ({ id: `sample-${i}`, word, createdAt: i, hidden: false }));

const SAMPLE_GALLERY: GalleryItem[] = [
  {
    app: '숏폼 영상 앱',
    time: '매일 저녁 8시~9시',
    alt: '책 10쪽 읽고 한 줄 적기',
    pledge: '나는 저녁 8시 알림이 울리면 스마트폰을 스스로 멈춘다.',
    color: 'mint' as const,
    sticker: '🌿',
  },
  {
    app: '게임 앱',
    time: '평일 밤 9시 30분~10시 30분',
    alt: '동생과 보드게임 한 판 하기',
    pledge: '나는 숙제를 끝내기 전에는 게임을 켜지 않는다.',
    color: 'sky' as const,
    sticker: '📚',
  },
  {
    app: '메신저 앱',
    time: '매일 저녁 7시~8시',
    alt: '기타 연습 20분 하기',
    pledge: '나는 저녁을 먹은 뒤 알림을 끄고 한 시간을 내 것으로 만든다.',
    color: 'butter' as const,
    sticker: '🍵',
  },
].map((card, i) => ({
  id: `sample-${i}`,
  alias: galleryAlias(`sample-${i}`, PEER_VOTE.aliasPrefix),
  card,
  visible: true,
  updatedAt: 0,
}));

export function createLocalDb(): DataApi {
  return {
    mode: 'local',
    uid: TRIAL_UID,

    async getClass() {
      return TRIAL_CLASS;
    },
    watchClass(cb) {
      cb(TRIAL_CLASS);
      return () => {};
    },

    async getSubmission(activityId) {
      return read().submissions[activityId] ?? null;
    },
    async listMySubmissions() {
      return Object.values(read().submissions);
    },
    async saveSubmission(activityId: ActivityId, data, status: SubmissionStatus) {
      const store = read();
      store.submissions[activityId] = {
        id: `${TRIAL_UID}_${activityId}`,
        ownerUid: TRIAL_UID,
        activityId,
        data,
        status,
        updatedAt: Date.now(),
      };
      write(store);
    },
    watchMySubmissions(cb) {
      return subscribe(() => cb(Object.values(read().submissions)));
    },

    async addEmotions(words) {
      const store = read();
      words.forEach((word, i) => {
        store.emotions.push({
          id: `local-${Date.now()}-${i}`,
          word: clampField(word),
          createdAt: Date.now(),
          hidden: false,
        });
      });
      write(store);
    },
    watchEmotions(cb) {
      // 예시 데이터에 내가 고른 낱말을 더해서 보여 준다.
      return subscribe(() => cb([...SAMPLE_EMOTIONS, ...read().emotions]));
    },

    watchGroupBoard(activityId, group, cb) {
      const key = `${activityId}_${group}`;
      return subscribe(() => cb(read().groupBoards[key] ?? emptyGroupBoard(activityId, group)));
    },
    async saveGroupBoard(activityId, group, patch, editorName) {
      const store = read();
      const key = `${activityId}_${group}`;
      const prev = store.groupBoards[key] ?? emptyGroupBoard(activityId, group);
      store.groupBoards[key] = {
        ...prev,
        ...patch,
        lastEditor: editorName,
        updatedAt: Date.now(),
      };
      write(store);
    },

    watchGallery(cb) {
      return subscribe(() => {
        const mine = Object.values(read().gallery).filter((g) => g.visible);
        cb([...SAMPLE_GALLERY, ...mine]);
      });
    },
    async saveGalleryItem(card: PassCardData, visible, alias) {
      const store = read();
      store.gallery[TRIAL_UID] = {
        id: TRIAL_UID,
        alias,
        card,
        visible,
        updatedAt: Date.now(),
      };
      write(store);
    },

    async getMyVote() {
      return read().vote;
    },
    async saveVote(picks, reason) {
      const store = read();
      store.vote = {
        id: TRIAL_UID,
        picks,
        reason: clampField(reason),
        updatedAt: Date.now(),
      };
      write(store);
    },
  };
}
