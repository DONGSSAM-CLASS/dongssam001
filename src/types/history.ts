/**
 * 역사 기본 데이터 타입 — 요구사항 6장의 JSON 스키마를 그대로 따른다.
 * 좌표는 모두 [lat, lon] 순서(십진수 도).
 */

/** 문화권(색상 계열 통일 기준) */
export type Region =
  | 'east_asia'
  | 'southeast_asia'
  | 'central_asia'
  | 'south_asia'
  | 'west_asia'
  | 'europe'
  | 'africa'
  | 'americas'
  | 'oceania';

/** 교과서 등장 과목 태그 */
export type Subject = '역사①' | '역사②' | '세계사' | '동아시아 역사 기행';

export type LatLon = [lat: number, lon: number];

export interface Polity {
  id: string;
  name_ko: string;
  name_en: string;
  region: Region;
  /** 음수 = 기원전 (예: -221) */
  start_year: number;
  end_year: number;
  capital: string;
  centroid: LatLon;
  /** 개략적 영역. 비어 있으면 centroid + radius_km(기본 300km) 원으로 표시 */
  area_polygon: LatLon[];
  radius_km?: number;
  is_approximate: boolean;
  /** 3줄 이내 */
  summary_ko: string;
  textbook_appearance: Subject[];
  achievement_standards: string[];
  sources: string[];
  note: string;
}

export interface Figure {
  id: string;
  name_ko: string;
  name_en: string;
  birth_year: number;
  death_year: number;
  is_approximate: boolean;
  polity_id: string | null;
  activity_location: LatLon;
  /** 지구본에 마커를 표시할 활동 연대 [from, to] */
  activity_years: [number, number];
  one_liner_ko: string;
  textbook_appearance: Subject[];
  achievement_standards: string[];
  sources: string[];
  note: string;
}

export type PlaceType = 'city' | 'site' | 'port' | 'route_node' | 'battlefield' | 'religious' | 'natural';

export interface EraName {
  from: number;
  to: number;
  name_ko: string;
}

export interface Place {
  id: string;
  name_ko: string;
  name_en?: string;
  coords: LatLon;
  type: PlaceType;
  era_names: EraName[];
  textbook_appearance?: Subject[];
  note?: string;
}

export interface HistoricalEvent {
  id: string;
  year: number;
  name_ko: string;
  name_en?: string;
  coords: LatLon;
  textbook_appearance: Subject[];
  /** 타임라인 북마크 점프 대상 여부 */
  bookmark?: boolean;
  note?: string;
}

export interface AchievementStandard {
  code: string;
  subject: Subject;
  school_level: '중학교' | '고등학교';
  unit: string;
  text: string;
  suggested_year_range: [number, number] | null;
  related_polities: string[];
  related_figures: string[];
}

export interface TradeRoute {
  id: string;
  name_ko: string;
  name_en?: string;
  /** 활발했던 대략적 시기 */
  active_years: [number, number];
  path: LatLon[];
  is_approximate: boolean;
  note?: string;
}

export interface HistoryDataset {
  polities: Polity[];
  figures: Figure[];
  places: Place[];
  events: HistoricalEvent[];
  routes: TradeRoute[];
  achievement_standards: AchievementStandard[];
}
