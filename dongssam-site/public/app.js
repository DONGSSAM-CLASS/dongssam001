
/* ── 자료 목록: 여기에 객체 한 줄만 추가하면 카드·필터·QR이 자동 반영됩니다 ── */


const EMAIL = "dongssam94@gmail.com";
const $ = (s, r) => (r || document).querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const refreshIcons = () => { try { if (window.lucide) lucide.createIcons(); } catch (e) {} };

/* ── 자료실 렌더링 ── */
const grid = $("#project-grid");
const filterBar = $("#filters");
const emptyMsg = $("#empty-msg");
const searchInput = $("#project-search");
const resultMeta = $("#result-meta");
let activeFilter = "전체";
let searchQuery = "";

$("#project-count").textContent = String(PROJECTS.length);
$("#category-count").textContent = String(new Set(PROJECTS.map(p => p.category)).size);
$("#channel-count").textContent = String(document.querySelectorAll("#channels .grid-cards > a").length);

function renderFilters() {
  const cats = ["전체", ...Array.from(new Set(PROJECTS.map(p => p.category)))];
  filterBar.innerHTML = cats.map(c => {
    const count = c === "전체" ? PROJECTS.length : PROJECTS.filter(p => p.category === c).length;
    return '<button type="button" class="fchip" data-cat="' + esc(c) + '" aria-pressed="' + (c === activeFilter) + '">' + esc(c) + '<span>' + count + '</span></button>';
  }).join("");
}
function renderCards() {
  const needle = searchQuery.trim().toLocaleLowerCase("ko-KR");
  const list = PROJECTS.filter(p => (activeFilter === "전체" || p.category === activeFilter) && (!needle || (p.title + " " + p.desc + " " + p.category).toLocaleLowerCase("ko-KR").includes(needle)));
  grid.innerHTML = list.map(p => {
    const index = String(PROJECTS.indexOf(p) + 1).padStart(2, "0");
    return '<article class="project-card"><div class="card-top"><span class="card-icon"><i data-lucide="' + esc(p.icon) + '" aria-hidden="true"></i></span><span class="category-label">' + esc(p.category) + '</span><span class="card-index">' + index + '</span></div><h3><a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.title) + '</a></h3><p>' + esc(p.desc) + '</p><div class="card-actions"><a class="card-open" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(p.title + ' ' + (p.openLabel || '웹앱 열기')) + '">' + esc(p.openLabel || '웹앱 열기') + ' <i data-lucide="arrow-up-right" aria-hidden="true"></i></a><button class="qr-button" type="button" data-qr-url="' + esc(p.url) + '" data-qr-title="' + esc(p.title) + '" aria-label="' + esc(p.title) + ' QR 코드 열기"><i data-lucide="qr-code" aria-hidden="true"></i>QR 공유</button></div></article>';
  }).join("");
  emptyMsg.hidden = list.length > 0;
  resultMeta.innerHTML = '전체 <strong>' + PROJECTS.length + '</strong>개 중 <strong>' + list.length + '</strong>개 자료';
  refreshIcons();
}
function resetFilters() {
  activeFilter = "전체";
  searchQuery = "";
  searchInput.value = "";
  renderFilters();
  renderCards();
}
$("#reset-filters").addEventListener("click", resetFilters);
$("#empty-reset").addEventListener("click", () => { resetFilters(); searchInput.focus(); });

filterBar.addEventListener("click", (e) => {
  const btn = e.target.closest(".fchip");
  if (!btn) return;
  activeFilter = btn.dataset.cat;
  filterBar.querySelectorAll(".fchip").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  renderCards();
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value;
  renderCards();
});

renderFilters();
renderCards();

/* ── QR 모달 ── */
const overlay = $("#qr-overlay");
const qrBox = $("#qr-box");
const qrTarget = $("#qr-target");
const qrFrame = $("#qr-frame");
let lastFocused = null;

function qrSize() {
  const narrow = window.innerWidth <= 520;
  const available = Math.min(820, window.innerWidth - (narrow ? 24 : 40)) - (narrow ? 68 : 100);
  return Math.max(100, Math.min(420, available, window.innerHeight * 0.48));
}

function openQR(title, url) {
  lastFocused = document.activeElement;
  $("#qr-title").textContent = title;
  $("#qr-url").textContent = url;
  qrTarget.innerHTML = "";
  $("#qr-download").disabled = true;
  if (window.QRCode) {
    const s = qrSize();
    const framePad = window.innerWidth <= 520 ? 16 : 22;
    qrFrame.style.maxWidth = s + framePad * 2 + "px";
    try {
      new QRCode(qrTarget, { text: url, width: s, height: s, correctLevel: QRCode.CorrectLevel.M });
    } catch (e) { qrTarget.innerHTML = ""; }
  }
  qrFrame.hidden = !qrTarget.firstChild;
  overlay.hidden = false;
  overlay.classList.add("open");
  document.body.classList.add("noscroll");
  refreshIcons();
  requestAnimationFrame(() => { $("#qr-download").disabled = !$("#qr-target img"); });
  qrBox.scrollTop = 0;
  $("#qr-title").focus({ preventScroll:true });
}

