"""조각 파일(scripts/data-src/*.py)과 기존 시드를 병합해 src/data/*.json 을 만든다.
실행: python3 scripts/data-src/merge.py
"""
import json, sys, os, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
DATA = os.path.join(ROOT, 'src', 'data')

def load(name):
    with open(os.path.join(DATA, name), encoding='utf-8') as f:
        return json.load(f)

def merge(existing, new_items, key='id'):
    by = {x[key]: x for x in existing}
    for it in new_items:
        by[it[key]] = it  # 조각 파일이 우선(수정 반영)
    return list(by.values())

polities = load('polities.json'); figures = load('figures.json'); places = load('places.json'); events = load('events.json'); routes = load('routes.json')
for mod in ['polities_east_asia', 'polities_asia_rest', 'polities_west']:
    polities = merge(polities, importlib.import_module(mod).polities)
for mod in ['figures_east_asia', 'figures_west']:
    figures = merge(figures, importlib.import_module(mod).figures)
places = merge(places, importlib.import_module('places').places)
events = merge(events, importlib.import_module('events').events)
routes = merge(routes, importlib.import_module('routes').routes)

# 시드 단계에서 미연결이던 인물 polity 연결
fix = {'saladin': 'ayyubid', 'zheng_he': 'ming', 'marco_polo': 'venice', 'muhammad': None}
for f in figures:
    if f['id'] in fix and fix[f['id']]:
        f['polity_id'] = fix[f['id']]
        f['note'] = f['note'].replace(' polity_id는 아이유브 왕조 항목 입력 후 연결 예정(TODO).', '').replace(' polity_id는 명 항목 입력 후 연결 예정(TODO).', '').replace(' 베네치아 공화국은 3단계에서 입력 후 연결 예정(TODO).', '')

# 성취기준 매핑
from standards_map import STANDARDS
stds = load('achievement_standards.json')
pid = {p['id'] for p in polities}; fid = {f['id'] for f in figures}
missing = []
for s in stds:
    rng, ps, fs = STANDARDS[s['code']]
    s['suggested_year_range'] = list(rng) if rng else None
    for x in ps:
        if x not in pid: missing.append((s['code'], 'polity', x))
    for x in fs:
        if x not in fid: missing.append((s['code'], 'figure', x))
    s['related_polities'] = [x for x in ps if x in pid]
    s['related_figures'] = [x for x in fs if x in fid]
if missing:
    print('WARN 매핑에 없는 id:', missing)

def sort_key(x): return (x.get('start_year', x.get('birth_year', x.get('year', 0))), x['id'])
polities.sort(key=sort_key); figures.sort(key=sort_key); events.sort(key=lambda e: (e['year'], e['id']))

def dump(name, obj):
    with open(os.path.join(DATA, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=2); f.write('\n')
dump('polities.json', polities); dump('figures.json', figures); dump('places.json', places); dump('events.json', events); dump('routes.json', routes); dump('achievement_standards.json', stds)
print(f'polities {len(polities)} · figures {len(figures)} · places {len(places)} · events {len(events)} · routes {len(routes)} · standards {len(stds)}')
