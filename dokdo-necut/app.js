/* =========================================================================
 * 독도네컷 — 앱 로직 (전부 클라이언트 사이드 · 서버 전송 없음)
 * ========================================================================= */
'use strict';

const THEMES = [
  { id: 'ocean',  name: '독도 바다', bg: '#0b3b63', frame: '#0b3b63', accent: '#f6c445', text: '#ffffff' },
  { id: 'sunset', name: '독도 일출', bg: '#7a2e12', frame: '#7a2e12', accent: '#ffd25a', text: '#fff5e6' },
  { id: 'hanji',  name: '한지 크림', bg: '#f3ead5', frame: '#e9dcc0', accent: '#cd2e3a', text: '#3a2e18' },
  { id: 'taegeuk',name: '태극 화이트', bg: '#ffffff', frame: '#f1f3f7', accent: '#0047a0', text: '#12233a' },
  { id: 'forest', name: '독도 초록', bg: '#183f2c', frame: '#183f2c', accent: '#ffd25a', text: '#eafff1' },
];

const STYLES = [
  { id: '3d',     name: '3D 실사', desc: '입체 음영으로 사실적인 독도' },
  { id: 'anime',  name: '애니메이션', desc: '셀 채색 만화 스타일' },
  { id: 'sketch', name: '스케치', desc: '손그림 라인아트 감성' },
];

const GOODS = [
  { id: 'phone',   name: '폰케이스', emoji: '📱' },
  { id: 'tote',    name: '에코백',   emoji: '👜' },
  { id: 'mug',     name: '머그컵',   emoji: '☕' },
  { id: 'sticker', name: '스티커',   emoji: '✨' },
  { id: 'keyring', name: '키링',     emoji: '🔑' },
  { id: 'card',    name: '포토카드', emoji: '🪪' },
];

const SHOT_COUNT = 4;
const APP_URL = location.origin + location.pathname;

const State = {
  friends: ['', ''],
  figureId: null,
  style: '3d',
  theme: 'ocean',
  goods: 'phone',
  shots: [],          // 필터 적용된 dataURL 배열
  _imgCache: {},
};

/* ---------- 유틸 ---------- */
function $(id) { return document.getElementById(id); }
function svgToImage(svg) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function dokdoDay() {
  const now = new Date();
  let y = now.getFullYear();
  if (now.getMonth() > 9 || (now.getMonth() === 9 && now.getDate() > 25)) y += 1;
  return `${y}.10.25`;
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200);
}
function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, r = w / h;
  let sw, sh, sx, sy;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* =========================================================================
 * 화면 전환
 * ========================================================================= */
