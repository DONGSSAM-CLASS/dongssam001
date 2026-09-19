#!/usr/bin/env python3
"""src/data/maps.ts 생성기 (1회성 저작 도구).

지형 문자열은 손으로 그리면 행 길이가 어긋나기 쉬우므로 코드로 찍어 낸다.
생성된 maps.ts 는 사람이 읽고 고칠 수 있는 평범한 TS 파일이므로,
이후 콘텐츠 수정은 maps.ts 를 직접 고쳐도 된다.

사용법:  python3 scripts/gen-maps.py
"""
from pathlib import Path

# ───────────────────────── 지형 유틸 ─────────────────────────
def blank(w, h, ch=','):
    return [[ch] * w for _ in range(h)]

def border(g, ch='x'):
    h, w = len(g), len(g[0])
    for x in range(w):
        g[0][x] = ch; g[h - 1][x] = ch
    for z in range(h):
        g[z][0] = ch; g[z][w - 1] = ch

def hline(g, z, x0, x1, ch):
    for x in range(x0, x1 + 1): g[z][x] = ch

def vline(g, x, z0, z1, ch):
    for z in range(z0, z1 + 1): g[z][x] = ch

def rect(g, x0, z0, w, d, ch):
    for z in range(z0, z0 + d):
        for x in range(x0, x0 + w):
            g[z][x] = ch

def rows(g):
    return [''.join(r) for r in g]

def ts_tiles(rs):
    return ',\n'.join("      '%s'" % r for r in rs)

# ───────────────────────── 지형 ─────────────────────────
T = {}

g = blank(36, 26, ','); border(g)
hline(g, 12, 1, 34, '='); hline(g, 13, 1, 34, '=')
vline(g, 9, 1, 24, '='); vline(g, 10, 1, 24, '=')
vline(g, 25, 1, 24, '='); vline(g, 26, 1, 24, '=')
rect(g, 11, 3, 14, 8, '.'); rect(g, 11, 15, 14, 8, '.')
rect(g, 2, 3, 7, 8, '.'); rect(g, 27, 15, 7, 8, '.')
hline(g, 1, 1, 34, '~'); hline(g, 2, 1, 34, '~'); hline(g, 3, 1, 34, 'S')
T['shanghai'] = rows(g)

g = blank(30, 22, 'S'); border(g)
hline(g, 10, 1, 28, '='); hline(g, 11, 1, 28, '=')
vline(g, 14, 1, 20, '='); vline(g, 15, 1, 20, '=')
hline(g, 19, 1, 28, '~'); hline(g, 20, 1, 28, '~'); hline(g, 18, 1, 28, 'S')
rect(g, 4, 3, 8, 5, ','); rect(g, 19, 3, 8, 5, ',')
T['paris'] = rows(g)

g = blank(30, 22, ','); border(g)
hline(g, 11, 1, 28, '='); hline(g, 12, 1, 28, '=')
vline(g, 13, 1, 20, '='); vline(g, 16, 1, 20, '=')
rect(g, 2, 2, 10, 8, 'S'); rect(g, 18, 2, 10, 8, 'S')
rect(g, 2, 14, 10, 6, '.'); rect(g, 18, 14, 10, 6, '.')
T['washington'] = rows(g)

g = blank(28, 22, ','); border(g)
hline(g, 13, 1, 26, '.'); vline(g, 13, 1, 20, '.')
rect(g, 8, 4, 11, 7, 'S'); rect(g, 2, 15, 6, 4, '~')
T['hongkou'] = rows(g)

g = blank(30, 22, ','); border(g)
rect(g, 1, 14, 28, 7, '~'); hline(g, 13, 1, 28, 'S')
hline(g, 8, 1, 28, '.'); vline(g, 15, 1, 12, '.')
rect(g, 10, 16, 8, 2, 'S')
T['jiaxing'] = rows(g)

g = blank(36, 28, ','); border(g)
hline(g, 9, 1, 34, '^'); hline(g, 10, 1, 34, '^')
hline(g, 18, 1, 34, '^'); hline(g, 19, 1, 34, '^')
rect(g, 1, 20, 34, 6, '.'); rect(g, 1, 11, 34, 7, '.')
hline(g, 4, 1, 34, '='); hline(g, 5, 1, 34, '='); rect(g, 1, 1, 34, 3, 'S')
vline(g, 17, 5, 26, 'S'); vline(g, 18, 5, 26, 'S')
T['chongqing'] = rows(g)

g = blank(32, 24, '.'); border(g)
rect(g, 8, 6, 16, 10, 'S')
hline(g, 1, 1, 30, ','); hline(g, 2, 1, 30, ',')
hline(g, 21, 1, 30, ','); hline(g, 22, 1, 30, ',')
vline(g, 15, 16, 22, '='); vline(g, 16, 16, 22, '=')
T['xian'] = rows(g)

# ───────────────────────── TS 조각 ─────────────────────────
def npc(fid, x, z, bubble=None):
    parts = [f"figureId: '{fid}'", f"x: {x}", f"z: {z}"]
    if bubble: parts.append(f"bubble: '{bubble}'")
    return "      { " + ", ".join(parts) + " },"

