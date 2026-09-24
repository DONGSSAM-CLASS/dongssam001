import type { FurnitureSpec, MapId, WorldMap } from '../types';
import { Plan } from './plan';

/**
 * 여섯 장소.
 *
 * ⚠ 지도와 방 배치는 **학습용 재구성**이다. 청사 건물의 실측 도면을 복원한 것이 아니며,
 *   각 맵의 historicalNote 에 실제 장소에 대한 사실을 따로 적었다.
 *
 * 좌표: 1칸 = 1 m. x 는 오른쪽(동), z 는 아래쪽(남). yaw 0 은 북쪽(-z)을 본다.
 * NPC facing 0 은 남쪽(+z)을 본다.
 */

const N = 0; // 북쪽 벽에 붙은 것(액자 등)이 남쪽을 보게
const S = Math.PI;
const W = Math.PI / 2;
const E = -Math.PI / 2;

/** 의자를 탁자 양옆에 늘어놓는다 */
function chairsAround(x: number, z: number, w: number): FurnitureSpec[] {
  const out: FurnitureSpec[] = [];
  for (let i = 0; i < w; i += 2) {
    out.push({ kind: 'chair', x: x + i, z: z - 1, rot: S });
    out.push({ kind: 'chair', x: x + i + 1, z: z + 2 });
  }
  return out;
}

/* ═══════════════════ 보훈의 전당 (오늘 · 가상 공간) ═══════════════════ */

function memorial(): WorldMap {
  const p = new Plan(30, 26);
  p.room(0, 0, 30, 26, 'M');
  p.windowRow(25, 3, 26, 3);
  p.windowCol(0, 21, 23, 2);
  p.windowCol(29, 21, 23, 2);
  // 가운데 붉은 길 — 시간의 문으로 이어진다
  p.fill(14, 3, 2, 21, 'C');

  const plaqueZ = [3, 6, 9, 12, 15, 18];
  const west = ['kimgu', 'ahnchangho', 'leedongnyeong', 'leesiyeong', 'jochoang', 'kimgyusik'];
  const east = ['parkeunsik', 'jeongjeonghwa', 'chariseok', 'bangsunhui', 'jicheongcheon', 'eomhangseop'];
  const furniture: FurnitureSpec[] = [
    ...west.map((id, i) => ({ kind: 'honor-plaque' as const, x: 1, z: plaqueZ[i], rot: W, figureId: id })),
    ...east.map((id, i) => ({ kind: 'honor-plaque' as const, x: 28, z: plaqueZ[i], rot: E, figureId: id })),
    // 북쪽 벽의 연표 액자
    { kind: 'frame', x: 5, z: 1, rot: N, label: '1919 임시헌장' },
    { kind: 'frame', x: 8, z: 1, rot: N, label: '1919 통합 임시정부' },
    { kind: 'frame', x: 11, z: 1, rot: N, label: '1927 국무위원제' },
    { kind: 'frame', x: 18, z: 1, rot: N, label: '1941 건국강령' },
    { kind: 'frame', x: 21, z: 1, rot: N, label: '1944 제5차 개헌' },
    { kind: 'frame', x: 24, z: 1, rot: N, label: '1948 제헌헌법' },
    { kind: 'flag-stand', x: 12, z: 1 },
    { kind: 'display-case', x: 8, z: 10, label: '임시정부 공보' },
    { kind: 'display-case', x: 21, z: 10, label: '독립공채' },
    { kind: 'display-case', x: 8, z: 16, label: '독립신문' },
    { kind: 'display-case', x: 21, z: 16, label: '건국강령' },
    { kind: 'bench-long', x: 9, z: 21, w: 3 },
    { kind: 'bench-long', x: 18, z: 21, w: 3 },
    { kind: 'plant', x: 1, z: 22 },
    { kind: 'plant', x: 28, z: 22 },
    { kind: 'plant', x: 13, z: 1 },
    { kind: 'plant', x: 16, z: 1 },
    ...[5, 11, 17].flatMap((z) => [
      { kind: 'ceiling-lamp' as const, x: 8, z },
      { kind: 'ceiling-lamp' as const, x: 21, z },
    ]),
  ];

  return {
    id: 'memorial',
    name: '보훈의 전당',
    nameOriginal: '오늘 · 가상의 전시관',
    period: '오늘',
    summary: {
      middle: '여행이 시작되고 끝나는 곳이에요. 벽에는 임시정부에서 활동한 분들의 명패가 있어요.',
      high: '게임의 처음과 끝을 잇는 가상의 전시관. 임시정부에서 활동한 국가유공자 열두 분의 명패가 있다.',
    },
    historicalNote:
      '「보훈의 전당」은 게임을 위해 만든 가상 공간입니다. 실제로 임시정부의 역사를 볼 수 있는 곳으로는 서울 서대문구의 국립대한민국임시정부기념관, 천안의 독립기념관, 중국 상하이 마당로와 충칭의 임시정부 청사 유적 등이 있습니다.',
    tiles: p.rows(),
    ceiling: 5.2,
    buildings: [],
    props: [],
    furniture,
    spawn: { x: 15, z: 22, yaw: 0 },
    npcs: [{ figureId: 'docent', x: 13, z: 19, facing: Math.PI / 4, bubble: '어서 와요, 오늘의 기록관!' }],
    relics: [],
    rooms: [{ name: '보훈의 전당', x: 1, z: 1, w: 28, d: 24 }],
    portals: [{ x: 15, z: 3 }],
  };
}