const STEP_SCREENS = ['names', 'figure', 'style', 'capture', 'result'];
const App = {
  go(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('s-' + name).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const idx = STEP_SCREENS.indexOf(name);
    if (idx >= 0) this.renderSteps(idx);
    if (name === 'figure') this.renderFigures();
    if (name === 'style') this.renderStyles();
    if (name === 'capture') this.initCamera();
    else this.stopCamera();
    if (name === 'names') this.renderFriends();
    if (name === 'result') this.compose();
  },

  renderSteps(active) {
    document.querySelectorAll('.steps').forEach(box => {
      box.innerHTML = STEP_SCREENS.map((_, i) => `<span class="dot ${i <= active ? 'on' : ''}"></span>`).join('');
    });
  },

  /* ---------- 친구 이름 ---------- */
  renderFriends() {
    const box = $('friendList');
    box.innerHTML = State.friends.map((v, i) => `
      <div class="friend-row">
        <input type="text" maxlength="8" placeholder="친구 ${i + 1} 이름" value="${v.replace(/"/g, '&quot;')}"
               oninput="App.setFriend(${i}, this.value)">
        ${State.friends.length > 1 ? `<button class="icon-btn" onclick="App.removeFriend(${i})">×</button>` : ''}
      </div>`).join('');
  },
  setFriend(i, v) { State.friends[i] = v; },
  addFriend() { if (State.friends.length < 6) { State.friends.push(''); this.renderFriends(); } else toast('최대 6명까지 가능해요'); },
  removeFriend(i) { State.friends.splice(i, 1); this.renderFriends(); },

  /* ---------- 역사 인물 ---------- */
  renderFigures() {
    const box = $('figureGrid');
    box.innerHTML = FIGURES.map(f => `
      <div class="pick ${State.figureId === f.id ? 'sel' : ''}" onclick="App.pickFigure('${f.id}')">
        <span class="check">✓</span>
        <div class="fig-thumb">${f.svg()}</div>
        <h3>${f.emoji} ${f.name}</h3>
        <div class="role">${f.role}</div>
        <div class="era">${f.era}</div>
        <div class="fact">${f.fact}</div>
        <div class="costume">👕 ${f.costume}</div>
      </div>`).join('');
    $('figNext').disabled = !State.figureId;
  },
  pickFigure(id) { State.figureId = id; this.renderFigures(); },

  /* ---------- 스타일 & 테마 ---------- */
  renderStyles() {
    $('styleGrid').innerHTML = STYLES.map(s => `
      <div class="pick ${State.style === s.id ? 'sel' : ''}" onclick="App.pickStyle('${s.id}')">
        <span class="check">✓</span>
        <div class="style-preview">${dokdoScene(s.id)}</div>
        <h3>${s.name}</h3><div class="era">${s.desc}</div>
      </div>`).join('');
    $('themeGrid').innerHTML = THEMES.map(t => `
      <div class="pick ${State.theme === t.id ? 'sel' : ''}" onclick="App.pickTheme('${t.id}')">
        <span class="check">✓</span>
        <div class="swatch" style="background:${t.bg}; box-shadow:inset 0 0 0 4px ${t.accent}"></div>
        <h3 style="font-size:15px">${t.name}</h3>
      </div>`).join('');
  },
  pickStyle(id) { State.style = id; this.renderStyles(); },
  pickTheme(id) { State.theme = id; this.renderStyles(); },

  /* =====================================================================
   * 카메라 & 촬영
   * ===================================================================== */
  _stream: null,
  async initCamera() {
    this.renderShots();
    const note = $('camNote');
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false,
      });
      $('video').srcObject = this._stream;
      note.textContent = '카메라가 준비됐어요. 촬영 시작을 눌러주세요!';
      $('shootBtn').disabled = false;
    } catch (e) {
      note.innerHTML = '📷 카메라를 사용할 수 없어요. <b>사진 올리기</b>로 4장을 선택해도 완성돼요!';
      $('shootBtn').disabled = true;
    }
  },
  stopCamera() {
    if (this._stream) { this._stream.getTracks().forEach(t => t.stop()); this._stream = null; }
  },
  renderShots() {
    $('shots').innerHTML = Array.from({ length: SHOT_COUNT }, (_, i) => {
      const s = State.shots[i];
      return `<div class="shot ${s ? 'done' : ''}">${s ? `<img src="${s}">` : (i + 1)}</div>`;
    }).join('');
  },

  async startShoot() {
    State.shots = [];
    $('shootBtn').disabled = true; $('uploadBtn').disabled = true;
    for (let i = 0; i < SHOT_COUNT; i++) {
      await this.countdown(5);
      this.capture();
      this.renderShots();
      await new Promise(r => setTimeout(r, 700));
    }
    $('uploadBtn').disabled = false;
    $('camNote').textContent = '완성! 결과 화면으로 이동해요…';
    setTimeout(() => this.go('result'), 600);
  },
  countdown(sec) {
    return new Promise(res => {
      const el = $('count'); el.style.display = 'flex';
      let n = sec;
      el.textContent = n;
      const iv = setInterval(() => {
        n--;
        if (n <= 0) { clearInterval(iv); el.style.display = 'none'; res(); }
        else { el.textContent = n; }
      }, 1000);
    });
  },
  capture() {
    const v = $('video');
    const c = document.createElement('canvas');
    c.width = 640; c.height = 480;
    const ctx = c.getContext('2d');
    ctx.save(); ctx.translate(c.width, 0); ctx.scale(-1, 1); // 거울 반전 보정
    drawCover(ctx, v, 0, 0, c.width, c.height);
    ctx.restore();
    applyFilter(c, State.style);
    State.shots.push(c.toDataURL('image/jpeg', 0.92));
    // 플래시 효과
    const f = $('flash'); f.style.transition = 'none'; f.style.opacity = '.9';
    requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = '0'; });
  },

  /* =====================================================================
   * 결과 합성
   * ===================================================================== */
  async compose() {
    const fig = FIGURES.find(f => f.id === State.figureId) || FIGURES[0];
    $('genNote').innerHTML = `<span class="spinner"></span> ${STYLES.find(s => s.id === State.style).name} 스타일로 이미지를 생성하고 있어요…`;
    const theme = THEMES.find(t => t.id === State.theme);
    const cv = $('resultCanvas'); const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;

    // 배경
    ctx.fillStyle = theme.frame; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(0,0,0,.10)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // 상단 타이틀
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.accent;
    ctx.font = '900 84px Pretendard, sans-serif';
    ctx.fillText('독도네컷', W / 2, 120);
    ctx.fillStyle = theme.text;
    ctx.font = '700 34px Pretendard, sans-serif';
    ctx.fillText(`독도의 날 ${dokdoDay()}`, W / 2, 168);

    // 사진 4컷 (2x2)
    const gx = 60, gy = 210, gw = W - 120, gh = 760, gap = 22;
    const cw = (gw - gap) / 2, ch = (gh - gap) / 2;
    const imgs = await Promise.all(State.shots.map(s => loadImage(s)));
    for (let i = 0; i < SHOT_COUNT; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = gx + col * (cw + gap), y = gy + row * (ch + gap);
      ctx.save();
      roundRect(ctx, x, y, cw, ch, 20); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.save(); roundRect(ctx, x + 6, y + 6, cw - 12, ch - 12, 16); ctx.clip();
      if (imgs[i]) drawCover(ctx, imgs[i], x + 6, y + 6, cw - 12, ch - 12);
      else { ctx.fillStyle = '#dbe7f2'; ctx.fillRect(x, y, cw, ch); }
      ctx.restore();
      // 코너 라벨
      ctx.fillStyle = theme.accent; roundRect(ctx, x + 14, y + 14, 46, 30, 8); ctx.fill();
      ctx.fillStyle = '#3a2a00'; ctx.font = '900 20px Pretendard'; ctx.textAlign = 'center';
      ctx.fillText('#' + (i + 1), x + 37, y + 35);
      ctx.restore();
    }

    // 하단 독도 배경 씬 + 인물
    const sceneY = gy + gh + 18, sceneH = 250;
    const sceneImg = await svgToImage(dokdoScene(State.style, 'banner'));
    ctx.save();
    roundRect(ctx, gx, sceneY, gw, sceneH, 20); ctx.clip();
    // 배너 비율(1080x300)을 유지하며 폭에 맞춰 그려 독도가 온전히 보이도록
    const bw = gw, bh = bw * (300 / 1080);
    ctx.fillStyle = (State.style === 'sketch') ? '#fbfaf5' : '#1b5c8a';
    ctx.fillRect(gx, sceneY, gw, sceneH);
    ctx.drawImage(sceneImg, gx, sceneY + (sceneH - bh) / 2, bw, bh);
    ctx.restore();
    // '독도' 라벨
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(ctx, gx + gw - 150, sceneY + sceneH - 52, 134, 40, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 22px Pretendard'; ctx.textAlign = 'center';
    ctx.fillText('🇰🇷 독도 獨島', gx + gw - 83, sceneY + sceneH - 25);
    ctx.restore();

    // 인물 클레이 캐릭터 (좌측 하단 오버랩)
    const figImg = await svgToImage(fig.svg());
    const fw = 210, fh = 286;
    ctx.drawImage(figImg, gx + 24, sceneY + sceneH - fh + 30, fw, fh);
    // 인물 이름 말풍선
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    roundRect(ctx, gx + 24 + fw - 20, sceneY + 24, 220, 62, 16); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.font = '800 26px Pretendard'; ctx.fillText(`${fig.emoji} ${fig.name}`, gx + 24 + fw, sceneY + 52);
    ctx.font = '600 16px Pretendard'; ctx.fillStyle = theme.accent;
    ctx.fillText(fig.role, gx + 24 + fw, sceneY + 76);

    // 친구 이름 푸터
    const names = State.friends.map(s => s.trim()).filter(Boolean);
    ctx.textAlign = 'center'; ctx.fillStyle = theme.text;
    ctx.font = '800 32px Pretendard';
    const nameLine = names.length ? '👫 ' + names.join(' · ') : '독도 사랑 친구들';
    ctx.fillText(nameLine, W / 2, sceneY + sceneH + 60);
    ctx.font = '600 22px Pretendard'; ctx.fillStyle = theme.accent;
    ctx.fillText('#독도네컷  #독도의날  #' + fig.name + '과함께', W / 2, sceneY + sceneH + 96);

    $('genNote').textContent = '완성됐어요! 마음에 드는 굿즈로 합성하거나 저장·공유해 보세요.';
    this.renderGoods();
    this.renderQR();
  },

  /* ---------- 굿즈 ---------- */
  renderGoods() {
    $('goodsGrid').innerHTML = GOODS.map(gd => `
      <div class="pick ${State.goods === gd.id ? 'sel' : ''}" style="padding:10px" onclick="App.pickGoods('${gd.id}')">
        <span class="check">✓</span>
        <div style="font-size:34px">${gd.emoji}</div>
        <h3 style="font-size:14px; margin:6px 0 0">${gd.name}</h3>
      </div>`).join('');
    this.drawGoods();
  },
  pickGoods(id) { State.goods = id; this.renderGoods(); },
  drawGoods() {
    const cv = $('goodsCanvas'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#eaf2fb'); bg.addColorStop(1, '#cfe0f2');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const four = $('resultCanvas');
    const gd = State.goods;
    const shadow = () => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20; };

    if (gd === 'phone') {
      shadow(); ctx.fillStyle = '#1b1b1f'; roundRect(ctx, 250, 90, 300, 620, 46); ctx.fill(); ctx.restore();
      ctx.save(); roundRect(ctx, 266, 106, 268, 588, 34); ctx.clip(); drawCover(ctx, four, 266, 106, 268, 588); ctx.restore();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(300, 150, 16, 0, 7); ctx.fill();
    } else if (gd === 'tote') {
      shadow(); ctx.fillStyle = '#f3ead5'; roundRect(ctx, 200, 200, 400, 440, 12); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#c9b78e'; ctx.lineWidth = 16; ctx.beginPath();
      ctx.moveTo(280, 205); ctx.quadraticCurveTo(320, 90, 400, 90); ctx.quadraticCurveTo(480, 90, 520, 205); ctx.stroke();
      ctx.save(); roundRect(ctx, 268, 270, 264, 320, 10); ctx.clip(); drawCover(ctx, four, 268, 270, 264, 320); ctx.restore();
    } else if (gd === 'mug') {
      shadow(); ctx.fillStyle = '#fff'; roundRect(ctx, 230, 240, 300, 320, 26); ctx.fill(); ctx.restore();
      ctx.lineWidth = 26; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(560, 400, 70, -1.2, 1.2); ctx.stroke();
      ctx.save(); roundRect(ctx, 262, 285, 236, 230, 14); ctx.clip(); drawCover(ctx, four, 262, 285, 236, 230); ctx.restore();
    } else if (gd === 'sticker') {
      shadow(); ctx.fillStyle = '#fff'; roundRect(ctx, 210, 130, 380, 540, 34); ctx.fill(); ctx.restore();
      ctx.save(); roundRect(ctx, 232, 152, 336, 496, 24); ctx.clip(); drawCover(ctx, four, 232, 152, 336, 496); ctx.restore();
      ctx.setLineDash([14, 12]); ctx.lineWidth = 5; ctx.strokeStyle = '#9fb6cc'; roundRect(ctx, 210, 130, 380, 540, 34); ctx.stroke(); ctx.setLineDash([]);
    } else if (gd === 'keyring') {
      shadow(); ctx.fillStyle = '#fff'; roundRect(ctx, 270, 220, 260, 380, 26); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#b0b0b8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(400, 190, 34, 0, 7); ctx.stroke();
      ctx.save(); roundRect(ctx, 292, 268, 216, 310, 16); ctx.clip(); drawCover(ctx, four, 292, 268, 216, 310); ctx.restore();
    } else { // card
      shadow(); ctx.fillStyle = '#fff'; roundRect(ctx, 240, 150, 320, 500, 20); ctx.fill(); ctx.restore();
      ctx.save(); roundRect(ctx, 258, 168, 284, 464, 14); ctx.clip(); drawCover(ctx, four, 258, 168, 284, 464); ctx.restore();
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#12233a'; ctx.font = '800 30px Pretendard';
    ctx.fillText('나만의 독도 굿즈 · 독도네컷', W / 2, 760);
  },

  /* ---------- QR ---------- */
  renderQR() {
    const box = $('qr'); box.innerHTML = '';
    try { new QRCode(box, { text: APP_URL, width: 150, height: 150, colorDark: '#0b2a4a', colorLight: '#ffffff' }); }
    catch (e) { box.textContent = 'QR 생성 불가'; }
  },

  /* ---------- 저장 · 공유 ---------- */
  _fname(suffix) { return `독도네컷_${dokdoDay().replace(/\./g, '')}_${suffix}.png`; },
  saveCanvas(canvas, name) {
    canvas.toBlob(b => {
      const url = URL.createObjectURL(b);
      const a = document.createElement('a'); a.href = url; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('이미지를 저장했어요 💾');
    }, 'image/png');
  },
  download() { this.saveCanvas($('resultCanvas'), this._fname('4cut')); },
  downloadGoods() { this.saveCanvas($('goodsCanvas'), this._fname(State.goods)); },
  downloadQR() {
    const c = $('qr').querySelector('canvas');
    if (c) this.saveCanvas(c, this._fname('QR'));
    else toast('QR을 준비 중이에요');
  },
  async share() {
    const canvas = $('resultCanvas');
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], this._fname('4cut'), { type: 'image/png' });
    const data = { title: '독도네컷', text: '독도의 날 기념 독도네컷! 📸🇰🇷 #독도네컷', files: [file] };
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share(data); } catch (e) {}
    } else if (navigator.share) {
      try { await navigator.share({ title: data.title, text: data.text, url: APP_URL }); } catch (e) {}
    } else {
      this.download(); toast('이미지를 저장한 뒤 원하는 앱에 공유하세요');
    }
  },
  sns(kind) {
    const text = encodeURIComponent('독도의 날 기념 독도네컷! 📸🇰🇷 #독도네컷 #독도의날');
    const u = encodeURIComponent(APP_URL);
    const map = {
      x: `https://twitter.com/intent/tweet?text=${text}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${text}`,
      threads: `https://www.threads.net/intent/post?text=${text}%20${u}`,
    };
    this.download();
    toast('이미지를 저장했어요! 열린 창에 첨부해 올려보세요');
    window.open(map[kind], '_blank', 'noopener');
  },

  retake() { State.shots = []; this.go('capture'); },
  reset() { State.shots = []; State.figureId = null; this.go('intro'); },
};

