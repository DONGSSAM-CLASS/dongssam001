import { chromium } from 'playwright';
const D='./shots/';
const URL=(process.env.BASE_URL || 'http://127.0.0.1:8080') + '/index.html';
const b=await chromium.launch({executablePath: process.env.CHROME_PATH || undefined});
for (const [w,h,tag] of [[360,740,'m360'],[390,844,'m390'],[768,1024,'t768'],[1280,900,'d1280'],[1920,1080,'d1920']]) {
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto(URL,{waitUntil:'networkidle'});
  await p.waitForTimeout(700);
  await p.locator('#project-grid button[data-qr-url]').first().click();
  await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({img:document.querySelector('#qr-target img').offsetWidth,
    fits:document.getElementById('qr-box').scrollHeight<=window.innerHeight+2,
    sw:document.documentElement.scrollWidth}));
  console.log(tag, w+'x'+h, 'QR='+r.img, 'fits='+r.fits, 'sw='+r.sw, 'shortSide60%='+Math.round(Math.min(w,h)*0.6));
  if(tag==='m360'||tag==='d1920') await p.screenshot({path:D+'q-'+tag+'.png'});
  await p.close();
}
await b.close();