def prop(kind, x, z, scale=None):
    parts = [f"kind: '{kind}'", f"x: {x}", f"z: {z}"]
    if scale is not None: parts.append(f"scale: {scale}")
    return "      { " + ", ".join(parts) + " },"

def bld(bid, style, x, z, w, d, floors, sign=None, wall=None, roof=None):
    parts = [f"id: '{bid}'", f"style: '{style}'", f"x: {x}", f"z: {z}",
             f"w: {w}", f"d: {d}", f"floors: {floors}"]
    if sign: parts.append(f"sign: '{sign}'")
    if wall: parts.append(f"wall: '{wall}'")
    if roof: parts.append(f"roof: '{roof}'")
    return "      { " + ", ".join(parts) + " },"

# ───────────────────────── 장식물 자동 배치 ─────────────────────────
# 손으로 좌표를 하나씩 찍으면 개수를 늘리기 어렵고, 건물·NPC 와 겹치기 쉽다.
# 비어 있는 타일을 모아 두고 결정적(재실행해도 같은) 순서로 골라 뿌린다.

def occupied_cells(buildings_raw, npcs_raw, spawn, keepout=2):
    """건물 발자국, NPC 자리, 시작 지점 둘레를 막아 둔다."""
    taken = set()
    for (bx, bz, bw, bd) in buildings_raw:
        for z in range(bz - 1, bz + bd + 2):      # 건물 둘레 한 칸은 통로로 비운다
            for x in range(bx - 1, bx + bw + 2):
                taken.add((x, z))
    for (nx, nz) in npcs_raw:
        for dz in (-1, 0, 1):
            for dx in (-1, 0, 1):
                taken.add((nx + dx, nz + dz))
    sx, sz = spawn
    for dz in range(-keepout, keepout + 1):
        for dx in range(-keepout, keepout + 1):
            taken.add((sx + dx, sz + dz))
    return taken

def free_cells(rows, taken, allowed):
    out = []
    for z, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in allowed and (x, z) not in taken:
                out.append((x, z))
    return out

def scatter(rows, taken, plan, seed=1):
    """plan: [(kind, allowed_chars, count, scale_lo, scale_hi), ...]"""
    lines = []
    state = seed * 2654435761 % (2**31)
    def nxt():
        nonlocal state
        state = (state * 1103515245 + 12345) % (2**31)
        return state / (2**31)
    for kind, allowed, count, lo, hi in plan:
        pool = free_cells(rows, taken, allowed)
        if not pool:
            continue
        placed = 0
        guard = 0
        while placed < count and guard < count * 60:
            guard += 1
            cell = pool[int(nxt() * len(pool)) % len(pool)]
            if cell in taken:
                continue
            taken.add(cell)
            sc = round(lo + nxt() * (hi - lo), 2)
            lines.append(prop(kind, cell[0], cell[1], sc if abs(sc - 1) > 0.02 else None))
            placed += 1
    return lines

NL = chr(10)

HEADER = """import type { WorldMap } from '../types';

/**
 * 도시(맵) 데이터 — 대한민국 임시정부가 실제로 활동한 장소들.
 *
 * ⚠ 지도는 **실측 지도가 아니라 학습용 재구성**이다. 건물의 배치·규모는
 *    그 장소에 실제로 있었던 기관을 학생이 한눈에 보도록 단순화한 것이며,
 *    각 맵의 `historicalNote` 에 실제 사실과 재구성의 경계를 밝혀 둔다.
 *
 * 타일 문자: '.' 흙길 / ',' 풀밭 / '=' 포장도로 / 'S' 돌바닥 / '+' 실내
 *            '~' 물 / '#' 벽 / 'T' 나무 / '^' 계단 / 'x' 경계(통행 불가)
 *
 * 건물과 부피 있는 장식물의 발자국은 `buildWorldGrid()` 가 자동으로 통행 불가로
 * 바꿔 주므로, 지형 문자열에는 땅만 그린다.
 *
 * 이 파일은 `scripts/gen-maps.py` 로 처음 생성했지만, 이후에는 이 파일을
 * 직접 고쳐도 된다(생성기는 지형 초안을 찍어 내는 용도다).
 */

export const worldMaps: WorldMap[] = [
"""

FOOTER = """];

/** id 로 맵을 찾는다. */
export function getMap(id: string): WorldMap {
  const found = worldMaps.find((m) => m.id === id);
  if (!found) throw new Error(`알 수 없는 맵 id: ${id}`);
  return found;
}

export const mapIds = worldMaps.map((m) => m.id);
"""

out = [HEADER]

