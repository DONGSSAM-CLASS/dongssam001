import { getState, updateState, markScreenCompleted, setLastScreen } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar, setupTermTooltips, showToast } from '../ui.js';

const AXES = ['의사결정 주체', '참정권의 범위', '군사력의 기반', '경제 기반', '약점'];

const CHIPS_DATA = [
  { id: 'c1', text: '시민 전체가 민회에서 투표', answer: 'athens' },
  { id: 'c2', text: '두 왕과 원로, 감독관이 결정', answer: 'sparta' },
  { id: 'c3', text: '성인 남성 시민만 참여 가능', answer: 'athens' },
  { id: 'c4', text: '소수 시민이 다수를 지배', answer: 'sparta' },
  { id: 'c5', text: '삼단노선 중심의 해군', answer: 'athens' },
  { id: 'c6', text: '어릴 때부터 훈련받은 보병', answer: 'sparta' },
  { id: 'c7', text: '동맹금과 해상 무역', answer: 'athens' },
  { id: 'c8', text: '헤일로타이가 농사를 지음', answer: 'sparta' },
  { id: 'c9', text: '의견이 갈리면 결정이 느려짐', answer: 'athens' },
  { id: 'c10', text: '지배받는 사람들이 반란을 일으킬 위험', answer: 'sparta' }
];

const FEEDBACK = {
  c1: '아테네에서는 시민들이 직접 모여 손을 들어 결정했습니다.',
  c2: '스파르타에서는 두 왕, 원로들, 감독관이 중요한 결정을 내렸습니다.',
  c3: '아테네의 민주정은 성인 남성 시민에게만 열려 있었습니다. 여성, 거류외인, 노예는 참여할 수 없었습니다.',
  c4: '소수의 스파르타 시민이 다수의 헤일로타이를 지배하는 구조였습니다.',
  c5: '아테네의 힘은 삼단노선 함대에서 나왔습니다. 가난한 시민도 노를 저으며 참여했고, 이것이 민주정의 기반이 되었습니다.',
  c6: '스파르타 시민은 어릴 때부터 전사가 되기 위한 훈련을 받았습니다.',
  c7: '아테네는 델로스 동맹의 동맹금과 바다를 통한 무역으로 부를 쌓았습니다.',
  c8: '스파르타 시민이 전쟁에 집중할 수 있었던 것은 헤일로타이가 농사를 맡았기 때문입니다.',
  c9: '많은 사람이 토론하고 투표하므로, 빠른 결정이 어려울 수 있습니다.',
  c10: '소수가 다수를 지배하는 구조는 늘 반란의 위험을 안고 있었습니다.'
};