/* ═══════════════════ 상하이 김신부로 · 임시의정원 (1919. 4.) ═══════════════════ */

function assembly(): WorldMap {
  const p = new Plan(36, 30);
  // 바깥 — 골목과 풀밭
  p.fill(0, 0, 36, 30, ',');
  p.fill(0, 16, 36, 7, '=');
  p.fill(4, 15, 26, 1, 'S');
  // 집 — 회의실과 대기실
  p.room(4, 1, 18, 15);
  p.room(21, 1, 9, 15);
  p.door(21, 8).door(25, 15);
  p.windowRow(1, 6, 19, 3).windowRow(1, 23, 28, 3);
  p.windowCol(4, 4, 12, 4);
  p.windowCol(29, 4, 12, 4);
  // 회의실 가운데 깔개
  p.fill(10, 9, 5, 5, 'C');
  // 남쪽 연립주택 줄 자리
  p.fill(0, 23, 36, 7, '.');

  const furniture: FurnitureSpec[] = [
    { kind: 'podium', x: 11, z: 2 },
    { kind: 'flag-stand', x: 6, z: 2 },
    { kind: 'flag-stand', x: 19, z: 2 },
    { kind: 'long-table', x: 7, z: 6, w: 11 },
    ...chairsAround(7, 6, 11),
    { kind: 'bench-long', x: 6, z: 12, w: 3 },
    { kind: 'bench-long', x: 16, z: 12, w: 3 },
    { kind: 'frame', x: 5, z: 5, rot: W },
    { kind: 'frame', x: 5, z: 10, rot: W },
    { kind: 'ceiling-lamp', x: 9, z: 7 },
    { kind: 'ceiling-lamp', x: 15, z: 7 },
    { kind: 'ceiling-lamp', x: 12, z: 12 },
    { kind: 'oil-lamp', x: 12, z: 6, y: 0.8 },
    // 대기실
    { kind: 'office-desk', x: 23, z: 3 },
    { kind: 'chair', x: 24, z: 4, rot: S },
    { kind: 'bookshelf', x: 26, z: 2 },
    { kind: 'bench-long', x: 22, z: 12, w: 3 },
    { kind: 'plant', x: 28, z: 13 },
    { kind: 'ceiling-lamp', x: 25, z: 8 },
    { kind: 'frame', x: 25, z: 2, rot: N },
    { kind: 'signboard', x: 25, z: 16, label: '임시의정원 (재구성)' },
  ];

  return {
    id: 'assembly',
    name: '상하이 김신부로 — 임시의정원',
    nameOriginal: '上海 金神父路',
    period: '1919. 4.',
    summary: {
      middle: '3·1운동 한 달 뒤, 독립운동가들이 모여 밤새 회의를 연 곳이에요. 여기서 나라 이름과 헌법이 정해졌어요.',
      high: '1919년 4월 10~11일, 각지 대표들이 임시의정원을 구성하고 국호·관제·임시헌장을 의결한 첫 회의의 현장이다.',
    },
    historicalNote:
      '임시의정원 첫 회의는 1919년 4월 10일 밤부터 11일에 걸쳐 상하이 프랑스 조계 김신부로(金神父路, 오늘날 루이진2루 일대)의 한 건물에서 열렸다. 건물의 실제 구조는 전하지 않으며, 이 회의실은 학습용 재구성이다.',
    tiles: p.rows(),
    ceiling: 3.4,
    buildings: [
      { id: 'row-a', style: 'shikumen', x: 1, z: 24, w: 10, d: 5, floors: 2, facing: S },
      { id: 'row-b', style: 'shikumen', x: 12, z: 24, w: 10, d: 5, floors: 2, facing: S, wall: '#cfc6b2' },
      { id: 'row-c', style: 'shikumen', x: 23, z: 24, w: 11, d: 5, floors: 2, facing: S },
    ],
    props: [
      { kind: 'cherry', x: 1, z: 3 },
      { kind: 'cherry', x: 2, z: 9 },
      { kind: 'willow', x: 33, z: 4 },
      { kind: 'cherry', x: 32, z: 11 },
      { kind: 'streetlamp', x: 8, z: 17 },
      { kind: 'streetlamp', x: 20, z: 17 },
      { kind: 'streetlamp', x: 32, z: 17 },
      { kind: 'laundry', x: 6, z: 22 },
      { kind: 'cart', x: 27, z: 21 },
      { kind: 'crate', x: 30, z: 21 },
      { kind: 'barrel', x: 31, z: 21 },
      { kind: 'bush', x: 3, z: 14 },
      { kind: 'bush', x: 31, z: 14 },
      { kind: 'flowerbed', x: 33, z: 14 },
    ],
    furniture,
    spawn: { x: 25, z: 19, yaw: 0 },
    npcs: [
      { figureId: 'leedongnyeong', x: 12, z: 4, facing: 0, bubble: '회의를 시작합시다.' },
      { figureId: 'jochoang', x: 6, z: 9, facing: Math.PI / 2 },
      { figureId: 'leesiyeong', x: 19, z: 9, facing: -Math.PI / 2 },
    ],
    relics: [
      { relicId: 'relic-assembly-lamp', x: 19, z: 13 },
      { relicId: 'relic-roster', x: 27, z: 6 },
      { relicId: 'relic-concession', x: 33, z: 19 },
    ],
    rooms: [
      { name: '임시의정원 회의실', x: 5, z: 2, w: 16, d: 13 },
      { name: '대기실', x: 22, z: 2, w: 7, d: 13 },
      { name: '김신부로 골목', x: 0, z: 15, w: 36, d: 9 },
    ],
    portals: [{ x: 2, z: 19, rot: W }],
  };
}