# ═══════════════════ 1. 상하이 ═══════════════════
# 손으로 둔 것 — 자리가 정해져 있어야 의미가 사는 소품
props = [
    prop('flag-taegeuk', 12, 9, 1.2),
    prop('streetlamp', 11, 11), prop('streetlamp', 23, 11),
    prop('streetlamp', 11, 14), prop('streetlamp', 23, 14),
    prop('streetlamp', 8, 12), prop('streetlamp', 28, 13),
    prop('lantern', 19, 9), prop('lantern', 13, 9),
    prop('well', 8, 20), prop('signpost', 16, 11),
    prop('laundry', 6, 21), prop('laundry', 21, 22),
    prop('banner', 18, 15, 0.9), prop('banner', 24, 16, 0.9),
    prop('cart', 27, 12), prop('bench', 15, 11),
]
# 나머지는 빈 칸에 흩뿌린다 — 봄의 조계 거리를 채운다
_taken = occupied_cells(
    [(13, 4, 6, 4), (3, 5, 4, 3), (28, 5, 5, 3), (28, 16, 5, 4), (3, 16, 4, 3), (19, 16, 4, 3), (13, 19, 4, 3)],
    [(19, 10), (14, 10), (12, 10), (21, 10), (7, 11), (30, 9), (16, 17), (5, 19), (7, 8),
     (23, 20), (11, 15), (30, 20), (26, 8), (23, 7), (18, 21)],
    (17, 14),
)
for line in props:
    import re as _re
    m = _re.search(r"x: (\d+), z: (\d+)", line)
    if m: _taken.add((int(m.group(1)), int(m.group(2))))
props += scatter(T['shanghai'], _taken, [
    ('cherry', ',.', 9, 0.9, 1.25),
    ('willow', ',', 5, 0.95, 1.2),
    ('tree', ',', 6, 0.9, 1.2),
    ('bush', ',.', 14, 0.8, 1.2),
    ('flowerbed', ',', 7, 0.85, 1.1),
    ('crate', '.', 6, 0.8, 1.1),
    ('barrel', '.', 4, 0.85, 1.1),
    ('rock', ',', 4, 0.8, 1.2),
    ('stump', ',', 2, 0.9, 1.1),
], seed=11)
buildings = [
    bld('imjeong-hall', 'shikumen', 13, 4, 6, 4, 3, '대한민국 임시정부 청사', '#d8cfbe', '#4a4f55'),
    bld('dongnip-press', 'shikumen', 3, 5, 4, 3, 2, '독립신문사', '#d2c8b6', '#4f545a'),
    bld('insung-school', 'shikumen', 28, 5, 5, 3, 2, '인성학교', '#cfc6b4', '#4a4f55'),
    bld('french-police', 'western', 28, 16, 5, 4, 2, '프랑스 조계 경찰서', '#c6c2bb', '#5b5f63'),
    bld('gyotongguk', 'shikumen', 3, 16, 4, 3, 2, '교통국 연락사무소', '#d5cbb9', '#4f545a'),
    bld('korean-shop', 'shikumen', 19, 16, 4, 3, 2, '한인 상점', '#d0c7b5', '#4a4f55'),
    bld('korean-houses', 'shikumen', 13, 19, 4, 3, 2, None, '#cdc4b2', '#4f545a'),
]
npcs = [
    npc('kimgu', 19, 10, '청사는 내가 지킨다. 경무국장 김구일세.'),
    npc('ahnchangho', 14, 10, '국내와 이어질 길을 만들어야 하오.'),
    npc('leedongnyeong', 12, 10, '오늘 의정원 회의가 열립니다.'),
    npc('kimgyusik', 21, 10, '파리로 떠날 준비를 하고 있소.'),
    npc('leedonghwi', 7, 11, '외교만으로 나라를 찾을 수 있겠소?'),
    npc('singyusik', 30, 9, '중국 혁명 동지들과 이야기해 보겠소.'),
    npc('jeongjeonghwa', 16, 17, '오늘 저녁 식구가 몇이나 될까요.'),
    npc('chariseok', 5, 19, '문서는 흩어지면 끝입니다.'),
    npc('leegwangsu', 7, 8, '『독립신문』 창간호를 준비 중입니다.'),
    npc('sinchaeho', 23, 20, '임시정부, 이대로 두어서는 안 되오.'),
    npc('yeounhyeong', 11, 15, '신한청년당이 먼저 길을 열었소.'),
    npc('anheeje', 30, 20, '부산에서 올라온 돈입니다. 조용히.'),
    npc('leesiyeong', 26, 8, '장부는 한 푼도 틀리면 안 됩니다.'),
    npc('parkeunsik', 23, 7, '이 모든 일을 역사로 남겨야 하네.'),
    npc('leebongchang', 18, 21, '일본으로 건너갈 채비를 하고 있습니다.'),
]
out.append(f"""  /* ═══════════════════ 1. 상하이 프랑스 조계 ═══════════════════ */
  {{
    id: 'shanghai',
    name: '상하이 프랑스 조계',
    nameOriginal: '上海 法租界',
    period: '1919 ~ 1932',
    summary: {{
      middle:
        '1919년 4월, 대한민국 임시정부가 세워진 곳이에요. 프랑스가 관리하던 구역이라 일본 경찰이 마음대로 들어올 수 없어서, 독립운동가들이 모여들었습니다.',
      high:
        '1919년 4월 대한민국 임시정부가 수립된 곳이다. 프랑스 조계는 치외법권 지역이어서 일본 영사관 경찰의 직접 단속이 제한되었고, 이 때문에 각지의 독립운동가가 모여들어 임정의 첫 근거지가 되었다.',
    }},
    historicalNote:
      '임시정부 청사는 프랑스 조계 안에서 여러 차례 옮겨 다녔고, 오늘날 기념관으로 남아 있는 곳은 마당로(馬當路) 푸칭리(普慶里) 4호이다. 이 맵의 거리·건물 배치는 실측이 아니라 학습용 재구성이다.',
    sky: '#b9c6cf',
    fog: '#c9d2d8',
    spawn: {{ x: 17, z: 14 }},
    tiles: [
{ts_tiles(T['shanghai'])}
    ],
    buildings: [
{NL.join(buildings)}
    ],
    props: [
{NL.join(props)}
    ],
    npcs: [
{NL.join(npcs)}
    ],
  }},
""")

