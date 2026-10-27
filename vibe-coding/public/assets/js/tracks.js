(function () {
  'use strict';
  function all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function read(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function save(k,v) { try { localStorage.setItem(k,v); } catch (_) {} }
  var theme=read('vc.theme')==='paid'?'paid':'free';
  var freeTool=read('vc.freeTool')==='gemini'?'gemini':'canva';
  function progress() {
    var checks=all('[data-free-check^="'+freeTool+':"]');
    var done=checks.filter(function(c){return c.checked;}).length;
    document.getElementById('vcFreeProgress').textContent=(freeTool==='canva'?'Canva AI':'Gemini')+' · '+done+'/7단계 완료'+(done===7?' · 배포까지 마치셨습니다!':'');
    var count=theme==='free'?done:all('.vc-step-check').filter(function(c){return c.checked;}).length;
    document.getElementById('vcProgressBadge').textContent=(theme==='free'?'무료':'유료')+' 실습 '+count+'/7단계';
  }
  function applyTheme(next) {
    theme=next==='paid'?'paid':'free';
    all('[data-theme-panel]').forEach(function(p){p.hidden=p.getAttribute('data-theme-panel')!==theme;});
    all('[data-theme-pick]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-theme-pick')===theme));});
    document.getElementById('vcThemeStatus').textContent=theme==='free'?'무료 도구 실습을 보고 있습니다. 아래에서 Canva AI 또는 Gemini를 선택하세요.':'유료 도구 실습을 보고 있습니다. 아래에서 Codex 또는 Claude Code를 선택하세요.';
    save('vc.theme',theme);progress();
  }
  function applyFreeTool(next) {
    freeTool=next==='gemini'?'gemini':'canva';
    all('[data-free-view]').forEach(function(p){p.hidden=p.getAttribute('data-free-view')!==freeTool;});
    all('[data-free-pick]').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-free-pick')===freeTool));});
    save('vc.freeTool',freeTool);progress();
  }
  all('[data-theme-pick]').forEach(function(b){b.addEventListener('click',function(){applyTheme(b.getAttribute('data-theme-pick'));});});
  all('[data-open-theme]').forEach(function(b){b.addEventListener('click',function(){applyTheme(b.getAttribute('data-open-theme'));});});
  all('[data-free-pick]').forEach(function(b){b.addEventListener('click',function(){applyFreeTool(b.getAttribute('data-free-pick'));});});
  all('[data-free-check]').forEach(function(c){var k='vc.freeSteps.'+c.getAttribute('data-free-check');c.checked=read(k)==='1';c.addEventListener('change',function(){save(k,c.checked?'1':'0');progress();});});
  document.addEventListener('change',function(e){if(e.target.matches('.vc-step-check,.vc-finish-check')){progress();}});
  document.getElementById('vcResetProgress').addEventListener('click',progress);
  document.getElementById('vcFreePrint').addEventListener('click',function(){window.print();});
  var urlInput=document.getElementById('vcFreeUrl');
  urlInput.value=read('vc.freeUrl')||'';
  urlInput.addEventListener('input',function(){save('vc.freeUrl',urlInput.value);urlInput.removeAttribute('aria-invalid');document.getElementById('vcFreeUrlStatus').textContent='';});
  document.getElementById('vcFreeQr').addEventListener('click',function(){
    var status=document.getElementById('vcFreeUrlStatus');
    try {
      var url=new URL(urlInput.value.trim());
      if(url.protocol!=='https:'&&url.protocol!=='http:'){throw new Error('scheme');}
      if(!url.hostname.includes('.')||url.hostname==='localhost'||url.username||url.password){throw new Error('host');}
      urlInput.value=url.href;save('vc.freeUrl',url.href);status.textContent='';urlInput.removeAttribute('aria-invalid');
      var opener=document.getElementById('vcFreeQrOpen');opener.setAttribute('data-qr-url',url.href);opener.click();
    } catch (_) {
      status.textContent='https://로 시작하는 실제 게시 주소나 공유 링크를 넣어 주세요. 내 PC의 파일 주소는 공유할 수 없습니다.';urlInput.setAttribute('aria-invalid','true');urlInput.focus();
    }
  });
  // Keep direct links to the existing paid course useful after introducing themes.
  function followHash() {
    var hash=location.hash;
    if(/^#(?:tool|course|step[1-7]|faq|finish)$/.test(hash)){applyTheme('paid');var el=document.getElementById(hash.slice(1));if(el){el.scrollIntoView();}}
    var match=hash.match(/^#(canva|gemini)-step[1-7]$/);
    if(match){applyTheme('free');applyFreeTool(match[1]);document.getElementById(hash.slice(1)).scrollIntoView();}
  }
  window.addEventListener('hashchange',followHash);
  applyFreeTool(freeTool);applyTheme(theme);followHash();
}());
