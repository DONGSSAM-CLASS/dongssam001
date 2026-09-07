import { getState, updateState, markScreenCompleted, setLastScreen } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar, setupTermTooltips } from '../ui.js';

const BIAS_ITEMS = [
  {
    id: 'b1',
    statement: '나는 아테네 쪽 이야기를 더 많이 들었기 때문에 아테네에 유리하게 판단했을 수 있다.',
    explanation: '우리가 가진 사료 대부분은 아테네 출신 기록이다. 스파르타는 기록을 적게 남겼기 때문에 정보가 한쪽으로 치우칠 수 있다.'
  },
  {
    id: 'b2',
    statement: '나는 "민주주의"라는 말 때문에 아테네를 더 좋게 보았을 수 있다.',
    explanation: '오늘날의 민주주의와 아테네의 민주정은 다르다. 아테네에서도 여성, 거류외인, 노예는 참여할 수 없었다.'
  },
  {
    id: 'b3',
    statement: '나는 전쟁에서 이긴 쪽이 옳다고 느꼈을 수 있다.',
    explanation: '전쟁의 승패와 도덕적 옳고 그름은 별개이다. 이긴 쪽도 잘못된 결정을 했을 수 있다.'
  },
  {
    id: 'b4',
    statement: '나는 강한 감정을 느낀 순간에 더 극단적인 선택을 했을 수 있다.',
    explanation: '감정은 판단에 영향을 준다. 이것 자체가 나쁜 것은 아니지만, 그 영향을 알아차리는 것이 중요하다.'
  },
  {
    id: 'b5',
    statement: '나는 결과를 알고 나서 "처음부터 알 수 있었다"고 느꼈을 수 있다.',
    explanation: '이것을 "사후 확신 편향"이라고 한다. 결과를 모르는 상태에서 결정하는 것은 매우 다른 경험이다.'
  },
  {
    id: 'b6',
    statement: '나는 피해를 입은 사람들의 이야기를 충분히 듣지 못했을 수 있다.',
    explanation: '역사 기록은 권력을 가진 쪽의 목소리가 크다. 전쟁에서 가장 큰 피해를 입은 사람들의 이야기는 덜 남아 있다.'
  }
];

const RESPONSE_OPTIONS = [
  { value: 'yes', label: '그랬던 것 같다' },
  { value: 'no', label: '그렇지 않다' },
  { value: 'unsure', label: '잘 모르겠다' }
];

export function render(app) {
  setLastScreen('#/bias');
  const state = getState();
  const saved = state.biasCheck || {};

  app.innerHTML = `
    <div class="screen" id="screen-bias">
      <h1 class="screen-title">반편견 점검</h1>
      <p class="screen-subtitle">3차시 — 나의 판단을 돌아보기</p>

      <div class="card card--olive" style="margin-bottom:var(--space-6);">
        <p>편견이 있다는 것이 나쁜 것은 아닙니다.</p>
        <p style="margin-top:var(--space-2);">
          누구나 자기만의 시각을 가지고 있습니다.
          중요한 것은 그것을 알아차리는 것입니다.
        </p>
      </div>

      <div id="bias-items"></div>

      <div style="text-align:center;margin-top:var(--space-6);">
        <button class="btn btn--primary" id="btn-to-declaration" disabled>평화 선언문 쓰기</button>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const container = document.getElementById('bias-items');
  const nextBtn = document.getElementById('btn-to-declaration');

  function countAnswered() {
    let count = 0;
    BIAS_ITEMS.forEach(item => {
      if (saved[item.id]) count++;
    });
    return count;
  }

  function updateNextBtn() {
    nextBtn.disabled = countAnswered() < BIAS_ITEMS.length;
  }

  BIAS_ITEMS.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'margin-bottom:var(--space-4);';

    const currentValue = saved[item.id] || '';

    card.innerHTML = `
      <p style="font-weight:600;margin-bottom:var(--space-3);">
        ${index + 1}. ${item.statement}
      </p>
      <div class="chip-group" role="radiogroup" aria-label="${item.statement}" style="margin-bottom:var(--space-3);">
        ${RESPONSE_OPTIONS.map(opt => `
          <button class="chip${currentValue === opt.value ? ' chip--selected' : ''}"
            data-bias-id="${item.id}" data-value="${opt.value}"
            role="radio" aria-checked="${currentValue === opt.value ? 'true' : 'false'}">
            ${opt.label}
          </button>
        `).join('')}
      </div>
      <div class="bias-explanation" id="explain-${item.id}" style="${currentValue ? '' : 'display:none;'}">
        <p style="font-size:var(--font-size-sm);color:var(--ink-500);padding:var(--space-2);background:var(--stone-100);border-radius:var(--radius);">
          ${item.explanation}
        </p>
      </div>
    `;

    container.appendChild(card);

    const chips = card.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const biasId = chip.dataset.biasId;
        const value = chip.dataset.value;

        chips.forEach(c => {
          c.classList.remove('chip--selected');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('chip--selected');
        chip.setAttribute('aria-checked', 'true');

        saved[biasId] = value;
        updateState(s => {
          if (!s.biasCheck) s.biasCheck = {};
          s.biasCheck[biasId] = value;
        });

        const explainEl = document.getElementById(`explain-${biasId}`);
        explainEl.style.display = '';

        updateNextBtn();
      });
    });
  });

  updateNextBtn();

  nextBtn.addEventListener('click', () => {
    markScreenCompleted('s7');
    navigate('#/declaration');
  });

  setupTermTooltips(app);
}
