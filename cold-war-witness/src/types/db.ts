/**
 * Firestore 문서 타입. 구조 설명은 docs/data-model.md 에 있다.
 * 필드를 바꾸면 firestore.rules 의 검증 함수도 함께 바꿔야 한다.
 */
import type { Timestamp } from 'firebase/firestore';
import type { ChapterId, EmotionId, PrincipleId } from './content';

/** 챕터 안에서 학생이 어디까지 왔는지 (장면 단위 자동 저장) */
export type ChapterStep = 'intro' | 's1' | 's2' | 's3' | 's4' | 's5' | 'reflect' | 'wrapup' | 'done';

export type ChoiceId = 'a' | 'b' | 'c';

/** classes/{classId} — 교사가 만든 학급 */
export interface ClassDoc {
  name: string; // 1~30자
  code: string; // 6자리 학급 코드
  teacherUid: string;
  /** 교사가 잠금 해제한 챕터. finale 은 선언문 단계 */
  unlocked: Record<ChapterId | 'finale', boolean>;
  /** 학생 화면에 학급 선택 분포를 보여 줄지 */
  showDistribution: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** classCodes/{code} — 학급 코드 → 학급 id 조회용 (한 건씩 get 만 허용, 목록 조회 금지) */
export interface ClassCodeDoc {
  classId: string;
  className: string;
  teacherUid: string;
  createdAt: Timestamp;
}

/** classes/{classId}/members/{uid} — 이 익명 계정이 몇 번 학생인지 (학급 문서 읽기 권한 확인용) */
export interface MemberDoc {
  number: number;
  joinedAt: Timestamp;
}

/** 선언문 */
export interface Declaration {
  /** "나는 AI를 사용할 때 ___을(를) 지키겠습니다." (1~30자) */
  keep: string;
  /** 고른 원칙 (선택) */
  principleId: PrincipleId | null;
  /** "냉전 시대의 ___에서" (1~40자) */
  era: string;
  /** "___을(를) 배웠기 때문입니다." (1~80자) */
  lesson: string;
  /** 자유 서술 (0~300자) */
  free: string;
  submittedAt: Timestamp;
}

/**
 * classes/{classId}/students/{number} — 학생 한 명의 모든 기록.
 * 문서 id 는 번호(문자열). uid 는 지금 이 자리를 쓰는 익명 계정.
 * 기기가 바뀌면 PIN 으로 uid 를 새 계정으로 옮긴다.
 */
export interface StudentDoc {
  uid: string;
  number: number; // 1~99
  nickname: string; // 1~10자
  /** SHA-256(앱 salt : classId : number : PIN) 16진수 64자 */
  pinHash: string;
  progress: Partial<Record<ChapterId, ChapterStep>>;
  /** 장면 id('ch1-s1') → 선택 */
  choices: Record<string, ChoiceId>;
  /** 장면 id → 감정 */
  emotions: Record<string, EmotionId>;
  /** 성찰 문항 id('ch1-q1', 'ch1-wrap') → 답변 (최대 500자) */
  answers: Record<string, string>;
  /** 획득한 원칙 카드 */
  cards: PrincipleId[];
  declaration: Declaration | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * classes/{classId}/public/stats — 학급 선택 분포 (숫자만, 개인 정보 없음).
 * 교사 대시보드가 계산해서 써 넣고, showDistribution 이 켜져 있을 때만 학생이 읽는다.
 */
export interface StatsDoc {
  /** 장면 id → { a: 3, b: 10, c: 2 } */
  choices: Record<string, Partial<Record<ChoiceId, number>>>;
  updatedAt: Timestamp;
}

/** classes/{classId}/teacherOnly/highlights — 교사가 고른 우수 답변 (학생은 읽을 수 없음) */
export interface HighlightsDoc {
  /** '번호:문항id' → true (예: '7:ch1-q1', '7:declaration') */
  items: Record<string, true>;
  updatedAt: Timestamp;
}