# ═══════════════════ 2. 파리 ═══════════════════
import re as _re
props = [
    prop('monument', 14, 16),
    prop('flag-plain', 12, 7), prop('flag-plain', 18, 7),
    prop('flag-plain', 21, 7, 0.9), prop('flag-plain', 9, 7, 0.9),
    prop('streetlamp', 13, 9), prop('streetlamp', 16, 9),
    prop('streetlamp', 13, 12), prop('streetlamp', 16, 12),
    prop('streetlamp', 6, 11), prop('streetlamp', 23, 11),
    prop('bench', 11, 12), prop('bench', 18, 12), prop('bench', 8, 16),
    prop('signpost', 12, 9),
]
_taken = occupied_cells(
    [(5, 3, 7, 4), (20, 3, 6, 4), (3, 13, 6, 4), (20, 13, 5, 3)],
    [(14, 8), (22, 8), (9, 8)],
    (14, 13),
)
for _line in props:
    _m = _re.search(r"x: (\d+), z: (\d+)", _line)
    if _m: _taken.add((int(_m.group(1)), int(_m.group(2))))
props += scatter(T['paris'], _taken, [
    ('tree', ',S', 12, 0.95, 1.3),
    ('bush', ',S', 9, 0.8, 1.1),
    ('flowerbed', ',', 6, 0.85, 1.1),
    ('bench', 'S', 4, 0.9, 1.0),
    ('crate', 'S', 3, 0.8, 1.0),
    ('reed', 'S', 4, 0.9, 1.2),
], seed=22)
buildings = [
    bld('peace-conference', 'western', 5, 3, 7, 4, 3, '강화회의 회의장', '#d9d4c9', '#6a6f75'),
    bld('paris-bureau', 'western', 20, 3, 6, 4, 3, '임시정부 파리위원부', '#d5d0c5', '#6a6f75'),
    bld('press-hotel', 'western', 3, 13, 6, 4, 4, '신문사 · 숙소', '#cfcabf', '#63686e'),
    bld('cafe', 'western', 20, 13, 5, 3, 2, '카페', '#d2cdc2', '#63686e'),
]
npcs = [
    npc('kimgyusik', 14, 8, '회의장 문은 아직 열리지 않았소.'),
    npc('hwanggihwan', 22, 8, '유럽 신문에 실을 글을 씁니다.'),
    npc('jochoang', 9, 8, '유럽의 사회주의 정당들도 만나 봐야 하오.'),
]
out.append(f"""  /* ═══════════════════ 2. 파리 ═══════════════════ */
  {{
    id: 'paris',
    name: '파리',
    nameOriginal: 'Paris, 1919',
    period: '1919',
    summary: {{
      middle:
        '제1차 세계대전이 끝나고 세계 여러 나라 대표가 모여 회의를 연 도시예요. 임시정부는 이곳에 대표를 보내 한국의 독립을 알리려 했습니다.',
      high:
        '1919년 제1차 세계대전 전후 처리를 위한 강화회의가 열린 도시다. 신한청년당 대표로 파견된 김규식이 파리위원부를 설치하고 한국 독립을 호소했으나, 한국은 연합국의 일원이 아니었고 일본은 승전국이어서 공식 의제가 되지 못했다.',
    }},
    historicalNote:
      '강화회의 본회의는 베르사유궁과 프랑스 외무성 등 여러 장소에서 열렸다. 이 맵은 「회의장 · 파리위원부 사무실 · 선전 활동 공간」이라는 기능을 한 화면에 모아 보여 주는 재구성이며, 실제 파리 시가지와는 다르다.',
    sky: '#c8cdd6',
    fog: '#d4d8de',
    spawn: {{ x: 14, z: 13 }},
    tiles: [
{ts_tiles(T['paris'])}
    ],
    buildings: [
{NL.join(buildings)}
    ],
    props: [
{NL.join(props)}
    ],
    npcs: [
{NL.join(npcs)}
    ],
  }},
""")

# ═══════════════════ 3. 워싱턴 ═══════════════════
props = [
    prop('flag-taegeuk', 10, 8, 1.15), prop('flag-plain', 20, 9),
    prop('streetlamp', 12, 10), prop('streetlamp', 17, 10),
    prop('streetlamp', 12, 14), prop('streetlamp', 17, 14),
    prop('desk', 26, 12), prop('crate', 3, 12),
    prop('bench', 14, 10), prop('bench', 15, 14),
    prop('signpost', 14, 13),
]
_taken = occupied_cells(
    [(3, 3, 7, 4), (19, 3, 7, 5), (3, 15, 6, 4), (20, 15, 6, 4)],
    [(13, 8), (10, 10), (21, 10)],
    (14, 13),
)
for _line in props:
    _m = _re.search(r"x: (\d+), z: (\d+)", _line)
    if _m: _taken.add((int(_m.group(1)), int(_m.group(2))))
