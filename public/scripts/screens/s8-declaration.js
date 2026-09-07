import { getState, updateState, markScreenCompleted, setLastScreen } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar } from '../ui.js';

const SENTENCE_STARTERS = [
  '전쟁에서 가장 큰 피해를 입는 사람은',
  '내가 만약 그 시대에 살았다면',
  '다른 사람의 입장을 생각해 본 뒤 깨달은 것은',
  '평화를 지키기 위해 내가 할 수 있는 일은'
];

export function render(app) {
  setLastScreen('#/declaration');
  const state = getState();
  const saved = state.declaration || {};
  const nickname = state.nickname || '익명의 시민';

  app.innerHTML = `
    <div class="screen" id="screen-declaration">
      <h1 class="screen-title">평화 선언문</h1>
      <p class="screen-subtitle">3차시 — 나의 다짐을 적어 봅시다</p>

      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-6);">
        아래 문장을 완성하여 나만의 평화 선언문을 만들어 주세요.
        네 문장을 모두 채우면 선언문 카드가 만들어집니다.
      </p>

      <div id="sentence-inputs" style="margin-bottom:var(--space-6);"></div>

      <div id="declaration-preview" style="display:none;margin-bottom:var(--space-6);"></div>

      <div style="text-align:center;margin-top:var(--space-4);">
        <button class="btn btn--primary" id="btn-show-card" disabled>선언문 카드 보기</button>
      </div>

      <div id="declaration-actions" style="display:none;text-align:center;margin-top:var(--space-4);">
        <button class="btn btn--secondary" id="btn-print" style="margin-right:var(--space-2);">인쇄하기</button>
        <button class="btn btn--primary" id="btn-to-teacher">교사 화면으로 가기</button>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const inputsContainer = document.getElementById('sentence-inputs');
  const previewContainer = document.getElementById('declaration-preview');
  const showCardBtn = document.getElementById('btn-show-card');
  const actionsDiv = document.getElementById('declaration-actions');

  const values = {};

  SENTENCE_STARTERS.forEach((starter, i) => {
    const key = `s${i}`;
    values[key] = saved[key] || '';

    const group = document.createElement('div');
    group.className = 'card';
    group.style.cssText = 'margin-bottom:var(--space-3);padding:var(--space-3);';
    group.innerHTML = `
      <label for="decl-${key}" style="font-weight:600;font-size:var(--font-size-sm);display:block;margin-bottom:var(--space-2);">
        ${i + 1}. ${starter}
      </label>
      <input class="input-field" id="decl-${key}" type="text" maxlength="80"
        value="${escapeAttr(values[key])}"
        placeholder="문장을 완성해 주세요."
        aria-label="${starter} 문장 완성">
    `;
    inputsContainer.appendChild(group);

    const input = group.querySelector(`#decl-${key}`);
    input.addEventListener('input', () => {
      values[key] = input.value;
      updateState(s => {
        if (!s.declaration) s.declaration = {};
        s.declaration[key] = input.value;
      });
      updateShowBtn();
    });
  });

  function updateShowBtn() {
    const allFilled = SENTENCE_STARTERS.every((_, i) => values[`s${i}`]?.trim().length > 0);
    showCardBtn.disabled = !allFilled;
  }

  updateShowBtn();

  showCardBtn.addEventListener('click', () => {
    showCardBtn.style.display = 'none';
    actionsDiv.style.display = '';
    previewContainer.style.display = '';
    renderCard();
    markScreenCompleted('s8');
  });

  function renderCard() {
    const sentences = SENTENCE_STARTERS.map((starter, i) => {
      const ending = values[`s${i}`]?.trim() || '';
      return `${starter} ${ending}`;
    });

    previewContainer.innerHTML = `
      <div class="declaration-card" id="print-declaration">
        <div style="text-align:center;margin-bottom:var(--space-4);">
          <svg width="60" height="40" viewBox="0 0 60 40" role="img" aria-label="올리브 가지" style="display:block;margin:0 auto var(--space-2);">
            <path d="M30 35 Q20 20 10 15" stroke="var(--olive)" stroke-width="2" fill="none"/>
            <ellipse cx="12" cy="13" rx="6" ry="4" fill="var(--olive-light)" transform="rotate(-30 12 13)"/>
            <ellipse cx="18" cy="18" rx="5" ry="3.5" fill="var(--olive-light)" transform="rotate(-20 18 18)"/>
            <path d="M30 35 Q40 20 50 15" stroke="var(--olive)" stroke-width="2" fill="none"/>
            <ellipse cx="48" cy="13" rx="6" ry="4" fill="var(--olive-light)" transform="rotate(30 48 13)"/>
            <ellipse cx="42" cy="18" rx="5" ry="3.5" fill="var(--olive-light)" transform="rotate(20 42 18)"/>
          </svg>
          <h2 style="font-size:var(--font-size-lg);color:var(--olive);margin:0;">평화 선언문</h2>
        </div>
        ${sentences.map(s => `<p style="margin-bottom:var(--space-3);line-height:1.8;">${escapeHtml(s)}</p>`).join('')}
        <p style="text-align:right;margin-top:var(--space-4);color:var(--ink-500);font-style:italic;">
          — ${escapeHtml(nickname)}
        </p>
      </div>
    `;
  }

  document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-to-teacher').addEventListener('click', () => {
    navigate('#/teacher');
  });

  if (saved.s0 && saved.s1 && saved.s2 && saved.s3) {
    showCardBtn.click();
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