/* ═══════════════════ 상하이 하비로 · 통합 임시정부 청사 (1919. 9.~) ═══════════════════ */

function hafei(): WorldMap {
  const p = new Plan(42, 32);
  p.fill(0, 0, 42, 32, ',');
  p.fill(0, 18, 42, 6, '=');
  p.fill(0, 24, 42, 8, '.');
  // 청사 — 북쪽 방 셋, 복도, 남쪽 방 셋
  p.room(2, 1, 11, 8); // 국무회의실
  p.room(12, 1, 8, 8); // 내무부
  p.room(19, 1, 8, 8); // 재무부
  p.room(2, 8, 25, 4); // 복도
  p.room(2, 11, 11, 7); // 외무부
  p.room(12, 11, 8, 7); // 교통국
  p.room(19, 11, 8, 7); // 현관
  p.door(7, 8).door(15, 8).door(23, 8);
  p.door(7, 11).door(15, 11).door(23, 11);
  p.door(23, 17);
  p.windowRow(1, 4, 10, 3).windowRow(1, 14, 17, 3).windowRow(1, 21, 25, 4);
  p.windowRow(17, 4, 10, 3).windowRow(17, 14, 17, 3);
  p.windowCol(2, 3, 6, 3).windowCol(2, 13, 15, 2);
  p.windowCol(26, 3, 6, 3).windowCol(26, 13, 15, 2);
  // 독립신문사
  p.room(29, 3, 11, 11);
  p.door(34, 13);
  p.windowRow(3, 31, 37, 3);
  p.windowCol(39, 5, 11, 3);
  p.fill(27, 14, 15, 4, 'S');

  const furniture: FurnitureSpec[] = [
    // 국무회의실
    { kind: 'long-table', x: 4, z: 3, w: 7 },
    ...chairsAround(4, 3, 7),
    { kind: 'flag-stand', x: 3, z: 2 },
    { kind: 'frame', x: 7, z: 2, rot: N },
    { kind: 'ceiling-lamp', x: 7, z: 4 },
    // 내무부 — 연통제 지도
    { kind: 'map-board', x: 15, z: 2, w: 2.6, rot: N },
    { kind: 'office-desk', x: 13, z: 5 },
    { kind: 'chair', x: 14, z: 6, rot: S },
    { kind: 'bookshelf', x: 17, z: 2 },
    { kind: 'ceiling-lamp', x: 15, z: 5 },
    // 재무부 — 금고와 장부
    { kind: 'safe', x: 25, z: 2 },
    { kind: 'office-desk', x: 21, z: 3 },
    { kind: 'chair', x: 22, z: 4, rot: S },
    { kind: 'bookshelf', x: 20, z: 7, rot: S },
    { kind: 'ceiling-lamp', x: 23, z: 5 },
    // 복도
    { kind: 'plant', x: 3, z: 9 },
    { kind: 'plant', x: 25, z: 10 },
    { kind: 'ceiling-lamp', x: 11, z: 9 },
    { kind: 'ceiling-lamp', x: 19, z: 10 },
    // 외무부 — 세계 지도와 서류
    { kind: 'map-board', x: 3, z: 14, w: 2.4, rot: W },
    { kind: 'office-desk', x: 6, z: 13 },
    { kind: 'chair', x: 7, z: 14, rot: S },
    { kind: 'bookshelf', x: 9, z: 16, rot: S },
    { kind: 'flag-stand', x: 11, z: 12 },
    { kind: 'ceiling-lamp', x: 7, z: 14 },
    // 교통국 — 연락 서류와 칠판
    { kind: 'blackboard', x: 15, z: 16, w: 2.4, rot: S },
    { kind: 'office-desk', x: 13, z: 12 },
    { kind: 'chair', x: 14, z: 13, rot: S },
    { kind: 'ceiling-lamp', x: 15, z: 14 },
    // 현관
    { kind: 'bench-long', x: 20, z: 12, w: 3 },
    { kind: 'plant', x: 25, z: 16 },
    { kind: 'frame', x: 25, z: 13, rot: E },
    // 독립신문사 — 인쇄기와 원고 책상
    { kind: 'press', x: 30, z: 5 },
    { kind: 'press', x: 30, z: 9 },
    { kind: 'office-desk', x: 35, z: 5 },
    { kind: 'chair', x: 36, z: 6, rot: S },
    { kind: 'office-desk', x: 35, z: 9 },
    { kind: 'chair', x: 36, z: 10, rot: S },
    { kind: 'bookshelf', x: 37, z: 4 },
    { kind: 'ceiling-lamp', x: 34, z: 7 },
    { kind: 'ceiling-lamp', x: 34, z: 11 },
    { kind: 'signboard', x: 23, z: 18, label: '대한민국 임시정부' },
    { kind: 'signboard', x: 34, z: 14, label: '독립신문사' },
  ];

  return {
    id: 'hafei',
    name: '상하이 하비로 — 통합 임시정부 청사',
    nameOriginal: '上海 霞飛路',
    period: '1919. 9. ~ 1921',
    summary: {
      middle: '세 정부가 하나로 합쳐진 뒤, 부서마다 방을 나눠 나라 살림을 꾸리던 청사예요. 건너편에는 독립신문사가 있어요.',
      high: '1919년 9월 통합 임시정부가 출범한 뒤 국무원 각 부가 업무를 나누어 연통제·재정·외교를 운영하던 시기의 청사를 재구성했다.',
    },
    historicalNote:
      '통합 임시정부 초기 청사는 상하이 프랑스 조계 하비로(霞飛路, 오늘날 화이하이중루) 일대에 있었고, 일제의 압력으로 여러 차례 자리를 옮겼다. 『독립신문』은 1919년 8월 21일 창간되었으며 청사와 별도의 장소에서 발행되었다. 방 배치는 학습용 재구성이다.',
    tiles: p.rows(),
    ceiling: 3.4,
    buildings: [
      { id: 'hf-a', style: 'shikumen', x: 1, z: 25, w: 11, d: 6, floors: 2, facing: S },
      { id: 'hf-b', style: 'western', x: 14, z: 25, w: 12, d: 6, floors: 3, facing: S, wall: '#d8cdb8' },
      { id: 'hf-c', style: 'shikumen', x: 28, z: 25, w: 12, d: 6, floors: 2, facing: S, wall: '#cbbfa9' },
    ],
    props: [
      { kind: 'tree', x: 1, z: 20 },
      { kind: 'tree', x: 13, z: 23 },
      { kind: 'tree', x: 27, z: 23 },
      { kind: 'tree', x: 40, z: 20 },
      { kind: 'streetlamp', x: 6, z: 18 },
      { kind: 'streetlamp', x: 18, z: 18 },
      { kind: 'streetlamp', x: 30, z: 18 },
      { kind: 'cart', x: 36, z: 22 },
      { kind: 'crate', x: 9, z: 22 },
      { kind: 'signpost', x: 28, z: 16 },
      { kind: 'bush', x: 28, z: 1 },
      { kind: 'bush', x: 40, z: 1 },
      { kind: 'pine', x: 0, z: 2 },
    ],
    furniture,
    spawn: { x: 23, z: 20, yaw: 0 },
    npcs: [
      { figureId: 'ahnchangho', x: 8, z: 6, facing: 0, bubble: '세 정부를 하나로!' },
      { figureId: 'leedonghwi', x: 5, z: 6, facing: Math.PI / 5 },
      { figureId: 'leesiyeong', x: 23, z: 6, facing: 0 },
      { figureId: 'kimgyusik', x: 5, z: 15, facing: 0 },
      { figureId: 'leegwangsu', x: 36, z: 12, facing: 0 },
    ],
    relics: [
      { relicId: 'relic-yeontong', x: 17, z: 6 },
      { relicId: 'relic-bond', x: 25, z: 7 },
      { relicId: 'relic-newspaper', x: 33, z: 8 },
      { relicId: 'relic-gazette', x: 11, z: 16 },
    ],
    rooms: [
      { name: '국무회의실', x: 3, z: 2, w: 9, d: 6 },
      { name: '내무부 · 연통제', x: 13, z: 2, w: 6, d: 6 },
      { name: '재무부', x: 20, z: 2, w: 6, d: 6 },
      { name: '복도', x: 3, z: 9, w: 23, d: 2 },
      { name: '외무부', x: 3, z: 12, w: 9, d: 5 },
      { name: '교통국', x: 13, z: 12, w: 6, d: 5 },
      { name: '현관', x: 20, z: 12, w: 6, d: 5 },
      { name: '독립신문사', x: 30, z: 4, w: 9, d: 9 },
      { name: '하비로 거리', x: 0, z: 18, w: 42, d: 6 },
    ],
    portals: [{ x: 40, z: 21, rot: E }],
  };
}

