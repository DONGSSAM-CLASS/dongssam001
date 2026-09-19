/**
 * 『임시정부 1919-1945』 — 아이소메트릭 3D 역사 RPG 도메인 타입
 *
 * 참조 게임: 천하제일상 『거상』 온라인 (직교 아이소메트릭 시점, 클릭 이동,
 *            도시 간 이동, 동료 영입, 자금 운용, HUD 배치)
 *
 * ⚠ 콘텐츠 원칙
 *  1. 연대·인물·사건·사료는 **실제 역사 사실**에만 근거한다.
 *     학계에서 판본·일자가 갈리는 항목은 `caveat` 에 그 사실을 함께 적는다.
 *  2. 플레이어 캐릭터(임시정부 서기)의 1인칭 진행과 NPC 안내 대사는 학습을 위한
 *     극적 재구성이지만, 그 대사가 전달하는 **사실 정보는 사료에 근거**해야 한다.
 *  3. 모든 퀘스트는 최소 1개의 `SourceRef`(APA 출처)를 가진다. 테스트로 강제한다.
 */

/** 난이도 — 기존 『아직 오지 않은 광복』과 동일한 2단계 체계를 따른다. */
export type Level = 'middle' | 'high';

/** 난이도별로 깊이만 달라지는 텍스트 (사실 내용은 동일) */
export interface Leveled {
  middle: string;
  high: string;
}

/* ────────────────────────── 사료 ────────────────────────── */

/** 실제 사료 참조 (원문 발췌 + 수준별 해석 + APA 출처) */
export interface SourceRef {
  id: string;
  /** 사료 종류 (예: 헌장, 성명서, 회고록, 공보, 신문) */
  kind: string;
  /** 사료 제목 */
  title: string;
  /** 원문 발췌. 한자·옛 표기를 포함할 수 있다. */
  original: string;
  /** 수준별 쉬운 해석 */
  interpretation: Leveled;
  /** APA 형식 출처 */
  citationApa: string;
  /** 소장처·판본 확인 안내(교사용) */
  note?: string;
}

/* ────────────────────────── 자원 ────────────────────────── */

/**
 * 플레이어 자원 5종 + 위험도 1종.
 * 거상의 「돈·물품·용병」 대신, 임시정부가 실제로 다뤄야 했던 자원을 쓴다.
 */
export interface Resources {
  /** 독립운동 자금 (단위: 원). 애국금·인구세·독립공채·미주 동포 성금으로 늘린다. */
  funds: number;
  /** 요원 — 연통제·교통국 등 국내외 연락망에 투입할 수 있는 사람 수 */
  agents: number;
  /** 국제 신망 — 열강·중국 정부를 상대로 한 외교에서 쌓이는 평판 */
  prestige: number;
  /** 군사력 — 광복군·의열 조직의 실제 작전 수행 역량 */
  forces: number;
  /** 통합도 — 좌우·지역 세력의 결속. 낮으면 분열 사건이 열린다. */
  unity: number;
  /** 일제 감시(0~100) — 높을수록 청사 습격·체포 위험이 커진다. */
  heat: number;
}

export type ResourceKey = keyof Resources;

/** 퀘스트 결과로 적용되는 자원 증감 */
export type ResourceDelta = Partial<Record<ResourceKey, number>>;

/* ────────────────────────── 맵 / 월드 ────────────────────────── */

/**
 * 타일 종류 — 맵 문자열 1글자가 타일 1칸에 대응한다.
 *  '.' 흙길  ',' 풀밭  '#' 벽/건물(통행 불가)  '~' 물(통행 불가)
 *  '=' 포장도로  '+' 실내 바닥  'T' 나무(통행 불가)  '^' 계단/언덕
 *  'S' 돌바닥  'x' 출입 금지(경계)
 */
export type TileChar = '.' | ',' | '#' | '~' | '=' | '+' | 'T' | '^' | 'S' | 'x';

export interface TileSpec {
  /** 통행 가능 여부 */
  walkable: boolean;
  /** 타일 윗면 색 (three.js MeshLambertMaterial color) */
  color: string;
  /** 타일 높이 (y) */
  height: number;
}

