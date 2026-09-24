// 헤드리스 Chromium으로 타이틀 → 선택 → 로딩 → 3랩 레이스 → 결과 → 재시작 → 일시정지 → 처음으로를 검사한다.
// CDN(three@0.160.0) 요청은 로컬 node_modules/three로 돌려서 오프라인에서도 돈다.
// 사용법: node e2e.mjs desktop | mobile
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] || 'desktop';
const OUT = path.join(HERE, 'out'); fs.mkdirSync(OUT, { recursive: true });
const THREE_DIR = path.join(HERE, 'node_modules/three');
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: mode === 'mobile' ? { width: 412, height: 860 } : { width: 1280, height: 760 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
await pg.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => {
  const rel = r.request().url().split('three@0.160.0/')[1];
  r.fulfill({ body: fs.readFileSync(path.join(THREE_DIR, rel)), contentType: 'application/javascript' });
});
const shot = n => pg.screenshot({ path: path.join(OUT, `${mode}-${n}.png`) });
await pg.goto(pathToFileURL(path.join(HERE, '../superstar-kart.html')).href);
await pg.waitForFunction(() => window.SK && SK.screen === 'title', null, { timeout: 120000 });
await pg.waitForTimeout(1000); await shot('1-title');
await pg.click('#btnStart'); await pg.waitForTimeout(600); await shot('2-char');
await pg.click('#btnNext1');
await pg.click(`#trackRow .card:nth-child(${mode === 'mobile' ? 2 : 1})`);
await pg.click('#kartRow .card:nth-child(2)'); await pg.waitForTimeout(600); await shot('3-kart');
await pg.click('#btnDone');
await pg.waitForFunction(() => SK.screen === 'race', null, { timeout: 120000 });
await pg.waitForTimeout(1000); await shot('4-countdown');
const info = await pg.evaluate(() => {
  const g = SK.game; while (g.state === 'countdown') SK.updateGame(0.05);
  for (let i = 0; i < 60 * 200 && g.state !== 'finished'; i++) {
    const p = g.player, N = SK.track.N, tp = SK.track.pts[(p.idx + 14) % N];
    const d = SK.wrapAngle(Math.atan2(tp.x - p.pos.x, tp.z - p.pos.z) - p.heading);
    SK.keys.ArrowRight = d < -0.05; SK.keys.ArrowLeft = d > 0.05; SK.keys.ShiftLeft = Math.abs(d) > 0.25 && i % 90 < 60;
    if (p.item && i % 100 === 0) SK.tryUseItem();
    if (p.gauge >= 100) SK.tryUlt();
    SK.updateGame(1 / 60);
  }
  SK.keys.ArrowRight = SK.keys.ArrowLeft = SK.keys.ShiftLeft = false;
  return { state: g.state, lap: g.player.lap, time: +g.raceTime.toFixed(1), rank: SK.rankOf(g.karts).indexOf(g.player) + 1 };
});
console.log('race', JSON.stringify(info));
await shot('5-race');
await pg.evaluate(() => { SK.game.player.finished = true; SK.showResults(); });
await pg.waitForTimeout(1200); await shot('6-result');
await pg.click('#btnRetry'); await pg.waitForFunction(() => SK.screen === 'race', null, { timeout: 120000 });
await pg.keyboard.press('KeyP');
const paused = await pg.evaluate(() => SK.game.state);
await pg.click('#btnQuit'); await pg.waitForTimeout(500);
const screen = await pg.evaluate(() => SK.screen);
console.log('paused', paused, 'screen', screen);
console.log('ERRS', JSON.stringify(errs));
await b.close();
const ok = info.lap >= 4 && paused === 'paused' && screen === 'title' && errs.length === 0;
console.log(ok ? 'PASS' : 'FAIL'); process.exit(ok ? 0 : 1);