/* ═══════════════════ 상하이 마당로 청사 (1926~1932) ═══════════════════ */

function madang(): WorldMap {
  const p = new Plan(36, 28);
  p.fill(0, 0, 36, 28, '.');
  p.fill(0, 16, 36, 6, '=');
  // 청사 — 좁은 3층 연립주택의 1층을 재구성
  p.room(10, 3, 10, 13); // 회의실
  p.room(19, 3, 7, 13); // 살림방·부엌
  p.door(19, 9).door(14, 15).door(22, 15);
  p.windowRow(3, 12, 17, 3).windowRow(3, 21, 24, 3);
  p.windowCol(10, 6, 12, 3);
  p.windowCol(25, 6, 12, 3);
  p.fill(10, 16, 16, 1, 'S');

  const furniture: FurnitureSpec[] = [
    { kind: 'long-table', x: 12, z: 6, w: 6 },
    ...chairsAround(12, 6, 6),
    { kind: 'flag-stand', x: 11, z: 4 },
    { kind: 'bookshelf', x: 16, z: 4 },
    { kind: 'frame', x: 14, z: 4, rot: N },
    { kind: 'blackboard', x: 11, z: 11, w: 2.2, rot: W },
    { kind: 'ceiling-lamp', x: 14, z: 7 },
    { kind: 'ceiling-lamp', x: 14, z: 12 },
    { kind: 'oil-lamp', x: 15, z: 6, y: 0.8 },
    // 살림방·부엌
    { kind: 'stove', x: 24, z: 4 },
    { kind: 'long-table', x: 20, z: 11, w: 4 },
    { kind: 'chair', x: 20, z: 10, rot: S },
    { kind: 'chair', x: 22, z: 10, rot: S },
    { kind: 'chair', x: 21, z: 13 },
    { kind: 'safe', x: 20, z: 4 },
    { kind: 'plant', x: 24, z: 14 },
    { kind: 'ceiling-lamp', x: 22, z: 8 },
    { kind: 'signboard', x: 14, z: 16, label: '대한민국 임시정부' },
  ];

  return {
    id: 'madang',
    name: '상하이 마당로 — 임시정부 청사',
    nameOriginal: '上海 馬當路 普慶里',
    period: '1920년대 ~ 1932',
    summary: {
      middle: '돈도 사람도 모자라던 어려운 시절, 임시정부가 버티던 작은 청사예요. 오늘날 상하이에 남아 있는 바로 그 청사예요.',
      high: '국민대표회의 결렬(1923) 이후 침체기를 헌법 개정과 정당 결성으로 버텨 낸 시기. 마당로 청사는 1926년부터 1932년 윤봉길 의거 직후까지 사용되었다.',
    },
    historicalNote:
      '마당로 보경리(普慶里) 4호 청사는 1926년부터 1932년까지 사용되었고 오늘날 「대한민국 임시정부 구지(舊址)」로 복원·공개되어 있다. 좁은 3층 연립주택으로, 1층에 회의실과 부엌이 있었다고 전한다. 이 맵은 1층만 학습용으로 재구성했다. 국민대표회의(1923)와 이승만 탄핵(1925)은 이 청사를 쓰기 전의 일이라 골목 장면으로 두었다.',
    tiles: p.rows(),
    ceiling: 3.0,
    buildings: [
      { id: 'md-a', style: 'shikumen', x: 0, z: 3, w: 9, d: 12, floors: 3 },
      { id: 'md-b', style: 'shikumen', x: 27, z: 3, w: 9, d: 12, floors: 3, wall: '#cfc5b1' },
      { id: 'md-c', style: 'shikumen', x: 1, z: 22, w: 10, d: 5, floors: 3, facing: S },
      { id: 'md-d', style: 'shikumen', x: 13, z: 22, w: 10, d: 5, floors: 3, facing: S, wall: '#c9bea9' },
      { id: 'md-e', style: 'shikumen', x: 25, z: 22, w: 10, d: 5, floors: 3, facing: S },
    ],
    props: [
      { kind: 'laundry', x: 5, z: 20 },
      { kind: 'laundry', x: 29, z: 20 },
      { kind: 'streetlamp', x: 9, z: 17 },
      { kind: 'streetlamp', x: 27, z: 17 },
      { kind: 'barrel', x: 33, z: 17 },
      { kind: 'crate', x: 34, z: 18 },
      { kind: 'well', x: 1, z: 18 },
      { kind: 'bench', x: 20, z: 20 },
      { kind: 'bush', x: 10, z: 1 },
      { kind: 'bush', x: 24, z: 1 },
    ],
    furniture,
    spawn: { x: 17, z: 19, yaw: 0 },
    npcs: [
      { figureId: 'ahnchangho', x: 5, z: 18, facing: Math.PI / 2, bubble: '1923년, 국민대표회의가 열렸지요.' },
      { figureId: 'parkeunsik', x: 13, z: 5, facing: Math.PI / 6 },
      { figureId: 'leedongnyeong', x: 17, z: 9, facing: -Math.PI / 2 },
      { figureId: 'jochoang', x: 12, z: 13, facing: Math.PI / 2 },
      { figureId: 'jeongjeonghwa', x: 22, z: 6, facing: 0, bubble: '밥은 먹고 일하셔야지요.' },
    ],
    relics: [
      { relicId: 'relic-jangang', x: 24, z: 12 },
      { relicId: 'relic-constitution-1927', x: 18, z: 13 },
      { relicId: 'relic-lane', x: 32, z: 19 },
    ],
    rooms: [
      { name: '청사 1층 회의실', x: 11, z: 4, w: 8, d: 11 },
      { name: '살림방 · 부엌', x: 20, z: 4, w: 5, d: 11 },
      { name: '마당로 골목', x: 0, z: 16, w: 36, d: 6 },
    ],
    portals: [{ x: 34, z: 20, rot: E }],
  };
}