function closeQR() {
  overlay.classList.remove("open");
  overlay.hidden = true;
  document.body.classList.remove("noscroll");
  qrTarget.innerHTML = "";
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-qr-url]");
  if (btn) { openQR(btn.dataset.qrTitle, btn.dataset.qrUrl); }
});
$("#qr-close").addEventListener("click", closeQR);
overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeQR(); });
$("#qr-copy").addEventListener("click", () => copyText($("#qr-url").textContent, "링크가 복사되었습니다"));
$("#qr-download").addEventListener("click", () => {
  const image = $("#qr-target img");
  if (!image || !image.src) { showToast("저장할 QR 이미지를 찾지 못했습니다"); return; }
  const safeTitle = $("#qr-title").textContent.replace(/[\\/:*?"<>|]/g, "-").trim() || "QR-code";
  const link = document.createElement("a");
  link.href = image.src;
  link.download = safeTitle + "-QR.png";
  link.click();
  showToast("QR 이미지 저장을 시작했습니다");
});
$("#qr-print").addEventListener("click", () => window.print());

/* 포커스 트랩 + ESC */
document.addEventListener("keydown", (e) => {
  if (!overlay.classList.contains("open")) return;
  if (e.key === "Escape") { closeQR(); return; }
  if (e.key !== "Tab") return;
  const items = $("#qr-box").querySelectorAll("[tabindex], button, a[href]");
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ── 복사 + 토스트 ── */
const toast = $("#toast");
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function copyText(text, msg) {
  const done = () => showToast(msg);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else { fallbackCopy(text, done); }
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", "");
  ta.style.position = "fixed"; ta.style.left = "-9999px";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { showToast("복사에 실패했습니다"); }
  document.body.removeChild(ta);
}
$("#copy-email").addEventListener("click", () => copyText(EMAIL, "복사되었습니다"));

/* ── 메일 템플릿 ── */
const MAIL_BODY = [
  "안녕하세요, 동쌤(김동은) 선생님.", "",
  "1. 기관/단체명과 담당자 연락처 : ",
  "2. 희망 일정(날짜·시간)과 장소(대면/온라인) : ",
  "3. 대상과 인원(교사/학생, 예상 인원) : ",
  "4. 주제와 요청 배경, 희망 진행 시간 : ",
  "5. 예산 및 기타 조건 : ", "",
  "감사합니다."
].join("\n");
$("#mailto-btn").href = "mailto:" + EMAIL +
  "?subject=" + encodeURIComponent("[협업 요청] 기관명 / 주제") +
  "&body=" + encodeURIComponent(MAIL_BODY);

/* ── 내비 · 스크롤 ── */
const navshell = $("#navshell");
const totop = $("#totop");
const drawer = $("#navdrawer");
const navtoggle = $("#navtoggle");

navtoggle.addEventListener("click", () => {
  const open = !drawer.classList.contains("open");
  drawer.hidden = false;
  drawer.classList.toggle("open", open);
  if (!open) drawer.hidden = true;
  drawer.setAttribute("aria-hidden", String(!open));
  navtoggle.setAttribute("aria-expanded", String(open));
  navtoggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
});
drawer.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    drawer.classList.remove("open");
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    navtoggle.setAttribute("aria-expanded", "false");
    navtoggle.setAttribute("aria-label", "메뉴 열기");
  }
});

document.addEventListener("keydown", (e) => {
  if (!drawer.classList.contains("open")) return;
  if (e.key === "Escape") {
    drawer.classList.remove("open");
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    navtoggle.setAttribute("aria-expanded", "false");
    navtoggle.setAttribute("aria-label", "메뉴 열기");
    navtoggle.focus();
    return;
  }
  if (e.key !== "Tab") return;
  const items = [navtoggle, ...drawer.querySelectorAll("a[href]")];
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

function onScroll() {
  const y = window.scrollY;
  navshell.classList.toggle("scrolled", y > 12);
  totop.classList.toggle("show", y > 520);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
totop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ── 스크롤 페이드인 ── */
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("shown"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("shown"));
}

refreshIcons();
window.addEventListener("load", refreshIcons);

// Close the compact menu when crossing the desktop breakpoint.
window.matchMedia("(min-width: 1051px)").addEventListener("change", e => {
  if (e.matches) {
    drawer.classList.remove("open"); drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true"); navtoggle.setAttribute("aria-expanded", "false");
    navtoggle.setAttribute("aria-label", "메뉴 열기");
  }
});
const primaryLinks = document.querySelectorAll(".desktop-nav a");
if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      primaryLinks.forEach(link => {
        if (link.hash === "#" + entry.target.id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, {rootMargin: "-15% 0px -65% 0px"});
  document.querySelectorAll("#works, #about, #activities, #club, #contact, #hero").forEach(section => navObserver.observe(section));
}
