// superstar-kart.html의 모듈 스크립트를 뽑아 node --check로 문법을 검사한다
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import path from 'node:path'; import os from 'node:os';
const html = fs.readFileSync(new URL('../superstar-kart.html', import.meta.url), 'utf8');
const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!m) { console.error('module script를 찾지 못했습니다'); process.exit(1); }
const tmp = path.join(os.tmpdir(), 'superstar-kart-check.mjs'); fs.writeFileSync(tmp, m[1]);
execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' });
console.log('SYNTAX_OK');
