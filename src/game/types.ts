/**
 * 『아직 오지 않은 광복』 — 게임 콘텐츠 타입
 *
 * 이 게임은 한국광복군(1940~1945)에 대한 정확한 역사적 사실을 바탕으로 한
 * 웹페이지 기반 시뮬레이션 추리 게임이다. 학생은 시대 순서대로 챕터를 진행하며
 * 실제 사료(원문)와 중학생 수준의 해석본, APA 출처를 확인하고, 추리 미션을 푼다.
 *
 * 난이도(level)는 '중학생용(middle)'과 '고등학생용(high)'으로 나뉜다.
 * 전체 서사·사료·사건은 동일하되 해석본의 어휘·설명의 깊이만 달라진다.
 */

export type Level = 'middle' | 'high';

/** 난이도별로 달라지는 텍스트 (동일 내용, 수준만 차별화) */
export interface Leveled {
  middle: string;
  high: string;
}

/** 실제 사료: 원문 + 해석본 + APA 출처 */
export interface Source {
  id: string;
  /** 사료의 종류 (예: 선언문, 회고록, 성명서) */
  kind: string;
  /** 사료 원문(발췌). 한자·옛 표기가 포함될 수 있다. */
  original: string;
  /** 중·고 수준별 쉬운 해석본 */
  interpretation: Leveled;
  /** APA 형식 출처 */
  citationApa: string;
  /** 원문 검증·소장처 안내(교사용) */
  note?: string;
}

/** 등장인물 대사 (사료가 그 인물의 말·글에서 온 경우 sourceId로 연결) */
export interface Dialogue {
  figureId: string;
  /** 말풍선 대사 (수준별) */
  line: Leveled;
  /** 대사 아래에 붙일 사료(있으면) */
  sourceId?: string;
}

export type QuestKind = 'choice' | 'multi' | 'order';

export interface QuestOption {
  id: string;
  label: string;
}

/** 추리 미션(퀘스트) */
export interface Quest {
  /** 학생에게 보여줄 질문 (수준별) */
  question: Leveled;
  kind: QuestKind;
  options: QuestOption[];
  /** 정답 id 목록. choice는 1개, multi는 여러 개, order는 정답 순서 */
  answer: string[];
  /** 정답 확인 후 해설 (수준별) */
  explanation: Leveled;
  /** 힌트 (수준별, 선택) */
  hint?: Leveled;
  points: number;
}

/** 시대순 챕터 = 하나의 미션 단위 */
export interface Chapter {
  id: string;
  order: number;
  /** 상태창·타임라인에 쓰는 시기 라벨 (예: "1940. 9. 17.") */
  dateLabel: string;
  /** 장소 (예: "중국 충칭 가릉빈관") */
  place: string;
  title: string;
  /** 시네마틱 배경 씬 키 (SVG) */
  scene: SceneKey;
  /** 한 줄 시네마틱 자막 */
  cinematicCaption: string;
  /** 도입 내레이션 (수준별) */
  intro: Leveled;
  /** 등장인물 대사 순서 */
  dialogues: Dialogue[];
  /** 이 챕터에서 등장하는 사료 */
  sources: Source[];
  /** 추리 미션 */
  quest: Quest;
  /** 상태창에 표시할 미션 목표 (수준별) */
  missionObjective: Leveled;
  /** 클리어 후 획득 배지 */
  badge: { icon: string; label: string };
  /** 2022 개정 교육과정 연계 안내 */
  curriculum: string;
}

export type SceneKey =
  | 'chongqing-night'
  | 'ceremony'
  | 'recruit'
  | 'declaration'
  | 'burma'
  | 'oss-xian'
  | 'liberation-dawn';

/** 등장인물 사전 */
export interface Figure {
  id: string;
  name: string;
  hanja?: string;
  /** 직책·역할 */
  role: string;
  /** 초상 아바타 색상(테마) */
  accent: string;
  /** 인물 소개 (수준별) */
  bio: Leveled;
  /** 교과서 안/밖 구분 */
  inTextbook: boolean;
}