/* ═══════════════════ 충칭 (1940~1945) ═══════════════════ */

function chongqing(): WorldMap {
  const p = new Plan(42, 34);
  p.fill(0, 0, 42, 34, ',');
  p.fill(0, 16, 42, 18, 'S');
  for (const z of [20, 24, 28]) p.fill(2, z, 26, 1, '^');
  // 청사 — 네 방
  p.room(3, 1, 13, 9); // 국무위원회 회의실
  p.room(15, 1, 12, 9); // 주석 판공실
  p.room(3, 9, 13, 7); // 비서처
  p.room(15, 9, 12, 7); // 부주석실
  p.door(15, 5).door(15, 12).door(9, 9).door(21, 9);
  p.door(9, 15).door(21, 15);
  p.windowRow(1, 5, 13, 4).windowRow(1, 18, 24, 3);
  p.windowCol(3, 3, 7, 4).windowCol(26, 3, 7, 4);
  p.windowCol(3, 11, 13, 2).windowCol(26, 11, 13, 2);
  // 광복군 성립 기념 마당
  p.fill(30, 14, 11, 12, '.');

  const furniture: FurnitureSpec[] = [
    // 국무위원회 회의실
    { kind: 'long-table', x: 5, z: 4, w: 8 },
    ...chairsAround(5, 4, 8),
    { kind: 'flag-stand', x: 4, z: 2 },
    { kind: 'frame', x: 9, z: 2, rot: N },
    { kind: 'ceiling-lamp', x: 9, z: 5 },
    // 주석 판공실
    { kind: 'office-desk', x: 20, z: 3 },
    { kind: 'chair', x: 21, z: 2 },
    { kind: 'flag-stand', x: 25, z: 2 },
    { kind: 'bookshelf', x: 16, z: 2 },
    { kind: 'map-board', x: 25, z: 6, w: 2.2, rot: E },
    { kind: 'ceiling-lamp', x: 21, z: 5 },
    // 비서처
    { kind: 'office-desk', x: 5, z: 11 },
    { kind: 'office-desk', x: 10, z: 11 },
    { kind: 'chair', x: 6, z: 12, rot: S },
    { kind: 'chair', x: 11, z: 12, rot: S },
    { kind: 'bookshelf', x: 12, z: 14, rot: S },
    { kind: 'ceiling-lamp', x: 9, z: 12 },
    // 부주석실
    { kind: 'office-desk', x: 17, z: 11 },
    { kind: 'chair', x: 18, z: 12, rot: S },
    { kind: 'bookshelf', x: 23, z: 10 },
    { kind: 'plant', x: 25, z: 14 },
    { kind: 'ceiling-lamp', x: 21, z: 12 },
    { kind: 'signboard', x: 15, z: 16, y: 2.6, label: '대한민국 임시정부' },
  ];

  return {
    id: 'chongqing',
    name: '충칭 — 임시정부와 한국광복군',
    nameOriginal: '重慶',
    period: '1940 ~ 1945',
    summary: {
      middle: '8년의 이동 끝에 자리 잡은 충칭. 여기서 임시정부는 군대를 만들고, 독립 뒤 세울 나라의 설계도를 그렸어요.',
      high: '1940년 충칭 정착 뒤 주석제 개헌, 한국광복군 창설, 건국강령 발표, 좌우 연합 정부 구성(1944)이 이어진 전시 체제기의 임시정부.',
    },
    historicalNote:
      '임시정부는 1940년 9월 충칭에 정착한 뒤 몇 차례 청사를 옮겼고, 1945년 1월부터는 연화지(蓮花池) 청사를 썼다(오늘날 복원·공개). 한국광복군 총사령부 성립 전례식은 1940년 9월 17일 충칭 가릉빈관(嘉陵賓館)에서 열렸다. 이 맵은 여러 시기를 한데 모은 학습용 재구성이다.',
    tiles: p.rows(),
    ceiling: 3.3,
    buildings: [
      { id: 'cq-a', style: 'chongqing', x: 29, z: 1, w: 12, d: 10, floors: 2 },
      { id: 'cq-b', style: 'chinese', x: 1, z: 29, w: 12, d: 5, floors: 1, facing: S },
      { id: 'cq-c', style: 'chongqing', x: 15, z: 29, w: 12, d: 5, floors: 2, facing: S },
      { id: 'cq-barracks', style: 'barracks', x: 33, z: 27, w: 8, d: 6, floors: 1, facing: S, sign: '광복군' },
    ],
    props: [
      { kind: 'pine', x: 0, z: 18 },
      { kind: 'pine', x: 0, z: 25 },
      { kind: 'pine', x: 28, z: 18 },
      { kind: 'pine', x: 28, z: 26 },
      { kind: 'flag-taegeuk', x: 34, z: 16 },
      { kind: 'flag-taegeuk', x: 38, z: 16 },
      { kind: 'banner', x: 31, z: 15, color: '#8d3231' },
      { kind: 'banner', x: 40, z: 15, color: '#8d3231' },
      { kind: 'stone-lantern', x: 13, z: 17 },
      { kind: 'stone-lantern', x: 17, z: 17 },
      { kind: 'crate', x: 31, z: 24 },
      { kind: 'crate', x: 32, z: 24 },
      { kind: 'bush', x: 1, z: 1 },
      { kind: 'rock', x: 40, z: 12 },
    ],
    furniture,
    spawn: { x: 15, z: 22, yaw: 0 },
    npcs: [
      { figureId: 'kimgu', x: 21, z: 5, facing: 0 },
      { figureId: 'jochoang', x: 6, z: 7, facing: Math.PI / 4 },
      { figureId: 'bangsunhui', x: 12, z: 7, facing: -Math.PI / 4 },
      { figureId: 'chariseok', x: 8, z: 13, facing: 0 },
      { figureId: 'kimgyusik', x: 20, z: 13, facing: 0 },
      { figureId: 'jicheongcheon', x: 36, z: 19, facing: 0, bubble: '우리 손으로 만든 군대요.' },
    ],
    relics: [
      { relicId: 'relic-gangnyeong', x: 13, z: 3 },
      { relicId: 'relic-gwangbok', x: 39, z: 22 },
      { relicId: 'relic-uijeongwon-women', x: 4, z: 14 },
      { relicId: 'relic-charter-1944', x: 25, z: 11 },
    ],
    rooms: [
      { name: '국무위원회 회의실', x: 4, z: 2, w: 11, d: 7 },
      { name: '주석 판공실', x: 16, z: 2, w: 10, d: 7 },
      { name: '비서처', x: 4, z: 10, w: 11, d: 5 },
      { name: '부주석실', x: 16, z: 10, w: 10, d: 5 },
      { name: '광복군 성립 기념 마당', x: 30, z: 14, w: 11, d: 12 },
    ],
    portals: [{ x: 3, z: 26, rot: W }],
  };
}