/** 절차적으로 세울 건물의 양식 */
export type BuildingStyle =
  /** 상하이 프랑스 조계의 석고문(石庫門) 연립주택 — 임정 청사가 있던 양식 */
  | 'shikumen'
  /** 서양식 석조 관청 (파리·워싱턴) */
  | 'western'
  /** 중국 전통 기와집 (자싱·충칭) */
  | 'chinese'
  /** 한옥 기와집 */
  | 'hanok'
  /** 충칭 산비탈의 목조 2층 가옥 (吊脚樓 계열) */
  | 'chongqing'
  /** 군용 막사·훈련장 건물 */
  | 'barracks'
  /** 천막 */
  | 'tent';

export interface BuildingSpec {
  id: string;
  style: BuildingStyle;
  /** 격자 좌표 (좌상단 기준) */
  x: number;
  z: number;
  /** 격자 크기 */
  w: number;
  d: number;
  /** 층수 */
  floors: number;
  /** 간판(한글). 비우면 간판을 달지 않는다. */
  sign?: string;
  /** 벽 색 */
  wall?: string;
  /** 지붕 색 */
  roof?: string;
}

/** 장식물 */
export type PropKind =
  /* 나무 */
  | 'tree'
  | 'pine'
  | 'willow'
  | 'cherry'
  /* 낮은 식생 */
  | 'bush'
  | 'reed'
  | 'flowerbed'
  /* 불빛 */
  | 'lantern'
  | 'stone-lantern'
  | 'streetlamp'
  /* 깃발·표지 */
  | 'flag-taegeuk'
  | 'flag-plain'
  | 'banner'
  | 'signpost'
  /* 살림·짐 */
  | 'crate'
  | 'barrel'
  | 'cart'
  | 'bench'
  | 'desk'
  | 'laundry'
  /* 지형지물 */
  | 'well'
  | 'rock'
  | 'monument'
  | 'stump';

export interface PropSpec {
  kind: PropKind;
  x: number;
  z: number;
  /** 색 덮어쓰기 */
  color?: string;
  /** 크기 배율 */
  scale?: number;
}

/** 맵(도시) 정의 */
export interface WorldMap {
  id: MapId;
  /** 한국어 지명 */
  name: string;
  /** 한자/원어 표기 */
  nameOriginal?: string;
  /** 시기 라벨 */
  period: string;
  /** 지도 선택 화면 설명 */
  summary: Leveled;
  /** 이 장소가 실제로 어떤 곳이었는지 (사실 확인용 각주) */
  historicalNote: string;
  /** 타일 배치. 각 문자열이 z행, 각 글자가 x칸. 모든 행 길이가 같아야 한다. */
  tiles: string[];
  /**
   * 하늘·안개 색 (예비값).
   * 실제 조명·안개는 `src/three/atmosphere.ts` 의 맵별 프리셋이 결정한다.
   */
  sky: string;
  fog: string;
  /** 지면 기본 색조 */
  buildings: BuildingSpec[];
  props: PropSpec[];
  /** 플레이어 시작 좌표 */
  spawn: { x: number; z: number };
  /** 이 맵에 서 있는 NPC 배치 */
  npcs: NpcPlacement[];
}

export type MapId =
  | 'shanghai'
  | 'paris'
  | 'washington'
  | 'hongkou'
  | 'jiaxing'
  | 'chongqing'
  | 'xian';

/* ────────────────────────── 인물 ────────────────────────── */

/** 실존 인물 */
export interface Figure {
  id: string;
  name: string;
  hanja?: string;
  /** 생몰년 (미상이면 비움) */
  life?: string;
  /** 임시정부에서의 직책 */
  role: string;
  /** 소속 계열 (외교·군사·자금·선전 등) */
  track: QuestTrack;
  /** 아바타 테마 색 */
  accent: string;
  /** 옷 색 (3D 캐릭터 렌더링) */
  outfit: { coat: string; trim: string; hat?: string };
  /** 인물 소개 (수준별) */
  bio: Leveled;
  /** 중학교 교과서에 이름이 나오는 인물인지 */
  inTextbook: boolean;
  /** 동료(동지)로 영입 가능한가 */
  recruitable: boolean;
  /**
   * 동지로 합류했을 때 붙는 보정.
   * 실제 그 인물이 임정에서 맡았던 역할을 수치로 옮긴 것이다.
   */
  bonus?: ResourceDelta;
  /** 인물 정보의 근거 */
  sourceNote: string;
}

