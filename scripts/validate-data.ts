/**
 * 정적 역사 데이터 검증 스크립트 — npm run data:validate
 *  - 스키마 필수 필드·타입, id 중복, 참조 무결성(polity_id / achievement_standards / related_*), 연도 범위, 좌표 범위 검사
 *  - 성취기준 65개의 code·subject·school_level·unit·text 는 원문 고정(수정 금지) → 개수·형식만 확인
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Any = Record<string, unknown>;
const read = (f: string) => JSON.parse(readFileSync(resolve('src/data', f), 'utf8')) as Any[];

const polities = read('polities.json');
const figures = read('figures.json');
const places = read('places.json');
const events = read('events.json');
const routes = read('routes.json');
const standards = read('achievement_standards.json');

const errors: string[] = [];
const warn: string[] = [];
const REGIONS = new Set(['east_asia', 'southeast_asia', 'central_asia', 'south_asia', 'west_asia', 'europe', 'africa', 'americas', 'oceania']);
const SUBJECTS = new Set(['역사①', '역사②', '세계사', '동아시아 역사 기행']);
const YEAR_MIN = -3000;
const YEAR_MAX = 2000;

const isLatLon = (v: unknown) =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number' && Math.abs(v[0]) <= 90 && Math.abs(v[1]) <= 180;

function checkIds(name: string, arr: Any[]) {
  const seen = new Set<string>();
  for (const it of arr) {
    const id = it.id as string;
    if (!id || typeof id !== 'string' || !/^[a-z0-9_]+$/.test(id)) errors.push(`${name}: 잘못된 id ${JSON.stringify(id)}`);
    if (seen.has(id)) errors.push(`${name}: 중복 id ${id}`);
    seen.add(id);
  }
}
function checkSubjects(where: string, v: unknown) {
  if (!Array.isArray(v) || v.length === 0) errors.push(`${where}: textbook_appearance 비어 있음`);
  else for (const s of v) if (!SUBJECTS.has(s as string)) errors.push(`${where}: 알 수 없는 과목 태그 ${s}`);
}
const stdCodes = new Set(standards.map((s) => s.code as string));
function checkStandards(where: string, v: unknown) {
  if (!Array.isArray(v)) return errors.push(`${where}: achievement_standards 배열 아님`);
  for (const c of v) if (!stdCodes.has(c as string)) errors.push(`${where}: 존재하지 않는 성취기준 ${c}`);
}

checkIds('polities', polities);
checkIds('figures', figures);
checkIds('places', places);
checkIds('events', events);
checkIds('routes', routes);

for (const p of polities) {
  const w = `polity ${p.id}`;
  for (const k of ['name_ko', 'name_en', 'capital', 'summary_ko', 'note']) if (typeof p[k] !== 'string') errors.push(`${w}: ${k} 문자열 아님`);
  if (!REGIONS.has(p.region as string)) errors.push(`${w}: region 잘못됨 ${p.region}`);
  if (typeof p.start_year !== 'number' || typeof p.end_year !== 'number') errors.push(`${w}: 연도 숫자 아님`);
  else {
    if ((p.start_year as number) > (p.end_year as number)) errors.push(`${w}: start_year > end_year`);
    if ((p.start_year as number) < YEAR_MIN || (p.end_year as number) > 2100) warn.push(`${w}: 타임라인 범위 밖 연도`);
  }
  if (!isLatLon(p.centroid)) errors.push(`${w}: centroid 잘못됨`);
  if (!Array.isArray(p.area_polygon)) errors.push(`${w}: area_polygon 배열 아님`);
  else {
    for (const pt of p.area_polygon as unknown[]) if (!isLatLon(pt)) errors.push(`${w}: area_polygon 좌표 잘못됨`);
    if ((p.area_polygon as unknown[]).length === 0 && typeof p.radius_km !== 'number') errors.push(`${w}: area_polygon 이 비었으면 radius_km 필요`);
    if ((p.area_polygon as unknown[]).length > 0 && (p.area_polygon as unknown[]).length < 3) errors.push(`${w}: 폴리곤 꼭짓점 3개 미만`);
  }
  if (typeof p.is_approximate !== 'boolean') errors.push(`${w}: is_approximate 불리언 아님`);
  if (p.is_approximate === true && !(p.note as string)) warn.push(`${w}: is_approximate 인데 note 가 비어 있음`);
  if ((p.summary_ko as string).split('\n').length > 3) errors.push(`${w}: summary_ko 3줄 초과`);
  checkSubjects(w, p.textbook_appearance);
  checkStandards(w, p.achievement_standards);
  if (!Array.isArray(p.sources)) errors.push(`${w}: sources 배열 아님`);
}

const polityIds = new Set(polities.map((p) => p.id as string));
for (const f of figures) {
  const w = `figure ${f.id}`;
  for (const k of ['name_ko', 'name_en', 'one_liner_ko', 'note']) if (typeof f[k] !== 'string') errors.push(`${w}: ${k} 문자열 아님`);
  if (typeof f.birth_year !== 'number' || typeof f.death_year !== 'number') errors.push(`${w}: 생몰년 숫자 아님`);
  else if ((f.birth_year as number) > (f.death_year as number)) errors.push(`${w}: birth_year > death_year`);
  if (f.polity_id !== null && !polityIds.has(f.polity_id as string)) errors.push(`${w}: 존재하지 않는 polity_id ${f.polity_id}`);
  if (f.polity_id === null) warn.push(`${w}: polity_id 미연결(TODO)`);
  if (!isLatLon(f.activity_location)) errors.push(`${w}: activity_location 잘못됨`);
  const ay = f.activity_years as number[];
  if (!Array.isArray(ay) || ay.length !== 2 || ay[0] > ay[1]) errors.push(`${w}: activity_years 잘못됨`);
  else if (ay[0] < (f.birth_year as number) || ay[1] > (f.death_year as number)) errors.push(`${w}: activity_years 가 생몰년 밖`);
  if (typeof f.is_approximate !== 'boolean') errors.push(`${w}: is_approximate 불리언 아님`);
  if (f.is_approximate === true && !(f.note as string)) warn.push(`${w}: is_approximate 인데 note 가 비어 있음`);
  checkSubjects(w, f.textbook_appearance);
  checkStandards(w, f.achievement_standards);
}

for (const p of places) {
  const w = `place ${p.id}`;
  if (typeof p.name_ko !== 'string') errors.push(`${w}: name_ko 없음`);
  if (!isLatLon(p.coords)) errors.push(`${w}: coords 잘못됨`);
  if (!Array.isArray(p.era_names) || (p.era_names as unknown[]).length === 0) errors.push(`${w}: era_names 비어 있음`);
  else for (const e of p.era_names as Any[]) if (typeof e.from !== 'number' || typeof e.to !== 'number' || e.from >= e.to || typeof e.name_ko !== 'string') errors.push(`${w}: era_names 항목 잘못됨`);
}
for (const e of events) {
  const w = `event ${e.id}`;
  if (typeof e.year !== 'number' || (e.year as number) < YEAR_MIN || (e.year as number) > YEAR_MAX) errors.push(`${w}: year 잘못됨`);
  if (typeof e.name_ko !== 'string') errors.push(`${w}: name_ko 없음`);
  if (!isLatLon(e.coords)) errors.push(`${w}: coords 잘못됨`);
  checkSubjects(w, e.textbook_appearance);
}
for (const r of routes) {
  const w = `route ${r.id}`;
  if (!Array.isArray(r.path) || (r.path as unknown[]).length < 2) errors.push(`${w}: path 2점 미만`);
  else for (const pt of r.path as unknown[]) if (!isLatLon(pt)) errors.push(`${w}: path 좌표 잘못됨`);
}

// 성취기준: 원문 65개 고정. 채울 수 있는 필드는 suggested_year_range / related_polities / related_figures 뿐
if (standards.length !== 65) errors.push(`achievement_standards: 65개여야 함 (현재 ${standards.length})`);
const figureIds = new Set(figures.map((f) => f.id as string));
for (const s of standards) {
  const w = `standard ${s.code}`;
  const keys = Object.keys(s).sort().join(',');
  if (keys !== 'code,related_figures,related_polities,school_level,subject,suggested_year_range,text,unit') errors.push(`${w}: 필드 구성이 원문 스키마와 다름 (${keys})`);
  if (!/^\[(9역|12세사|12동역)\d{2}-\d{2}\]$/.test(s.code as string)) errors.push(`${w}: code 형식 오류`);
  if (!SUBJECTS.has(s.subject as string)) errors.push(`${w}: subject 오류`);
  const r = s.suggested_year_range;
  if (r !== null && !(Array.isArray(r) && r.length === 2 && typeof r[0] === 'number' && typeof r[1] === 'number' && r[0] <= r[1])) errors.push(`${w}: suggested_year_range 형식 오류`);
  for (const id of s.related_polities as string[]) if (!polityIds.has(id)) errors.push(`${w}: related_polities 에 없는 id ${id}`);
  for (const id of s.related_figures as string[]) if (!figureIds.has(id)) errors.push(`${w}: related_figures 에 없는 id ${id}`);
}

// 요약
const target = { polities: 120, figures: 150, places: 80, events: 60 };
console.log('── 데이터 요약 ──');
console.log(`왕조·국가 ${polities.length}/${target.polities} · 인물 ${figures.length}/${target.figures} · 장소 ${places.length}/${target.places} · 사건 ${events.length}/${target.events} · 교역로 ${routes.length} · 성취기준 ${standards.length}`);
const byRegion = new Map<string, number>();
for (const p of polities) byRegion.set(p.region as string, (byRegion.get(p.region as string) ?? 0) + 1);
console.log('문화권별 왕조:', Object.fromEntries(byRegion));
if (warn.length) {
  console.log(`\n⚠ 경고 ${warn.length}건`);
  for (const w of warn) console.log('  -', w);
}
if (errors.length) {
  console.error(`\n✖ 오류 ${errors.length}건`);
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log('\n✔ 스키마·참조 검사 통과');