export function render(app) {
  setLastScreen('#/compare');
  const state = getState();
  const saved = state.compare || { placements: {}, openAnswer: '' };

  app.innerHTML = `
    <div class="screen" id="screen-compare">
      <h1 class="screen-title">두 <span class="term" data-term="폴리스" tabindex="0" role="button">폴리스</span> 비교</h1>
      <p class="screen-subtitle">1차시 — <span class="term" data-term="아테네" tabindex="0" role="button">아테네</span>와 <span class="term" data-term="스파르타" tabindex="0" role="button">스파르타</span>의 다른 점</p>

      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-4);">
        아래 특징 카드를 아테네 또는 스파르타 쪽으로 배치해 주세요.
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4);">
        <div class="card card--athens" style="text-align:center;padding:var(--space-3);">
          <strong style="color:var(--athens);">아테네 (민주정)</strong>
          <div id="drop-athens" class="drop-zone" style="min-height:40px;margin-top:var(--space-2);"></div>
        </div>
        <div class="card card--sparta" style="text-align:center;padding:var(--space-3);">
          <strong style="color:var(--sparta);">스파르타 (과두정)</strong>
          <div id="drop-sparta" class="drop-zone" style="min-height:40px;margin-top:var(--space-2);"></div>
        </div>
      </div>

      <div id="chip-pool" style="margin-bottom:var(--space-6);"></div>

      <div style="text-align:center;margin-bottom:var(--space-6);">
        <button class="btn btn--primary" id="btn-check" disabled>확인하기</button>
      </div>

      <div id="feedback-area" style="display:none;"></div>

      <div id="open-question" style="display:none;margin-top:var(--space-6);">
        <div class="card">
          <p style="font-weight:600;margin-bottom:var(--space-3);">
            두 체제 중 전쟁을 더 빨리 결정할 수 있는 쪽은 어디이고, 그것이 왜 장점이자 위험인가?
          </p>
          <textarea class="input-field" id="open-answer" rows="3" maxlength="200" placeholder="자유롭게 적어 주세요.">${escapeHtml(saved.openAnswer || '')}</textarea>
          <div style="text-align:right;margin-top:var(--space-3);">
            <button class="btn btn--primary" id="btn-to-decision">의사결정으로 가기</button>
          </div>
        </div>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const placements = { ...saved.placements };
  const chipPool = document.getElementById('chip-pool');
  const dropAthens = document.getElementById('drop-athens');
  const dropSparta = document.getElementById('drop-sparta');
  const checkBtn = document.getElementById('btn-check');
  const feedbackArea = document.getElementById('feedback-area');
  const openQuestion = document.getElementById('open-question');

  function renderChips() {
    chipPool.innerHTML = '';
    dropAthens.innerHTML = '';
    dropSparta.innerHTML = '';

    CHIPS_DATA.forEach(chip => {
      const el = createChipEl(chip);
      const placement = placements[chip.id];
      if (placement === 'athens') {
        dropAthens.appendChild(el);
      } else if (placement === 'sparta') {
        dropSparta.appendChild(el);
      } else {
        chipPool.appendChild(el);
      }
    });

    checkBtn.disabled = Object.keys(placements).length < CHIPS_DATA.length;
  }

  function createChipEl(chip) {
    const el = document.createElement('div');
    el.className = 'chip';
    el.style.cssText = 'margin:var(--space-1);cursor:pointer;display:inline-flex;';
    el.textContent = chip.text;
    el.dataset.chipId = chip.id;
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${chip.text} — 눌러서 배치 변경`);

    el.addEventListener('click', () => {
      cycleChip(chip.id);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cycleChip(chip.id);
      }
    });
    return el;
  }

  function cycleChip(chipId) {
    const current = placements[chipId];
    if (!current) {
      placements[chipId] = 'athens';
    } else if (current === 'athens') {
      placements[chipId] = 'sparta';
    } else {
      delete placements[chipId];
    }
    savePlacements();
    renderChips();
  }

  function savePlacements() {
    updateState(s => {
      s.compare.placements = { ...placements };
    });
  }

  renderChips();

  checkBtn.addEventListener('click', () => {
    feedbackArea.style.display = '';
    feedbackArea.innerHTML = '<h2 style="margin-bottom:var(--space-4);">결과와 해설</h2>';

    CHIPS_DATA.forEach(chip => {
      const userAnswer = placements[chip.id];
      const correct = userAnswer === chip.answer;
      const card = document.createElement('div');
      card.className = `card ${correct ? 'card--olive' : 'card--gold'}`;
      card.style.cssText = 'margin-bottom:var(--space-3);padding:var(--space-3);';
      card.innerHTML = `
        <div style="display:flex;align-items:start;gap:var(--space-2);">
          <span style="font-size:var(--font-size-lg);">${correct ? '○' : '△'}</span>
          <div>
            <p style="font-weight:600;margin-bottom:var(--space-1);">${chip.text}</p>
            <p style="font-size:var(--font-size-sm);color:var(--ink-700);">${FEEDBACK[chip.id]}</p>
            ${!correct ? `<p style="font-size:var(--font-size-sm);color:var(--gold);margin-top:var(--space-1);">→ ${chip.answer === 'athens' ? '아테네' : '스파르타'} 쪽입니다.</p>` : ''}
          </div>
        </div>
      `;
      feedbackArea.appendChild(card);
    });

    openQuestion.style.display = '';
    checkBtn.style.display = 'none';
    feedbackArea.setAttribute('aria-live', 'polite');
  });

  const openAnswerEl = document.getElementById('open-answer');
  openAnswerEl.addEventListener('input', () => {
    updateState(s => {
      s.compare.openAnswer = openAnswerEl.value;
    });
  });

  const toDecisionBtn = document.getElementById('btn-to-decision');
  toDecisionBtn.addEventListener('click', () => {
    markScreenCompleted('s3');
    navigate('#/decision/D1');
  });

  if (saved.openAnswer) {
    checkBtn.click();
  }

  setupTermTooltips(app);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
