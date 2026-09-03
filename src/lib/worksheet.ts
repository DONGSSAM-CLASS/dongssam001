/**
 * 활동지 자동 생성 (순수 함수).
 * 선택한 성취기준·연대·강조 국가/인물을 바탕으로 문항을 만든다.
 * 교사는 만들어진 문항을 편집·추가·삭제할 수 있다(WorksheetPage).
 */
import { dataset, figureById, polityById, standardByCode } from '@/data';
import { formatYear, haversineKm, REGION_LABELS, travelDays, type TravelRates } from '@/lib/history';
import { polityActiveIn } from '@/lib/history';
import type { WorksheetItem } from '@/types/firestore';
import type { Region } from '@/types/history';

export interface WorksheetInput {
  title: string;
  standards: string[];
  yearRange: [number, number];
  focusYear: number;
  polityIds: string[];
  figureIds: string[];
  rates: TravelRates;
}

export interface WorksheetMeta {
  title: string;
  standards: string[];
  yearRange: [number, number];
  focusYear: number;
  schoolName?: string;
  className?: string;
  teacherName?: string;
}

let seq = 0;
const nid = (prefix: string) => `${prefix}_${(seq += 1)}`;

/** 설정 연대에 활성인 정치체를 문화권별로 최대 n개 고른다 */
function regionsAt(year: number, polityIds: string[], max = 5): { region: Region; names: string[] }[] {
  const picked = polityIds.map((id) => polityById.get(id)).filter((p) => p && polityActiveIn(p, year));
  const pool = picked.length >= 3 ? picked : dataset.polities.filter((p) => polityActiveIn(p, year));
  const byRegion = new Map<Region, string[]>();
  for (const p of pool) {
    if (!p) continue;
    const arr = byRegion.get(p.region) ?? [];
    if (arr.length < 3) arr.push(p.name_ko);
    byRegion.set(p.region, arr);
  }
  return [...byRegion.entries()].slice(0, max).map(([region, names]) => ({ region, names }));
}

