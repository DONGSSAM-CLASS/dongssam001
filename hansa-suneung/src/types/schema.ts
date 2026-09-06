// 데이터 모델 (프롬프트 4장). 스키마를 그대로 따른다.
// 이 타입들은 public/data/*.json 및 파이프라인 산출물의 형태를 정의한다.

// ---------- curriculum.json ----------
export type UnitLevel = '대단원' | '중단원' | '소단원';

export interface Unit {
  id: string;
  level: UnitLevel;
  order?: number;
  title: string;
  achievementStandards?: string[];
  keywords?: string[];
  children?: Unit[];
}

export interface Curriculum {
  subject: string;
  curriculumVersion: string;
  units: Unit[];
}

// ---------- exams.json ----------
export type ExamType = '수능' | '6월' | '9월';

export interface Exam {
  examId: string;
  schoolYear: number;
  type: ExamType;
  subject: string;
  boardUrl: string;
  questionPdfUrl: string | null;
  answerPdfUrl: string | null;
  totalItems: number;
  verified: boolean;
}

// ---------- items.json ----------
export type ItemType =
  | '사료제시형'
  | '지도·시각자료형'
  | '인물형'
  | '연표·순서형'
  | '개념이해형'
  | '기타';

/**
 * 검수 근거(evidence)는 저작권상 배포물(public/data/items.json)에 포함하지 않는다.
 * PDF에서 추출한 원문 텍스트이므로 로컬 draft 파일(scripts 산출물)에만 존재한다.
 */
export interface ItemEvidence {
  extractedText: string;
  sourceFile: string;
}

/** 배포용 문항 메타데이터 — evidence 없음. 학생 화면은 verified: true 만 렌더링. */
export interface Item {
  itemId: string;
  examId: string;
  number: number;
  unitIds: string[];
  topic: string | null;
  keywords: string[];
  itemType: ItemType | null;
  pdfPage: number | null;
  verified: boolean;
  verifiedAt: string | null;
  note: string;
}

/** 검수 전 초안/검수용 문항 — evidence 포함(로컬 전용, 비배포). */
export interface ItemDraft extends Item {
  evidence: ItemEvidence;
  parseWarning?: string;
}

// ---------- middleSchoolMap.json ----------
export interface MiddleSchoolMapEntry {
  msUnitId: string;
  msTitle: string;
  hsUnitIds: string[];
  bridgeSummary: string;
}
