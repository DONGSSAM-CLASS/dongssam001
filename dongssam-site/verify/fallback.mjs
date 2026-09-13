import { chromium } from 'playwright';
const D='./shots/';
const URL=(process.env.BASE_URL || 'http://127.0.0.1:8080') + '/index.html';
const b=await chromium.launch({executablePath: process.env.CHROME_PATH || undefined});
const p=await b.newPage({viewport:{width:1100,height:900}});
const errs=[];
p.on('pageerror',e=>errs.push('pageerror: '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('err: '+m.text())});
// 모든 외부 라이브러리 차단 (CDN 로드 실패 시뮬레이션)
await p.route('**/lib/**', r=>r.abort());
await p.goto(URL,{waitUntil:'load'});
await p.waitForTimeout(800);
console.log('cards:', await p.locator('#project-grid article').count());
console.log('links ok:', await p.evaluate(()=>document.querySelector('#project-grid a').href));
await p.locator('#project-grid button[data-qr-url]').first().click();
await p.waitForTimeout(400);
console.log('modal w/o qrcode.js:', await p.evaluate(()=>({open:document.getElementById('qr-overlay').classList.contains('open'),
  url:document.getElementById('qr-url').textContent, frameHidden:document.getElementById('qr-frame').hidden})));
await p.screenshot({path:D+'fb.png'});
await p.click('#qr-copy'); await p.waitForTimeout(200);
console.log('toast w/o libs:', await p.evaluate(()=>document.getElementById('toast').classList.contains('show')));
console.log('--- errors ---'); console.log(errs.length?[...new Set(errs)].filter(e=>!/Failed to load resource|ERR_FAILED/.test(e)).join('\n')||'only resource load failures (expected)':'none');
await b.close();
