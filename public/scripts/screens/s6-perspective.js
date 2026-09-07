import { perspectives } from '../../data/perspectives.js';
import { decisions } from '../../data/decisions.js';
import { getState, updateState, markScreenCompleted, setLastScreen } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar, setupTermTooltips, showToast } from '../ui.js';

export function render(app) {
  setLastScreen('#/perspective');
  const state = getState();
  const saved = state.perspectives || {};
  const decs = state.decisions || {};

  app.innerHTML = `
    <div class="screen" id="screen-perspective">
      <h1 class="screen-title">관점 전환실</h1>
      <p class="screen-subtitle">3차시 — 다른 사람의 눈으로 보기</p>

      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-6);">
        당신이 내린 결정이 다른 처지의 사람에게는 어떤 의미였을지 생각해 봅시다.
        최소 2명 이상의 관점에 답을 써 주세요.
      </p>

      <div id="perspective-cards"></div>

      <div style="text-align:center;margin-top:var(--space-6);">
        <button class="btn btn--primary" id="btn-to-bias" disabled>반편견 점검으로 가기</button>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const container = document.getElementById('perspective-cards');
  const nextBtn = document.getElementById('btn-to-bias');

  function countCompleted() {
    let count = 0;
    perspectives.forEach(p => {
      const answer = saved[p.id];
      if (answer && answer.trim().length > 0) count++;
    });
    return count;
  }

  function updateNextBtn() {
    nextBtn.disabled = countCompleted() < 2;
  }

  perspectives.forEach(perspective => {
    const relatedChoices = perspective.relatedDecisions
      .map(did => {
        const dec = decs[did];
        const node = decisions.find(n => n.id === did);
        if (!dec || !node) return null;
        const chosen = node.options.find(o => o.id === dec.choice);
        return {
          year: node.year,
          label: chosen ? chosen.label : '—'
        };
      })
      .filter(Boolean);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'margin-bottom:var(--space-4);';

    let choicesHtml = '';
    if (relatedChoices.length > 0) {
      choicesHtml = `
        <div style="margin:var(--space-3) 0;padding:var(--space-2);background:var(--stone-100);border-radius:var(--radius);">
          <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-1);">
            <strong>관련된 나의 선택:</strong>
          </p>
          ${relatedChoices.map(c =>
            `<p style="font-size:var(--font-size-sm);color:var(--ink-700);">
              기원전 ${Math.abs(c.year)}년 → ${escapeHtml(c.label)}
            </p>`
          ).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <h3 style="font-size:var(--font-size-base);color:var(--athens);margin-bottom:var(--space-1);">
        ${perspective.name}
      </h3>
      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-2);">
        ${perspective.description}
      </p>
      <p style="font-size:var(--font-size-sm);margin-bottom:var(--space-3);">
        ${perspective.background}
      </p>
      ${choicesHtml}
      <p style="font-weight:600;font-size:var(--font-size-sm);color:var(--olive);margin-bottom:var(--space-2);">
        ${perspective.question}
      </p>
      <textarea class="input-field" id="perspective-${perspective.id}" rows="3" maxlength="200"
        placeholder="이 사람의 입장에서 생각해 보세요."
        aria-label="${perspective.name}의 관점에서 답하기"
      >${escapeHtml(saved[perspective.id] || '')}</textarea>
    `;

    container.appendChild(card);

    const textarea = card.querySelector(`#perspective-${perspective.id}`);
    textarea.addEventListener('input', () => {
      updateState(s => {
        if (!s.perspectives) s.perspectives = {};
        s.perspectives[perspective.id] = textarea.value;
      });
      saved[perspective.id] = textarea.value;
      updateNextBtn();
    });
  });

  updateNextBtn();

  nextBtn.addEventListener('click', () => {
    markScreenCompleted('s6');
    navigate('#/bias');
  });

  setupTermTooltips(app);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