props += scatter(T['washington'], _taken, [
    ('tree', ',S.', 14, 1.0, 1.35),
    ('bush', ',.', 10, 0.8, 1.15),
    ('flowerbed', ',', 6, 0.85, 1.1),
    ('bench', 'S,', 4, 0.9, 1.0),
    ('barrel', '.', 3, 0.85, 1.05),
], seed=33)
buildings = [
    bld('gumi-bureau', 'western', 3, 3, 7, 4, 3, '임시정부 구미위원부', '#d8d3c8', '#5f646a'),
    bld('state-dept', 'western', 19, 3, 7, 5, 4, '미국 국무부', '#cfcabf', '#5a5f65'),
    bld('korean-church', 'western', 3, 15, 6, 4, 2, '한인 교회', '#d4cfc4', '#6a6f75'),
    bld('bond-office', 'western', 20, 15, 6, 4, 2, '독립공채 취급소', '#d2cdc2', '#6a6f75'),
]
npcs = [
    npc('leeseungman', 13, 8, '미국을 움직여야 독립을 얻을 수 있소.'),
    npc('kimgyusik', 10, 10, '파리에서 이곳으로 건너왔소.'),
    npc('seojaepil', 21, 10, '필라델피아에서 한인 대회를 열었습니다.'),
]
out.append(f"""  /* ═══════════════════ 3. 워싱턴 D.C. ═══════════════════ */
  {{
    id: 'washington',
    name: '워싱턴 D.C.',
    nameOriginal: 'Washington, D.C.',
    period: '1919 ~ 1945',
    summary: {{
      middle:
        '임시정부가 미국에 둔 외교 사무소인 구미위원부가 있던 곳이에요. 미국 사람들에게 한국의 사정을 알리고, 독립공채를 팔아 자금을 모았습니다.',
      high:
        '1919년 8월 이승만이 설치한 구미위원부(歐美委員部)의 소재지다. 대미 선전과 독립공채 모금을 담당했으나, 미국 정부는 끝내 임시정부를 승인하지 않았다.',
    }},
    historicalNote:
      '구미위원부는 워싱턴 D.C.에 사무소를 두고 활동했다. 이 맵의 건물 배치는 「임정의 대미 외교 · 자금 모금 · 교민 사회」라는 세 기능을 보여 주기 위한 재구성이다.',
    sky: '#c3d0dc',
    fog: '#d2dae2',
    spawn: {{ x: 14, z: 13 }},
    tiles: [
{ts_tiles(T['washington'])}
    ],
    buildings: [
{NL.join(buildings)}
    ],
    props: [
{NL.join(props)}
    ],
    npcs: [
{NL.join(npcs)}
    ],
  }},
""")

# ═══════════════════ 4. 훙커우 공원 ═══════════════════
props = [
    prop('flag-plain', 10, 6, 1.1), prop('flag-plain', 16, 6, 1.1),
    prop('lantern', 9, 11), prop('lantern', 17, 11),
    prop('bench', 11, 15), prop('bench', 15, 15),
    prop('bench', 7, 12), prop('bench', 19, 12),
    prop('stone-lantern', 10, 17), prop('stone-lantern', 16, 17),
    prop('signpost', 13, 18),
]
_taken = occupied_cells(
    [(11, 4, 5, 2), (22, 16, 4, 3)],
    [(13, 12), (11, 12), (15, 12)],
    (13, 20),
)
for _line in props:
    _m = _re.search(r"x: (\d+), z: (\d+)", _line)
    if _m: _taken.add((int(_m.group(1)), int(_m.group(2))))
props += scatter(T['hongkou'], _taken, [
    ('cherry', ',', 12, 0.95, 1.3),
    ('tree', ',', 10, 1.0, 1.3),
    ('pine', ',', 5, 0.9, 1.2),
    ('bush', ',S', 12, 0.8, 1.15),
    ('flowerbed', ',', 8, 0.85, 1.15),
    ('rock', ',', 5, 0.8, 1.2),
    ('reed', ',', 4, 0.9, 1.2),
], seed=44)
buildings = [
    bld('ceremony-stage', 'tent', 11, 4, 5, 2, 1, '천장절 기념식 단상', '#cfd4d8', '#8d3b3b'),
    bld('park-office', 'chinese', 22, 16, 4, 3, 1, '공원 관리소', '#cbc3b2', '#5c6a52'),
]
npcs = [
    npc('yunbonggil', 13, 12, '도시락과 물통을 들고 서 있습니다.'),
    npc('kimgu', 11, 12, '오늘 일은 우리 임시정부의 이름으로 한다.'),
    npc('eomhangseop', 15, 12, '발표문을 미리 준비해 두었습니다.'),
]
out.append(f"""  /* ═══════════════════ 4. 훙커우 공원 ═══════════════════ */
  {{
    id: 'hongkou',
    name: '상하이 훙커우 공원',
    nameOriginal: '上海 虹口公園',
    period: '1932. 4. 29.',
    summary: {{
      middle:
        '1932년 4월 29일, 일본이 일왕의 생일과 상하이 점령을 함께 축하하는 행사를 연 공원이에요. 이날 윤봉길이 단상을 향해 폭탄을 던졌습니다.',
      high:
        '1932년 4월 29일 일본이 천장절(일왕 생일)과 상하이사변 전승 축하식을 함께 연 장소다. 한인애국단 단원 윤봉길이 식장 단상에 폭탄을 던져 시라카와 요시노리 상하이 파견군 사령관 등이 사상했다.',
    }},
    historicalNote:
      '훙커우 공원은 현재 루쉰공원(魯迅公園)이며, 안에 윤봉길 의사를 기리는 매헌(梅軒)이 있다. 이 맵은 식장과 공원 구조를 단순화한 재구성이다. 이 게임은 폭탄 투척 장면을 조작하게 하지 않으며, 그 선택이 왜 내려졌고 무엇을 바꾸었는지를 사료로 따지게 한다.',
    sky: '#aebdc4',
    fog: '#c2ccd1',
    spawn: {{ x: 13, z: 20 }},
    tiles: [
{ts_tiles(T['hongkou'])}
    ],
    buildings: [
{NL.join(buildings)}
    ],
    props: [
{NL.join(props)}
    ],
    npcs: [
{NL.join(npcs)}
    ],
  }},
""")