/* ═══════════════════ 서울 경교장 (1945~1948) ═══════════════════ */

function seoul(): WorldMap {
  const p = new Plan(38, 32);
  p.fill(0, 0, 38, 32, ',');
  p.fill(31, 0, 7, 32, '=');
  // 경교장 1층 — 응접실과 집무실
  p.room(7, 2, 13, 13); // 응접실
  p.room(19, 2, 9, 13); // 집무실
  p.door(19, 8).door(13, 14);
  p.windowRow(2, 9, 17, 4).windowRow(2, 21, 25, 4);
  p.windowRow(14, 9, 11, 2).windowRow(14, 16, 18, 2).windowRow(14, 21, 25, 2);
  p.windowCol(7, 5, 11, 3).windowCol(27, 5, 11, 3);
  // 정원 길
  p.fill(13, 15, 2, 12, 'S');
  p.fill(13, 26, 19, 2, 'S');
  p.fill(0, 30, 31, 2, 'B');
  p.fill(0, 0, 1, 30, 'B');
  p.fill(1, 0, 30, 1, 'B');
  p.set(30, 26, 'S').set(30, 27, 'S');
  p.fill(30, 0, 1, 26, 'B');
  p.fill(30, 28, 1, 2, 'B');

  const furniture: FurnitureSpec[] = [
    // 응접실 — 요인들이 모이던 방
    { kind: 'long-table', x: 10, z: 7, w: 6 },
    ...chairsAround(10, 7, 6),
    { kind: 'flag-stand', x: 8, z: 3 },
    { kind: 'frame', x: 13, z: 3, rot: N },
    { kind: 'bookshelf', x: 16, z: 3 },
    { kind: 'plant', x: 8, z: 13 },
    { kind: 'ceiling-lamp', x: 13, z: 8 },
    // 집무실
    { kind: 'office-desk', x: 22, z: 4 },
    { kind: 'chair', x: 23, z: 3 },
    { kind: 'bookshelf', x: 25, z: 12, rot: S },
    { kind: 'flag-stand', x: 26, z: 3 },
    { kind: 'ceiling-lamp', x: 23, z: 8 },
    { kind: 'signboard', x: 16, z: 15, label: '경교장' },
  ];

  return {
    id: 'seoul',
    name: '서울 — 경교장',
    nameOriginal: '京橋莊',
    period: '1945. 11. ~ 1948',
    summary: {
      middle: '27년 만에 돌아온 임시정부 요인들이 머물던 집이에요. 여기서 새 나라를 어떻게 세울지 고민했어요.',
      high: '1945년 11월 23일 환국한 김구와 임정 요인들이 머물며 활동한 곳. 광복 이후 정부 수립 과정에서 임정 요인들이 내린 서로 다른 선택을 돌아본다.',
    },
    historicalNote:
      '경교장(서울 종로구 새문안로)은 환국한 김구가 1945년부터 1949년 서거할 때까지 머문 곳으로, 임시정부 요인들의 활동 공간이었다. 오늘날 복원되어 공개되고 있다(사적). 실제 건물은 2층 양옥이며, 이 맵은 1층 일부를 학습용으로 재구성했다.',
    tiles: p.rows(),
    ceiling: 3.3,
    buildings: [
      { id: 'se-a', style: 'hanok', x: 32, z: 2, w: 6, d: 8, floors: 1, facing: E },
      { id: 'se-b', style: 'western', x: 32, z: 12, w: 6, d: 9, floors: 2, facing: E, wall: '#d7cdb9' },
    ],
    props: [
      { kind: 'pine', x: 3, z: 17 },
      { kind: 'pine', x: 5, z: 24 },
      { kind: 'pine', x: 25, z: 18 },
      { kind: 'pine', x: 27, z: 23 },
      { kind: 'tree', x: 3, z: 4 },
      { kind: 'tree', x: 28, z: 4 },
      { kind: 'bush', x: 10, z: 17 },
      { kind: 'bush', x: 17, z: 17 },
      { kind: 'flowerbed', x: 9, z: 20 },
      { kind: 'flowerbed', x: 18, z: 20 },
      { kind: 'flag-taegeuk', x: 16, z: 22 },
      { kind: 'bench', x: 20, z: 24 },
      { kind: 'streetlamp', x: 34, z: 23 },
      { kind: 'streetlamp', x: 34, z: 29 },
    ],
    furniture,
    spawn: { x: 34, z: 27, yaw: Math.PI / 2 },
    npcs: [
      { figureId: 'eomhangseop', x: 15, z: 24, facing: Math.PI / 2, bubble: '드디어 돌아왔습니다.' },
      { figureId: 'kimgu', x: 22, z: 7, facing: 0 },
      { figureId: 'leesiyeong', x: 11, z: 11, facing: Math.PI / 3 },
    ],
    relics: [
      { relicId: 'relic-return-list', x: 26, z: 13 },
      { relicId: 'relic-gazette-1948', x: 31, z: 22 },
      { relicId: 'relic-gyeonggyojang', x: 8, z: 22 },
    ],
    rooms: [
      { name: '경교장 응접실', x: 8, z: 3, w: 11, d: 11 },
      { name: '경교장 집무실', x: 20, z: 3, w: 7, d: 11 },
      { name: '경교장 정원', x: 1, z: 15, w: 29, d: 15 },
    ],
    portals: [{ x: 3, z: 27, rot: W }],
  };
}

export const maps: Record<MapId, WorldMap> = {
  memorial: memorial(),
  assembly: assembly(),
  hafei: hafei(),
  madang: madang(),
  chongqing: chongqing(),
  seoul: seoul(),
};

export function getMap(id: MapId): WorldMap {
  return maps[id];
}

/** 이야기 순서대로 늘어놓은 장소 (시간의 문이 이 순서로 열린다) */
export const MAP_ORDER: MapId[] = ['memorial', 'assembly', 'hafei', 'madang', 'chongqing', 'seoul'];
