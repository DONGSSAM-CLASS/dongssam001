import { chromium } from 'playwright';
const D='./shots/';
const URL=(process.env.BASE_URL || 'http://127.0.0.1:8080') + '/index.html';
const errs=[];
const b = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined});
const p = await b.newPage({viewport:{width:1280,height:900}});
p.on('console', m => { if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+': '+m.text()); });
p.on('pageerror', e => errs.push('pageerror: '+e.message));
p.on('requestfailed', r => errs.push('reqfail: '+r.url()+' '+r.failure()?.errorText));
await p.goto(URL, {waitUntil:'networkidle'});
await p.waitForTimeout(1200);

const r = await p.evaluate(() => {
  const out={};
  out.cards = document.querySelectorAll('#project-grid article').length;
  out.chips = document.querySelectorAll('#filters .fchip').length;
  out.chipLabels = [...document.querySelectorAll('#filters .fchip')].map(b=>b.textContent);
  out.svgIcons = document.querySelectorAll('svg.lucide').length || document.querySelectorAll('main svg').length;
  out.unrenderedI = document.querySelectorAll('i[data-lucide]').length;
  const btn=document.querySelector('.cbtn-gold');
  const cs=getComputedStyle(btn);
  out.btn={h:btn.getBoundingClientRect().height,bg:cs.backgroundImage.slice(0,40),shadow:cs.boxShadow.slice(0,40)};
  const card=document.querySelector('#project-grid article');
  const ccs=getComputedStyle(card);
  out.card={radius:ccs.borderRadius,bg:ccs.backgroundImage.slice(0,30),shadow:ccs.boxShadow.length};
  out.gridCols=getComputedStyle(document.querySelector('#project-grid')).gridTemplateColumns;
  out.bodyBg=getComputedStyle(document.body).backgroundColor;
  out.font=getComputedStyle(document.body).fontFamily;
  out.mailto=document.querySelector('#mailto-btn').getAttribute('href').slice(0,90);
  out.daisy = !!getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim();
  out.baseContent = getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim();
  out.hscroll = document.documentElement.scrollWidth > window.innerWidth+1;
  return out;
});
console.log(JSON.stringify(r,null,1));

// 필터 동작
await p.click('#filters .fchip[data-cat="역사 게임"]');
await p.waitForTimeout(300);
console.log('filtered cards:', await p.locator('#project-grid article').count());
await p.click('#filters .fchip[data-cat="전체"]');
await p.waitForTimeout(200);

// QR 모달
await p.locator('#project-grid button[data-qr-url]').first().click();
await p.waitForTimeout(500);
const qr = await p.evaluate(()=>{
  const o=document.getElementById('qr-overlay');
  const c=document.querySelector('#qr-target img, #qr-target canvas');
  return {open:o.classList.contains('open'), display:getComputedStyle(o).display,
    opacity:getComputedStyle(o).opacity,
    qrW: c? c.getBoundingClientRect().width:0, title:document.getElementById('qr-title').textContent,
    url:document.getElementById('qr-url').textContent, lock:document.body.classList.contains('noscroll'),
    focus:document.activeElement.id};
});
console.log('QR:', JSON.stringify(qr));
await p.screenshot({path:D+'shot-qr.png'});
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
console.log('closed:', await p.evaluate(()=>({open:document.getElementById('qr-overlay').classList.contains('open'), lock:document.body.classList.contains('noscroll')})));

// 360px
await p.setViewportSize({width:360,height:740});
await p.waitForTimeout(400);
console.log('360 hscroll:', await p.evaluate(()=>document.documentElement.scrollWidth>361), 'sw=',await p.evaluate(()=>document.documentElement.scrollWidth));
await p.screenshot({path:D+'shot-360.png', fullPage:false});
await p.setViewportSize({width:1280,height:900});
await p.evaluate(()=>window.scrollTo(0,0));
await p.waitForTimeout(600);
await p.screenshot({path:D+'shot-hero.png'});
await p.evaluate(()=>document.getElementById('works').scrollIntoView());
await p.waitForTimeout(900);
await p.screenshot({path:D+'shot-works.png'});

console.log('--- CONSOLE ISSUES ---'); console.log(errs.length? errs.join('\n') : 'none');
await b.close();
