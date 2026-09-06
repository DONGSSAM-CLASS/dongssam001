import type {
  Curriculum,
  Exam,
  Item,
  MiddleSchoolMapEntry,
} from '../types/schema';

export interface AppData {
  curriculum: Curriculum;
  exams: Exam[];
  items: Item[];
  middleSchoolMap: MiddleSchoolMapEntry[];
  /** 예시(샘플) 데이터가 로드되었는지 여부 — 화면에 배너 표시용 */
  isSample: boolean;
}

async function fetchJson<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`, {
    cache: 'no-cache',
  });
  if (!res.ok) throw new Error(`데이터 로드 실패: ${name}.json (${res.status})`);
  return (await res.json()) as T;
}

/**
 * 프로덕션 데이터(public/data)를 로드한다.
 * 개발(DEV) 모드에서 회차·문항이 비어 있으면 data/_sample 의 예시(샘플) 문항으로 대체해
 * 화면을 확인할 수 있게 한다. 단원 트리(curriculum)·중학교 연결(map)은 실제 데이터를 그대로 쓴다.
 * import.meta.env.DEV 를 먼저 평가하므로 프로덕션 빌드에서는 이 분기와 샘플 동적 import 가
 * 정적으로 제거(dead-code elimination)되어 샘플이 번들에 포함되지 않는다.
 */
export async function loadAppData(): Promise<AppData> {
  const [curriculum, exams, items, middleSchoolMap] = await Promise.all([
    fetchJson<Curriculum>('curriculum'),
    fetchJson<Exam[]>('exams'),
    fetchJson<Item[]>('items'),
    fetchJson<MiddleSchoolMapEntry[]>('middleSchoolMap'),
  ]);

  if (import.meta.env.DEV && items.length === 0) {
    const sample = await loadSampleItems();
    return {
      curriculum,
      exams: exams.length > 0 ? exams : sample.exams,
      items: sample.items,
      middleSchoolMap,
      isSample: true,
    };
  }

  return { curriculum, exams, items, middleSchoolMap, isSample: false };
}

async function loadSampleItems() {
  const [exams, items] = await Promise.all([
    import('../../data/_sample/exams.sample.json'),
    import('../../data/_sample/items.sample.json'),
  ]);
  return {
    exams: exams.default as unknown as Exam[],
    items: items.default as unknown as Item[],
  };
}
