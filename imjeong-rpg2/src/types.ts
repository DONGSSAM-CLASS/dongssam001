/**
 * 『임시정부 : 새로운 나라를 향해』 — 1인칭 3D 역사 RPG 도메인 타입 (제2탄)
 *
 * 1탄 『임시정부 1919-1945』가 「광복을 향한 독립운동의 여정」이었다면,
 * 2탄은 「새 정부를 세우고, 나라를 운영하고, 그 정신을 오늘의 대한민국으로 잇는 과정」을
 * 학생이 1인칭으로 걸어 다니며 체험한다. 마지막에는 모은 보훈 포인트로
 * 임시정부에서 활동한 국가유공자께 (게임 속) 기부를 하고 감사 편지를 쓴다.
 *
 * ⚠ 콘텐츠 원칙 (1탄과 같다)
 *  1. 연대·인물·사건·사료는 **실제 역사 사실**에만 근거한다.
 *     판본·일자가 갈리는 항목은 `caveat` 에 그 사실을 함께 적는다.
 *  2. 플레이어(시간을 건너간 오늘의 학생)의 이야기는 학습을 위한 극적 재구성이지만,
 *     NPC 대사가 전달하는 **사실 정보는 사료에 근거**해야 한다.
 *  3. 모든 퀘스트는 최소 1개의 `SourceRef`(APA 출처)를 가진다. 테스트로 강제한다.
 */

export type Level = 'middle' | 'high';

export interface Leveled {
  middle: string;
  high: string;
}

/* ────────────────────────── 사료 ────────────────────────── */

export interface SourceRef {
  id: string;
  kind: string;
  title: string;
  original: string;
  interpretation: Leveled;
  citationApa: string;
  note?: string;
}

/* ────────────────────────── 나라 살림 ────────────────────────── */

/**
 * 「새 나라를 운영하는」 다섯 가지 지표.
 * 1탄의 자금·요원·군사력 대신, 정부를 세우고 꾸리는 데 필요한 것을 쓴다.
 */
export interface Resources {
  /** 국고 — 애국금·인구세·독립공채로 채우는 정부 재정 (단위: 원) */
  funds: number;
  /** 민심 — 동포들이 정부를 믿고 따르는 정도 (0~100) */
  trust: number;
  /** 외교 신망 — 다른 나라가 우리 정부를 대하는 무게 (0~100) */
  prestige: number;
  /** 제도 — 헌법·법령·행정 조직이 갖춰진 정도 (0~100) */
  law: number;
  /** 통합 — 여러 세력이 한 정부로 뭉친 정도 (0~100) */
  unity: number;
}

export type ResourceKey = keyof Resources;
export type ResourceDelta = Partial<Record<ResourceKey, number>>;

/* ────────────────────────── 맵 / 월드 ────────────────────────── */

/**
 * 타일 — 맵 문자열 1글자가 1m × 1m 한 칸이다. (1인칭이라 1탄과 달리 실제 척도를 쓴다)
 *
 *  '.' 흙길   ',' 풀밭   '=' 포장도로   'S' 돌바닥   '^' 계단(돌)
 *  '+' 마룻바닥(실내)   'C' 붉은 깔개(실내)   'M' 대리석 바닥(실내)
 *  'W' 실내 벽(회벽)   'B' 벽돌 담   'K' 창이 난 벽   'D' 문틀(통행 가능, 실내)
 *  '~' 물   'T' 나무 자리   'x' 경계(통행 불가, 보이지 않음)
 */
export type TileChar =
  | '.'
  | ','
  | '='
  | 'S'
  | '^'
  | '+'
  | 'C'
  | 'M'
  | 'W'
  | 'B'
  | 'K'
  | 'D'
  | '~'
  | 'T'
  | 'x';

export type BuildingStyle =
  | 'shikumen'
  | 'western'
  | 'chinese'
  | 'hanok'
  | 'chongqing'
  | 'barracks'
  | 'tent';

/** 바깥 풍경용 건물 (속은 비어 있고 겉모습만 있다) */
export interface BuildingSpec {
  id: string;
  style: BuildingStyle;
  x: number;
  z: number;
  w: number;
  d: number;
  floors: number;
  sign?: string;
  wall?: string;
  roof?: string;
  /** 정면이 향하는 방향(라디안). 0 이면 +z 쪽을 본다. */
  facing?: number;
}

/** 1탄에서 이어받은 바깥 장식물 */
export type PropKind =
  | 'tree'
  | 'pine'
  | 'willow'
  | 'cherry'
  | 'bush'
  | 'reed'
  | 'flowerbed'
  | 'lantern'
  | 'stone-lantern'
  | 'streetlamp'
  | 'flag-taegeuk'
  | 'flag-plain'
  | 'banner'
  | 'signpost'
  | 'crate'
  | 'barrel'
  | 'cart'
  | 'bench'
  | 'desk'
  | 'laundry'
  | 'well'
  | 'rock'
  | 'monument'
  | 'stump';