/* =========================================================================
 * 이미지 필터 (스타일 표현)
 * ========================================================================= */
function applyFilter(canvas, style) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const src = ctx.getImageData(0, 0, W, H);
  const d = src.data;

  if (style === '3d') {
    // 채도·대비 강화 + 따뜻한 톤 + 비네트 (실사감)
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const avg = (r + g + b) / 3;
      r = avg + (r - avg) * 1.28; g = avg + (g - avg) * 1.22; b = avg + (b - avg) * 1.28;
      r = (r - 128) * 1.12 + 128 + 6; g = (g - 128) * 1.12 + 128 + 2; b = (b - 128) * 1.12 + 128 - 4;
      d[i] = clamp(r); d[i + 1] = clamp(g); d[i + 2] = clamp(b);
    }
    ctx.putImageData(src, 0, 0);
    vignette(ctx, W, H, 0.35);
    return;
  }

  if (style === 'anime') {
    const edges = sobel(d, W, H);
    const levels = 5, step = 255 / (levels - 1);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const avg = (r + g + b) / 3;                       // 채도 부스트
      r = avg + (r - avg) * 1.5; g = avg + (g - avg) * 1.45; b = avg + (b - avg) * 1.5;
      r = Math.round(clamp(r) / step) * step;            // 포스터화
      g = Math.round(clamp(g) / step) * step;
      b = Math.round(clamp(b) / step) * step;
      const e = edges[p] > 110 ? 0.25 : 1;               // 외곽선 어둡게
      d[i] = clamp(r * e); d[i + 1] = clamp(g * e); d[i + 2] = clamp(b * e);
    }
    ctx.putImageData(src, 0, 0);
    return;
  }

  // sketch: 연필 라인아트 (흰 종이 + 어두운 외곽)
  const edges = sobel(d, W, H);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const gray = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    const e = edges[p];
    let v = 255 - e * 1.4;                 // 강한 엣지 → 어두운 선
    v = v * 0.72 + gray * 0.28;            // 옅은 명암 유지
    v = clamp((v - 128) * 1.15 + 132);     // 대비
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(src, 0, 0);
}

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
function vignette(ctx, W, H, strength) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function sobel(d, W, H) {
  const gray = new Float32Array(W * H);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) gray[p] = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
  const out = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      const gx = -gray[p - W - 1] - 2 * gray[p - 1] - gray[p + W - 1] + gray[p - W + 1] + 2 * gray[p + 1] + gray[p + W + 1];
      const gy = -gray[p - W - 1] - 2 * gray[p - W] - gray[p - W + 1] + gray[p + W - 1] + 2 * gray[p + W] + gray[p + W + 1];
      out[p] = Math.min(255, Math.hypot(gx, gy));
    }
  }
  return out;
}

/* =========================================================================
 * 초기화
 * ========================================================================= */
window.addEventListener('DOMContentLoaded', () => {
  App.renderFriends();
  // 업로드 대체 경로
  $('fileInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).slice(0, SHOT_COUNT);
    if (!files.length) return;
    State.shots = [];
    for (const file of files) {
      const img = await loadImage(URL.createObjectURL(file));
      const c = document.createElement('canvas'); c.width = 640; c.height = 480;
      const ctx = c.getContext('2d'); drawCover(ctx, img, 0, 0, 640, 480);
      applyFilter(c, State.style);
      State.shots.push(c.toDataURL('image/jpeg', 0.92));
    }
    // 4장 미만이면 마지막 컷 복제
    while (State.shots.length < SHOT_COUNT) State.shots.push(State.shots[State.shots.length - 1]);
    App.renderShots();
    toast(files.length + '장을 불러왔어요!');
    setTimeout(() => App.go('result'), 500);
  });
});