# ═══════════════════ 5. 자싱 ═══════════════════
props = [
    prop('willow', 3, 12, 1.2), prop('willow', 9, 12, 1.15),
    prop('willow', 21, 12, 1.2), prop('willow', 27, 12, 1.1),
    prop('lantern', 14, 9), prop('lantern', 12, 12),
    prop('crate', 11, 12), prop('barrel', 17, 12),
    prop('cart', 18, 9), prop('laundry', 7, 10),
    prop('banner', 13, 12, 0.85),
    prop('stone-lantern', 6, 7),
]
_taken = occupied_cells(
    [(4, 3, 6, 4), (20, 3, 6, 4), (11, 10, 4, 2)],
    [(16, 9), (13, 9), (19, 8), (22, 8)],
    (15, 10),
)
for _line in props:
    _m = _re.search(r"x: (\d+), z: (\d+)", _line)
    if _m: _taken.add((int(_m.group(1)), int(_m.group(2))))
props += scatter(T['jiaxing'], _taken, [
    ('cherry', ',', 8, 0.95, 1.25),
    ('willow', ',', 6, 1.0, 1.25),
    ('reed', 'S,', 10, 0.9, 1.3),
    ('bush', ',', 10, 0.8, 1.15),
    ('rock', ',S', 6, 0.8, 1.25),
    ('crate', ',', 4, 0.8, 1.05),
    ('stump', ',', 3, 0.9, 1.1),
], seed=55)
buildings = [
    bld('kimgu-refuge', 'chinese', 4, 3, 6, 4, 2, '김구 피난처 (매만가)', '#d5cdba', '#55604d'),
    bld('chu-house', 'chinese', 20, 3, 6, 4, 2, '추푸청 자택', '#d0c8b5', '#55604d'),
    bld('ferry-house', 'chinese', 11, 10, 4, 2, 1, '나루터', '#cdc5b2', '#5c6a52'),
]
npcs = [
    npc('kimgu', 16, 9, '이름을 바꾸고 숨어 지내는 중일세.'),
    npc('jeongjeonghwa', 13, 9, '식구들을 데리고 또 길을 나서야 해요.'),
    npc('parkchanik', 19, 8, '중국 정부와 이야기가 되고 있습니다.'),
    npc('chupucheng', 22, 8, '이곳이라면 당분간 안전할 것입니다.'),
]
out.append(f"""  /* ═══════════════════ 5. 자싱 ═══════════════════ */
  {{
    id: 'jiaxing',
    name: '자싱',
    nameOriginal: '嘉興',
    period: '1932 ~ 1935',
    summary: {{
      middle:
        '윤봉길 의거 뒤 일본 경찰에게 쫓기던 김구가 몸을 숨긴 중국의 물가 마을이에요. 임시정부가 상하이를 떠나 여러 곳을 옮겨 다니는 「이동 시기」가 여기서 시작됩니다.',
      high:
        '1932년 훙커우 의거 이후 일제의 추적이 거세지자 임시정부는 상하이를 떠났다. 김구는 중국 인사 추푸청의 주선으로 자싱·하이옌 일대에 은신했고, 임시정부 기관은 항저우를 거쳐 전장·창사·광저우·류저우·치장으로 옮겨 다녔다.',
    }},
    historicalNote:
      '자싱의 김구 피난처(매만가 梅灣街)는 오늘날 기념관으로 보존되어 있다. 김구가 배 위에서 지낸 시기와 뱃사공 주아이바오(朱愛寶)의 도움은 『백범일지』에 기록되어 있다. 이 맵의 지형은 남호(南湖)와 마을을 단순화한 재구성이다.',
    sky: '#b5c3bd',
    fog: '#c6d0cb',
    spawn: {{ x: 15, z: 10 }},
    tiles: [
{ts_tiles(T['jiaxing'])}
    ],
    buildings: [
{NL.join(buildings)}
    ],
    props: [
{NL.join(props)}
    ],
    npcs: [
{NL.join(npcs)}
    ],
  }},
""")