/** 2탄에서 새로 만든 실내 가구 — 1인칭으로 들여다보는 방을 채운다 */
export type FurnitureKind =
  /** 회의용 긴 탁자 (길이는 w) */
  | 'long-table'
  /** 등받이 의자 */
  | 'chair'
  /** 의장석 — 높은 단과 책상 */
  | 'podium'
  /** 서류 책상 + 의자 + 서류 뭉치 */
  | 'office-desk'
  /** 책장 */
  | 'bookshelf'
  /** 깃대에 세운 태극기 */
  | 'flag-stand'
  /** 벽에 거는 액자 (label 은 설명) */
  | 'frame'
  /** 활판 인쇄기 (독립신문) */
  | 'press'
  /** 철제 금고 (재무부) */
  | 'safe'
  /** 벽걸이 지도 */
  | 'map-board'
  /** 천장등 */
  | 'ceiling-lamp'
  /** 탁상 등잔 */
  | 'oil-lamp'
  /** 칠판 */
  | 'blackboard'
  /** 긴 걸상 */
  | 'bench-long'
  /** 화분 */
  | 'plant'
  /** 공훈 명패 — 에필로그 「보훈의 전당」에서 쓴다 (figureId 필요) */
  | 'honor-plaque'
  /** 전시 유리장 */
  | 'display-case'
  /** 가마솥·부엌살림 */
  | 'stove'
  /** 건물 바깥 현판 (label 이 글씨) */
  | 'signboard';

export interface FurnitureSpec {
  kind: FurnitureKind;
  x: number;
  z: number;
  /** 가로 길이(칸) — long-table·bench-long·map-board·blackboard */
  w?: number;
  /** 회전(라디안) */
  rot?: number;
  /** 벽에 붙는 것(frame·map-board·blackboard)의 높이 */
  y?: number;
  /** honor-plaque 가 가리키는 인물 */
  figureId?: string;
  /** 액자·전시장 설명 */
  label?: string;
  color?: string;
}

export interface PropSpec {
  kind: PropKind;
  x: number;
  z: number;
  color?: string;
  scale?: number;
}

export type MapId = 'memorial' | 'assembly' | 'hafei' | 'madang' | 'chongqing' | 'seoul';

/** 맵 안의 기록 조각(수집물) 위치 */
export interface RelicPlacement {
  relicId: string;
  x: number;
  z: number;
}

/** 맵(장소) 정의 */
export interface WorldMap {
  id: MapId;
  name: string;
  nameOriginal?: string;
  period: string;
  summary: Leveled;
  historicalNote: string;
  tiles: string[];
  /** 실내 천장 높이(m). 실내 바닥 타일 위에 천장을 덮는다. 0 이면 천장 없음. */
  ceiling: number;
  buildings: BuildingSpec[];
  props: PropSpec[];
  furniture: FurnitureSpec[];
  /** 시작 위치와 바라보는 방향(라디안, 0 = -z 쪽) */
  spawn: { x: number; z: number; yaw: number };
  npcs: NpcPlacement[];
  relics: RelicPlacement[];
  /** 방 이름표 — 들어서면 화면 위쪽에 잠깐 뜬다 */
  rooms: RoomLabel[];
  /** 시간의 문 — 밟으면 다른 장소(시대)로 건너간다. 열리는 조건은 게임 규칙이 정한다. */
  portals: PortalSpec[];
}

export interface PortalSpec {
  x: number;
  z: number;
  /** 문이 향하는 방향(라디안) */
  rot?: number;
}

export interface RoomLabel {
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
}

/* ────────────────────── 인물의 차림새 (1탄과 동일) ────────────────────── */

export type GarmentKind = 'durumagi' | 'hanbok-woman' | 'suit' | 'uniform' | 'changshan' | 'student';
export type HairKind = 'cropped' | 'parted' | 'sleek' | 'topknot' | 'bun' | 'bob' | 'balding';
export type FacialHair = 'none' | 'mustache' | 'beard' | 'long-beard';
export type HeadwearKind = 'none' | 'gat' | 'fedora' | 'military-cap' | 'tanggeon';
export type HandProp = 'none' | 'cane' | 'briefcase' | 'book' | 'scroll';

export interface Appearance {
  garment: GarmentKind;
  coat: string;
  trim: string;
  lower: string;
  hair: HairKind;
  facialHair: FacialHair;
  glasses: boolean;
  headwear: HeadwearKind;
  age: 'young' | 'middle' | 'old';
  holding?: HandProp;
  note: string;
}

