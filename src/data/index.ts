/**
 * 역사 기본 데이터 로더.
 * Firestore 읽기 할당량을 아끼기 위해 기본 데이터는 앱 번들에 포함된 정적 JSON에서만 로드한다.
 */
import type {
  AchievementStandard,
  Figure,
  HistoricalEvent,
  HistoryDataset,
  Place,
  Polity,
  TradeRoute,
} from '@/types/history';
import polities from './polities.json';
import figures from './figures.json';
import places from './places.json';
import events from './events.json';
import routes from './routes.json';
import achievementStandards from './achievement_standards.json';

export const dataset: HistoryDataset = {
  polities: polities as Polity[],
  figures: figures as Figure[],
  places: places as Place[],
  events: events as HistoricalEvent[],
  routes: routes as TradeRoute[],
  achievement_standards: achievementStandards as AchievementStandard[],
};

export const polityById = new Map(dataset.polities.map((p) => [p.id, p]));
export const figureById = new Map(dataset.figures.map((f) => [f.id, f]));
export const placeById = new Map(dataset.places.map((p) => [p.id, p]));
export const eventById = new Map(dataset.events.map((e) => [e.id, e]));
export const standardByCode = new Map(dataset.achievement_standards.map((s) => [s.code, s]));

/** 타임라인 범위: 기원전 3000년 ~ 서기 2000년 */
export const YEAR_MIN = -3000;
export const YEAR_MAX = 2000;