# ═══════════════════ 6. 충칭 ═══════════════════
props = [
    prop('flag-taegeuk', 13, 20, 1.35), prop('flag-taegeuk', 30, 11, 1.25),
    prop('lantern', 4, 20), prop('lantern', 13, 25), prop('lantern', 21, 20),
    prop('streetlamp', 16, 6), prop('streetlamp', 19, 6),
    prop('streetlamp', 16, 12), prop('streetlamp', 19, 12),
    prop('streetlamp', 16, 22), prop('streetlamp', 19, 22),
    prop('monument', 15, 24), prop('signpost', 20, 19),
    prop('crate', 31, 16), prop('crate', 32, 16), prop('barrel', 30, 16),
    prop('cart', 27, 20), prop('laundry', 8, 16), prop('bench', 14, 16),
    prop('banner', 21, 11, 0.95), prop('banner', 11, 20, 0.95),
]
_taken = occupied_cells(
    [(5, 21, 8, 4), (22, 12, 8, 4), (5, 1, 8, 3), (22, 21, 7, 4), (3, 12, 4, 3)],
    [(14, 22), (10, 25), (24, 16), (27, 16), (21, 16), (25, 11), (20, 11), (24, 25),
     (8, 25), (12, 25), (20, 25), (6, 25), (13, 13), (8, 13)],
    (17, 20),
)
for _line in props:
    _m = _re.search(r"x: (\d+), z: (\d+)", _line)
    if _m: _taken.add((int(_m.group(1)), int(_m.group(2))))
props += scatter(T['chongqing'], _taken, [
    ('pine', ',', 14, 1.0, 1.4),
    ('tree', ',.', 8, 0.95, 1.25),
    ('bush', ',.', 14, 0.8, 1.2),
    ('rock', ',.', 8, 0.85, 1.3),
    ('crate', '.', 5, 0.8, 1.05),
    ('barrel', '.', 4, 0.85, 1.05),
    ('stump', ',', 3, 0.9, 1.1),
], seed=66)
buildings = [
    bld('imjeong-chongqing', 'chongqing', 5, 21, 8, 4, 2, '임시정부 청사 (연화지)', '#cfc7b6', '#4e5548'),
    bld('gwangbok-hq', 'chongqing', 22, 12, 8, 4, 2, '한국광복군 총사령부', '#c9c1b0', '#4a5344'),
    bld('garyeung-hotel', 'western', 5, 1, 8, 3, 3, '가릉빈관 (성립 전례)', '#d3cec3', '#5f646a'),
    bld('uijeongwon', 'chongqing', 22, 21, 7, 4, 2, '임시의정원 회의실', '#ccc4b3', '#4e5548'),
    bld('air-raid-shelter', 'barracks', 3, 12, 4, 3, 1, '방공호 입구', '#9fa196', '#5a5f55'),
]
npcs = [
    npc('kimgu', 14, 22, '이제 우리에게도 군대가 생긴다.'),
    npc('jochoang', 10, 25, '광복 뒤에 세울 나라를 미리 적어 두어야 하오.'),
    npc('jicheongcheon', 24, 16, '총사령부의 명령 계통을 세우는 중일세.'),
    npc('ibeomseok', 27, 16, '대원들을 어떻게 훈련할지가 문제입니다.'),
    npc('kimwonbong', 21, 16, '조선의용대도 함께 싸우겠소.'),
    npc('ogwangsim', 25, 11, '대원을 모으러 먼 길을 다녀왔습니다.'),
    npc('jibokyeong', 20, 11, '아버지를 따라 여기까지 왔어요.'),
    npc('bangsunhui', 24, 25, '의정원에서 할 말은 하겠습니다.'),
    npc('eomhangseop', 8, 25, '오늘 발표문을 다듬고 있습니다.'),
    npc('chariseok', 12, 25, '문서는 정부의 뼈대입니다.'),
    npc('kimgyusik', 20, 25, '연합국의 승인을 얻어 내야 하오.'),
    npc('leesiyeong', 6, 25, '살림은 여전히 빠듯합니다.'),
    npc('hanjiseong', 13, 13, '인도·버마 전선으로 떠날 준비를 합니다.'),
    npc('kimhakgyu', 8, 13, '푸양에서 학병 청년들이 찾아오고 있소.'),
]
out.append(f"""  /* ═══════════════════ 6. 충칭 ═══════════════════ */
  {{
    id: 'chongqing',
    name: '충칭',
    nameOriginal: '重慶',
    period: '1940 ~ 1945',
    summary: {{
      middle:
        '임시정부가 마지막으로 자리 잡은 중국의 전시 수도예요. 이곳에서 한국광복군이 만들어졌고, 일본에 선전포고를 했으며, 광복 뒤 세울 나라의 설계도인 건국강령을 발표했습니다.',
      high:
        '중일전쟁기 중국 국민정부의 전시 수도로, 임시정부가 1940년 정착해 광복 때까지 머문 최후의 근거지다. 한국광복군 창설(1940. 9. 17.), 건국강령 발표(1941. 11.), 대일 선전 성명서(1941. 12. 10.)가 모두 이곳에서 이루어졌다.',
    }},
    historicalNote:
      '충칭 시기 임시정부 청사는 여러 곳을 거쳐 1945년 1월 연화지(蓮花池) 38호에 자리 잡았고, 그 건물이 오늘날 「충칭 대한민국임시정부 청사 유적지」로 복원되어 있다. 한국광복군 총사령부 성립 전례는 1940년 9월 17일 가릉빈관(嘉陵賓館)에서 열렸다. 이 맵은 산비탈 도시라는 특징과 주요 기관을 한 화면에 모은 재구성이다.',
    sky: '#c2c6c4',
    fog: '#cfd2cf',
    spawn: {{ x: 17, z: 20 }},
    tiles: [
{ts_tiles(T['chongqing'])}
    ],
    buildings: [
{NL.join(buildings)}
    ],
    props: [
{NL.join(props)}
    ],
    npcs: [
{NL.join(npcs)}
    ],
  }},
""")