/** 활동지 문항 자동 생성 */
export function generateWorksheet(input: WorksheetInput): WorksheetItem[] {
  seq = 0;
  const items: WorksheetItem[] = [];
  const { focusYear, yearRange, rates } = input;

  // 1) 학습목표 — 성취기준 원문을 그대로 옮긴다
  const objectives = input.standards.map((code) => standardByCode.get(code)).filter(Boolean);
  items.push({
    id: nid('obj'),
    kind: 'objective',
    prompt: objectives.length
      ? objectives.map((s) => `${s!.code} ${s!.text}`).join('\n')
      : `${formatYear(yearRange[0])}부터 ${formatYear(yearRange[1])}까지 여러 지역의 정치체와 인물을 비교하여 설명할 수 있다.`,
    payload: { codes: input.standards },
  });

  // 2) 지구본 탐색 과제
  const targets = input.polityIds
    .map((id) => polityById.get(id))
    .filter((p) => p && polityActiveIn(p, focusYear))
    .slice(0, 4)
    .map((p) => ({ name: p!.name_ko, ask: '수도와 존속 기간' }));
  items.push({
    id: nid('exp'),
    kind: 'explore',
    prompt: `지구본의 연대를 ${formatYear(focusYear)}으로 맞추고, 아래 나라를 찾아 클릭해 정보를 적어 보자.`,
    payload: {
      year: focusYear,
      targets: targets.length ? targets : [{ name: '(지구본에서 찾은 나라)', ask: '수도와 존속 기간' }],
    },
  });

  // 3) 동시대 비교표 (빈칸형)
  const regions = regionsAt(focusYear, input.polityIds);
  items.push({
    id: nid('cmp'),
    kind: 'compare_table',
    prompt: `${formatYear(focusYear)}, 같은 시기 각 지역에는 어떤 나라와 인물이 있었을까? 지구본을 돌려 확인하고 표를 채워 보자.`,
    payload: {
      year: focusYear,
      rows: regions.map((r) => ({ label: REGION_LABELS[r.region], hint: r.names[0] ?? '' })),
      columns: ['나라(왕조)', '대표 인물', '이 시기의 특징'],
    },
  });

  // 4) 거리·루트 계산 문항
  const figs = input.figureIds.map((id) => figureById.get(id)).filter(Boolean);
  const a = figs[0]?.activity_location ?? polityById.get(input.polityIds[0] ?? '')?.centroid ?? [37.97, 126.55];
  const b = figs[1]?.activity_location ?? polityById.get(input.polityIds[1] ?? '')?.centroid ?? [34.27, 108.95];
  const aName = figs[0]?.name_ko ? `${figs[0].name_ko}의 활동 지역` : (polityById.get(input.polityIds[0] ?? '')?.capital ?? '개경');
  const bName = figs[1]?.name_ko ? `${figs[1].name_ko}의 활동 지역` : (polityById.get(input.polityIds[1] ?? '')?.capital ?? '장안');
  const km = Math.round(haversineKm(a as [number, number], b as [number, number]));
  const days = travelDays(km, rates);
  items.push({
    id: nid('dist'),
    kind: 'distance',
    prompt: `지구본의 "거리 재기"로 ${aName}과(와) ${bName} 사이의 거리를 재어 보자. 도보와 범선으로는 각각 며칠이 걸릴까?`,
    payload: {
      from: { name: aName, coords: a },
      to: { name: bName, coords: b },
      answer: { km, walkDays: days.walk, horseDays: days.horse, sailDays: days.sail },
      rates,
    },
  });

  // 5) 루트 문항
  items.push({
    id: nid('route'),
    kind: 'route',
    prompt: '핀을 순서대로 이어 이동 경로를 만들고, 총거리와 지나간 지역을 적어 보자.',
    payload: { stops: 3 },
  });

  // 6) 서술형
  items.push({
    id: nid('essay'),
    kind: 'essay',
    prompt: objectives[0]
      ? `${objectives[0].text.replace(/\.$/, '')} 위 표를 근거로 자기 말로 설명해 보자.`
      : '같은 시기 서로 다른 지역의 나라들을 비교하고, 교류가 어떤 영향을 주었는지 설명해 보자.',
    payload: { lines: 6 },
  });

  // 7) 자기평가 체크리스트
  items.push({
    id: nid('self'),
    kind: 'self_check',
    prompt: '오늘 활동을 스스로 평가해 보자.',
    payload: {
      items: [
        '지구본에서 연대를 바꾸며 같은 시기 여러 지역을 살펴보았다.',
        '나라와 인물의 정보를 정확히 찾아 적었다.',
        '두 지점의 거리를 재고 이동 시간을 계산했다.',
        '친구의 설명을 듣고 내 생각을 덧붙였다.',
      ],
    },
  });

  return items;
}

export const KIND_LABELS: Record<WorksheetItem['kind'], string> = {
  objective: '학습목표',
  explore: '지구본 탐색',
  compare_table: '동시대 비교표',
  distance: '거리 계산',
  route: '이동 경로',
  essay: '서술형',
  self_check: '자기평가',
};

/** 교사가 새로 추가하는 문항 — 자동 생성 문항과 id 가 겹치지 않도록 고유 id 를 쓴다 */
export function newWorksheetItem(kind: WorksheetItem['kind']): WorksheetItem {
  const id = `${kind}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const base: Record<WorksheetItem['kind'], Omit<WorksheetItem, 'id'>> = {
    objective: { kind, prompt: '학습목표를 적어 주세요.', payload: {} },
    explore: { kind, prompt: '지구본에서 찾아볼 것을 적어 주세요.', payload: { targets: [{ name: '', ask: '' }] } },
    compare_table: { kind, prompt: '표를 채워 보자.', payload: { rows: [{ label: '', hint: '' }], columns: ['나라(왕조)', '대표 인물', '특징'] } },
    distance: { kind, prompt: '두 지점의 거리를 재어 보자.', payload: {} },
    route: { kind, prompt: '이동 경로를 만들어 보자.', payload: { stops: 3 } },
    essay: { kind, prompt: '서술형 문항을 적어 주세요.', payload: { lines: 6 } },
    self_check: { kind, prompt: '자기평가', payload: { items: ['', ''] } },
  };
  return { id, ...base[kind] };
}