/* ────────────────────────── 인물 ────────────────────────── */

export interface Figure {
  id: string;
  name: string;
  hanja?: string;
  life?: string;
  role: string;
  track: QuestTrack;
  accent: string;
  appearance: Appearance;
  bio: Leveled;
  inTextbook: boolean;
  /** 1탄의 동지 영입 기능에서 쓰던 값. 2탄에서는 쓰지 않는다. */
  recruitable: boolean;
  bonus?: Partial<Record<string, number>>;
  sourceNote: string;
}

export interface NpcPlacement {
  figureId: string;
  x: number;
  z: number;
  /** 바라보는 방향(라디안). 0 이면 +z 쪽을 본다 */
  facing?: number;
  bubble?: string;
}

/* ────────────────────────── 퀘스트 ────────────────────────── */

/**
 * 활동 계열.
 * 1탄의 다섯 계열(외교·군사·자금·선전·통합)에 2탄의 중심인 「헌법·제도」를 더했다.
 */
export type QuestTrack = 'law' | 'diplomacy' | 'military' | 'finance' | 'propaganda' | 'unity';

export interface QuestChoice {
  id: string;
  label: string;
  historical: boolean;
  outcome: Leveled;
  delta: ResourceDelta;
}

export type QuestKind = 'choice' | 'multi' | 'order';

/**
 * 「새 나라 설계도」의 칸.
 * 퀘스트를 풀 때마다 새 나라의 기둥이 하나씩 세워진다.
 */
export type BlueprintKey =
  | 'name'
  | 'republic'
  | 'rights'
  | 'assembly'
  | 'sovereignty'
  | 'separation'
  | 'network'
  | 'press'
  | 'finance'
  | 'diplomacy'
  | 'crisis'
  | 'impeachment'
  | 'collective'
  | 'party'
  | 'army'
  | 'samgyun'
  | 'women'
  | 'coalition'
  | 'constitution-history'
  | 'return'
  | 'founding-1948'
  | 'legitimacy';

export interface Quest {
  id: string;
  act: number;
  map: MapId;
  giver: string;
  track: QuestTrack;
  title: string;
  dateLabel: string;
  briefing: Leveled;
  kind: QuestKind;
  question: Leveled;
  choices: QuestChoice[];
  answer: string[];
  debrief: Leveled;
  sources: SourceRef[];
  reward: ResourceDelta;
  badge: { icon: string; label: string };
  /** 이 퀘스트가 세우는 「새 나라 설계도」의 기둥 */
  blueprint: BlueprintKey;
  requires?: string[];
  curriculum: string;
  caveat?: string;
}

/* ────────────────────────── 기록 조각 ────────────────────────── */

/** 맵 곳곳에 숨은 기록 조각 — 주우면 포인트와 짧은 사실 카드를 얻는다 */
export interface Relic {
  id: string;
  name: string;
  icon: string;
  map: MapId;
  text: Leveled;
  sourceNote: string;
}

/* ────────────────────────── 연표 ────────────────────────── */

export interface TimelineEntry {
  date: string;
  label: string;
  title: string;
  detail: string;
  track: QuestTrack;
  map?: MapId;
  sourceNote: string;
}

/* ────────────────────────── 보훈 ────────────────────────── */

/** 에필로그에서 기부·편지를 받는 국가유공자 */
export interface Honoree {
  figureId: string;
  /** 임시정부에서 한 일 — 한 줄 */
  headline: string;
  /** 게임에서 만난 장면을 떠올리게 하는 말 */
  memory: Leveled;
  /** 편지를 쓸 때 참고할 실마리 */
  letterHints: string[];
  sourceNote: string;
}

export interface Letter {
  figureId: string;
  body: string;
  writtenAt: number;
}

/* ────────────────────────── 세이브 ────────────────────────── */

export interface SaveState {
  version: number;
  level: Level;
  /** 학생이 스스로 정한 부름말 — 편지 끝에만 쓰고 이 기기 밖으로 나가지 않는다 */
  nickname: string;
  act: number;
  map: MapId;
  resources: Resources;
  completed: Record<string, boolean>;
  /** 한 번이라도 틀린 퀘스트 (첫 시도 정답 여부 판정용) */
  missed: string[];
  relics: string[];
  badges: string[];
  /** 모은 보훈 포인트 (쓰지 않은 것) */
  points: number;
  /** 지금까지 모은 보훈 포인트 총합 */
  pointsEarned: number;
  /** 유공자별 기부한 포인트 */
  donations: Record<string, number>;
  letters: Letter[];
  /** 막 전환 연출을 이미 본 막 */
  seenActs: number[];
  prologueDone: boolean;
  savedAt: number;
}