# ═══════════════════ 7. 시안 두취 ═══════════════════
props = [
    prop('flag-taegeuk', 15, 5, 1.4),
    prop('crate', 25, 17), prop('crate', 26, 17), prop('crate', 25, 18),
    prop('barrel', 24, 17), prop('cart', 22, 18),
    prop('streetlamp', 14, 17), prop('streetlamp', 17, 17),
    prop('streetlamp', 14, 20), prop('streetlamp', 17, 20),
    prop('signpost', 18, 19), prop('bench', 12, 17), prop('bench', 19, 17),
    prop('banner', 8, 5, 1.0), prop('banner', 23, 5, 1.0),
    prop('laundry', 27, 16),
]
_taken = occupied_cells(
    [(3, 6, 4, 4), (26, 6, 4, 4), (26, 11, 4, 4), (3, 12, 4, 3), (10, 18, 5, 3)],
    [(15, 14), (12, 14), (18, 14)],
    (15, 21),
)
for _line in props:
    _m = _re.search(r"x: (\d+), z: (\d+)", _line)
    if _m: _taken.add((int(_m.group(1)), int(_m.group(2))))
props += scatter(T['xian'], _taken, [
    ('pine', ',.', 12, 0.95, 1.35),
    ('tree', ',.', 6, 0.9, 1.2),
    ('bush', ',.', 12, 0.8, 1.15),
    ('rock', ',.', 8, 0.85, 1.3),
    ('crate', '.', 6, 0.8, 1.1),
    ('barrel', '.', 4, 0.85, 1.05),
    ('stump', '.', 3, 0.9, 1.1),
], seed=77)
buildings = [
    bld('second-corps', 'barracks', 3, 6, 4, 4, 2, '광복군 제2지대 본부', '#b3b3a4', '#5c6152'),
    bld('barracks-a', 'barracks', 26, 6, 4, 4, 1, '대원 막사', '#aeae9f', '#5c6152'),
    bld('barracks-b', 'barracks', 26, 11, 4, 4, 1, None, '#aeae9f', '#5c6152'),
    bld('training-tent', 'tent', 3, 12, 4, 3, 1, '훈련 천막', '#c4c0ad', '#6b6a58'),
    bld('oss-office', 'western', 10, 18, 5, 3, 1, 'OSS 연락소', '#c9c5b4', '#5f645a'),
]
npcs = [
    npc('ibeomseok', 15, 14, '국내로 들어갈 날이 머지않았다.'),
    npc('jangjunha', 12, 14, '수천 리를 걸어 여기까지 왔습니다.'),
    npc('kimgu', 18, 14, '미국 측 책임자를 만나러 왔네.'),
]
out.append(f"""  /* ═══════════════════ 7. 시안 두취 ═══════════════════ */
  {{
    id: 'xian',
    name: '시안 두취',
    nameOriginal: '西安 杜曲',
    period: '1945',
    summary: {{
      middle:
        '한국광복군 제2지대가 있던 훈련장이에요. 1945년 미국 전략정보국(OSS)과 함께 국내로 들어갈 부대를 훈련했습니다. 그러나 작전을 펴기 전에 일본이 항복했어요.',
      high:
        '한국광복군 제2지대(지대장 이범석)의 근거지로, 1945년 미국 전략정보국(OSS)과 합작한 국내정진군 훈련이 이루어진 곳이다. 김구는 1945년 8월 이곳에서 OSS 책임자와 만나 국내 진입 작전을 논의했으나, 며칠 뒤 일본이 항복하면서 작전은 실행되지 못했다.',
    }},
    historicalNote:
      '제2지대 본부는 시안 인근 두취(杜曲)에 있었다. 같은 시기 안후이성 푸양에서는 제3지대(김학규)가 별도의 OSS 훈련을 진행했다. 이 맵은 연병장·막사·연락소를 갖춘 훈련장의 일반적 구조를 재구성한 것으로, 실측 도면이 아니다.',
    sky: '#cbc7b4',
    fog: '#d5d1c0',
    spawn: {{ x: 15, z: 21 }},
    tiles: [
{ts_tiles(T['xian'])}
    ],
    buildings: [
{NL.join(buildings)}
    ],
    props: [
{NL.join(props)}
    ],
    npcs: [
{NL.join(npcs)}
    ],
  }},
""")

out.append(FOOTER)
Path('src/data/maps.ts').write_text(''.join(out))
print('src/data/maps.ts 생성 완료')