/** 맵 위 NPC 배치 */
export interface NpcPlacement {
  figureId: string;
  x: number;
  z: number;
  /** 바라보는 방향(라디안). 비우면 자동 */
  facing?: number;
  /** 머리 위 말풍선(짧은 한 줄). 거상의 NPC 말풍선 연출. */
  bubble?: string;
}

/* ────────────────────────── 퀘스트 ────────────────────────── */

/** 활동 계열 — 사용자가 요청한 「외교활동·군사활동 등」 */
export type QuestTrack =
  /** 외교 — 파리강화회의, 구미위원부, 카이로 선언 */
  | 'diplomacy'
  /** 군사 — 한인애국단 의열 투쟁, 한국광복군 */
  | 'military'
  /** 자금 — 애국금·인구세·독립공채·연통제 */
  | 'finance'
  /** 선전 — 독립신문, 대일 선전 성명서, 건국강령 */
  | 'propaganda'
  /** 통합 — 국민대표회의, 좌우 합작, 임시의정원 */
  | 'unity';

/** 선택지 */
export interface QuestChoice {
  id: string;
  label: string;
  /** 사실에 부합하는 선택인지 (여러 개가 true 일 수 있다) */
  historical: boolean;
  /** 선택 후 결과 서술 */
  outcome: Leveled;
  /** 자원 증감 */
  delta: ResourceDelta;
  /** 이 선택을 고르려면 필요한 자원 */
  requires?: ResourceDelta;
}

export type QuestKind =
  /** 한 개만 고르는 판단 */
  | 'choice'
  /** 여러 개를 고르는 판단 */
  | 'multi'
  /** 시간 순서대로 배열 */
  | 'order';

export interface Quest {
  id: string;
  /** 소속 막(act) */
  act: number;
  /** 벌어지는 장소 */
  map: MapId;
  /** 퀘스트를 주는 인물 */
  giver: string;
  track: QuestTrack;
  title: string;
  /** 실제 날짜 라벨 (예: "1919. 4. 11.") */
  dateLabel: string;
  /** 퀘스트 브리핑 (수준별) */
  briefing: Leveled;
  kind: QuestKind;
  /** 학생에게 던지는 질문 */
  question: Leveled;
  choices: QuestChoice[];
  /**
   * 정답 id.
   *  choice: 1개 / multi: 여러 개 / order: 정답 순서대로
   */
  answer: string[];
  /** 정답 확인 뒤 해설 — 반드시 사료에 근거한 사실 서술 */
  debrief: Leveled;
  /** 이 퀘스트가 근거로 삼는 사료 (1개 이상 필수) */
  sources: SourceRef[];
  /** 성공 보상 */
  reward: ResourceDelta;
  /** 획득 칭호/배지 */
  badge: { icon: string; label: string };
  /** 선행 퀘스트 */
  requires?: string[];
  /** 2022 개정 교육과정 연계 */
  curriculum: string;
  /**
   * 사실 확인이 필요한 쟁점 (일자 이설, 판본 차이 등).
   * 교사가 수업에서 그대로 인용하기 전 확인해야 할 사항을 솔직히 적는다.
   */
  caveat?: string;
}

/* ────────────────────────── 연표 ────────────────────────── */

export interface TimelineEntry {
  /** ISO 날짜 또는 연도 문자열 */
  date: string;
  /** 표시용 라벨 */
  label: string;
  title: string;
  detail: string;
  track: QuestTrack;
  /** 연결된 맵 */
  map?: MapId;
  /** 근거 */
  sourceNote: string;
}

/* ────────────────────────── 아이템 ────────────────────────── */

export interface Item {
  id: string;
  name: string;
  /** 하단 아이템바 아이콘용 이모지/문자 */
  icon: string;
  /** 어떤 물건인지 — 실제로 존재했던 물건만 넣는다 */
  description: Leveled;
  sourceNote: string;
}

/* ────────────────────────── 세이브 ────────────────────────── */

export interface SaveState {
  version: number;
  level: Level;
  /** 현재 막 */
  act: number;
  map: MapId;
  resources: Resources;
  /** 완료한 퀘스트 id → 정답 여부 */
  completed: Record<string, boolean>;
  /** 영입한 동지 figureId */
  party: string[];
  /** 획득 아이템 id */
  items: string[];
  /** 획득 배지 라벨 */
  badges: string[];
  /** 마지막 저장 시각 */
  savedAt: number;
}
