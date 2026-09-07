import { nicknames } from '../../data/nicknames.js';
import { initState, hasState, loadState, resetState } from '../state.js';
import { navigate } from '../router.js';
import { showModal, createPauseButton, removePauseButton } from '../ui.js';

function agoraSvg() {
  return `<svg viewBox="0 0 400 180" aria-hidden="true" style="width:100%;max-width:400px;margin:0 auto;display:block;opacity:0.15;">
    <title>아고라 기둥 실루엣</title>
    <rect x="30" y="40" width="12" height="110" rx="2" fill="var(--ink-900)"/>
    <rect x="80" y="40" width="12" height="110" rx="2" fill="var(--ink-900)"/>
    <rect x="130" y="40" width="12" height="110" rx="2" fill="var(--ink-900)"/>
    <rect x="180" y="40" width="12" height="110" rx="2" fill="var(--ink-900)"/>
    <rect x="230" y="40" width="12" height="110" rx="2" fill="var(--ink-900)"/>
    <rect x="280" y="40" width="12" height="110" rx="2" fill="var(--ink-900)"/>
    <rect x="330" y="40" width="12" height="110" rx="2" fill="var(--ink-900)"/>
    <rect x="20" y="30" width="332" height="14" rx="3" fill="var(--ink-900)"/>
    <rect x="20" y="148" width="332" height="8" rx="2" fill="var(--ink-900)"/>
    <polygon points="186,4 20,30 352,30" fill="var(--ink-900)"/>
  </svg>`;
}

export function render(app) {
  const state = loadState();
  const hasExisting = hasState() && state && state.nickname;

  app.innerHTML = `
    <div class="screen" id="screen-intro" style="text-align:center;">
      ${agoraSvg()}
      <div class="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#55BFC4] shadow-sm">
        <i data-lucide="sparkles"></i> 역사 탐구·가상 의사결정
      </div>
      <h1 class="screen-title" style="margin-top:var(--space-6);">아고라의 딜레마</h1>
      <p class="screen-subtitle" style="margin:var(--space-2) auto var(--space-6);">너의 한 표가 폴리스의 운명을 바꾼다</p>

      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin:0 auto var(--space-2);max-width:var(--max-width);">
        기원전 연도는 숫자가 클수록 더 옛날입니다.
      </p>

      <div id="nickname-section" style="${hasExisting ? 'display:none;' : ''}">
        <p style="margin:0 auto var(--space-4);max-width:var(--max-width);">
          고대 그리스풍 별명을 골라 주세요.
        </p>
        <div class="nickname-grid" id="nickname-grid" role="radiogroup" aria-label="별명 선택"></div>
      </div>

      <div id="resume-section" style="${hasExisting ? '' : 'display:none;'}margin-top:var(--space-6);">
        <p style="margin:0 auto var(--space-4);max-width:var(--max-width);">
          ${hasExisting ? `<strong>${state.nickname}</strong>(으)로 진행 중인 기록이 있습니다.` : ''}
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);align-items:center;">
          <button class="btn btn--primary" id="btn-resume"><i data-lucide="play"></i> 내 기록 이어하기</button>
          <button class="btn btn--secondary btn--sm" id="btn-new"><i data-lucide="rotate-ccw"></i> 새로 시작하기</button>
        </div>
      </div>

      <div style="margin-top:var(--space-8);">
        <a href="#/teacher" style="font-size:var(--font-size-sm);color:var(--ink-500);"><i data-lucide="graduation-cap"></i> 교사용 화면</a>
      </div>

      <div class="privacy-notice">
        이 앱은 어떤 개인정보도 수집·전송하지 않습니다.<br>
        모든 기록은 사용 중인 기기에만 저장됩니다.
      </div>
    </div>
  `;

  const grid = document.getElementById('nickname-grid');
  nicknames.forEach(name => {
    const card = document.createElement('button');
    card.className = 'card card--clickable';
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', 'false');
    card.style.cssText = 'text-align:center;font-size:var(--font-size-sm);padding:var(--space-3);';
    card.textContent = name;
    card.addEventListener('click', () => {
      selectNickname(name);
    });
    grid.appendChild(card);
  });

  const resumeBtn = document.getElementById('btn-resume');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      createPauseButton();
      const last = state.progress.lastScreen;
      navigate(last || '#/checkin');
    });
  }

  const newBtn = document.getElementById('btn-new');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      showModal({
        title: '새로 시작할까요?',
        body: '<p>지금까지의 기록이 모두 지워집니다.</p>',
        actions: [
          { label: '취소', className: 'btn--ghost' },
          {
            label: '새로 시작',
            className: 'btn--danger',
            onClick: () => {
              resetState();
              removePauseButton();
              render(app);
            }
          }
        ]
      });
    });
  }
}

function selectNickname(name) {
  initState(name);
  createPauseButton();
  navigate('#/checkin');
}
