import { decisions } from '../../data/decisions.js';
import { sources } from '../../data/sources.js';
import { getState, updateState, markScreenCompleted, setLastScreen } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar, setupTermTooltips, showBreathingModal, showModal } from '../ui.js';

const EMOTIONS = ['평온', '설렘', '불안', '지루함', '화남', '슬픔', '기대', '모르겠음', '죄책감', '안도'];
const NODE_ORDER = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];

export function render(app, params) {
  const nodeId = params.nodeId;
  const node = decisions.find(d => d.id === nodeId);
  if (!node) {
    app.innerHTML = '<div class="screen"><h1>노드를 찾을 수 없습니다</h1><a href="#/">돌아가기</a></div>';
    return;
  }

  setLastScreen(`#/decision/${nodeId}`);
  const state = getState();
  const saved = state.decisions[nodeId] || {};

  const stepIndicatorHtml = NODE_ORDER.map((nid, i) => {
    const done = !!state.decisions[nid]?.choice;
    const active = nid === nodeId;
    return `<span class="step-indicator__dot ${active ? 'step-indicator__dot--active' : ''} ${done ? 'step-indicator__dot--done' : ''}" aria-label="${nid} ${active ? '현재' : done ? '완료' : '미완료'}"></span>`;
  }).join('');

  const relatedSources = node.evidenceRefs.map(ref => sources.find(s => s.id === ref)).filter(Boolean);

  app.innerHTML = `
    <div class="screen" id="screen-decision">
      <div class="step-indicator" aria-label="진행 상황">
        ${stepIndicatorHtml}
        <span style="font-size:var(--font-size-sm);color:var(--ink-500);margin-left:var(--space-2);">
          ${NODE_ORDER.indexOf(nodeId) + 1} / 6
        </span>
      </div>

      <h1 class="screen-title">아고라 의사결정</h1>
      <p class="screen-subtitle">2차시 — 기원전 ${Math.abs(node.year)}년, ${node.place}</p>

      <section id="briefing-section" class="card" style="margin-bottom:var(--space-4);">
        <h2 style="font-size:var(--font-size-base);margin-bottom:var(--space-2);">상황 브리핑</h2>
        <p>${node.briefing}</p>
      </section>

      <section id="evidence-section" style="margin-bottom:var(--space-4);">
        <h2 style="font-size:var(--font-size-base);margin-bottom:var(--space-3);">관련 <span class="term" data-term="사료" tabindex="0" role="button">사료</span></h2>
        <div id="evidence-cards"></div>
      </section>

      <section id="speakers-section" style="margin-bottom:var(--space-4);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
          ${node.speakers.map(sp => `
            <div class="card" style="padding:var(--space-3);">
              <p style="font-weight:600;font-size:var(--font-size-sm);margin-bottom:var(--space-1);">${sp.name}</p>
              <p style="font-size:var(--font-size-sm);">${sp.argument}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <section id="choice-section" style="margin-bottom:var(--space-6);">
        <h2 style="font-size:var(--font-size-base);margin-bottom:var(--space-3);">당신의 선택은?</h2>
        <div id="options-group" role="radiogroup" aria-label="선택지"></div>
      </section>

      <section id="step-a" style="display:none;margin-bottom:var(--space-4);">
        <div class="card card--athens">
          <h2 style="font-size:var(--font-size-base);margin-bottom:var(--space-3);">
            (a) 왜 이 선택을 했나요?
          </h2>
          <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-2);">
            근거를 한 줄로 적어 주세요. (10자 이상)
          </p>
          <textarea class="input-field" id="reason-input" rows="2" maxlength="200" placeholder="나는 ○○ 때문에 이 선택을 했다."></textarea>
          <div style="text-align:right;margin-top:var(--space-3);">
            <button class="btn btn--primary btn--sm" id="btn-step-a" disabled>다음</button>
          </div>
        </div>
      </section>

      <section id="step-b" style="display:none;margin-bottom:var(--space-4);">
        <div class="card card--gold">
          <h2 style="font-size:var(--font-size-base);margin-bottom:var(--space-3);">
            (b) 감정 점검
          </h2>
          <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-2);">
            ${node.selReflection.promptEmotion}
          </p>
          <div class="chip-group" id="emotion-chips" role="group" aria-label="감정 선택" style="margin-bottom:var(--space-4);"></div>
          <div class="slider-container">
            <label for="influence-slider" style="font-weight:600;font-size:var(--font-size-sm);">
              이 감정이 판단에 얼마나 영향을 주었나요?
            </label>
            <input type="range" id="influence-slider" min="0" max="10" value="5">
            <div class="slider-labels">
              <span>0 (전혀)</span>
              <span id="influence-value">5</span>
              <span>10 (매우 크게)</span>
            </div>
          </div>
          <div style="text-align:right;margin-top:var(--space-3);">
            <button class="btn btn--primary btn--sm" id="btn-step-b" disabled>결과 보기</button>
          </div>
        </div>
      </section>

      <section id="step-c" style="display:none;margin-bottom:var(--space-4);">
        <div class="card" id="outcome-card"></div>
      </section>

      <div id="revote-section" style="display:none;margin-bottom:var(--space-4);"></div>

      <div id="nav-section" style="display:none;text-align:center;margin-top:var(--space-6);">
        <button class="btn btn--primary" id="btn-next-node">다음 결정으로</button>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const evidenceCards = document.getElementById('evidence-cards');
  relatedSources.forEach(src => {
    const card = document.createElement('details');
    card.className = 'card';
    card.style.cssText = 'margin-bottom:var(--space-2);padding:var(--space-3);';
    card.innerHTML = `
      <summary style="cursor:pointer;font-weight:600;font-size:var(--font-size-sm);">
        ${src.title} (기원전 ${Math.abs(src.year)}년)
      </summary>
      <p style="font-size:var(--font-size-sm);margin-top:var(--space-2);">${src.body}</p>
    `;
    evidenceCards.appendChild(card);
  });

  let selectedChoice = saved.choice || null;
  let selectedEmotion = saved.emotion || null;

  const optionsGroup = document.getElementById('options-group');
  const stepA = document.getElementById('step-a');
  const stepB = document.getElementById('step-b');
  const stepC = document.getElementById('step-c');
  const reasonInput = document.getElementById('reason-input');
  const btnStepA = document.getElementById('btn-step-a');
  const btnStepB = document.getElementById('btn-step-b');
  const influenceSlider = document.getElementById('influence-slider');
  const influenceValue = document.getElementById('influence-value');
  const emotionChips = document.getElementById('emotion-chips');
  const outcomeCard = document.getElementById('outcome-card');
  const navSection = document.getElementById('nav-section');
  const revoteSection = document.getElementById('revote-section');

  node.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'card card--clickable' + (selectedChoice === opt.id ? ' card--selected' : '');
    btn.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:var(--space-2);padding:var(--space-3);';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', selectedChoice === opt.id ? 'true' : 'false');
    btn.innerHTML = `
      <strong>${opt.label}</strong>
      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-top:var(--space-1);">${opt.framing}</p>
    `;
    btn.addEventListener('click', () => {
      if (saved.choice && saved.reason) return;
      selectedChoice = opt.id;
      optionsGroup.querySelectorAll('.card').forEach(c => {
        c.classList.remove('card--selected');
        c.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('card--selected');
      btn.setAttribute('aria-checked', 'true');
      stepA.style.display = '';
      document.getElementById('choice-section').querySelector('h2').textContent = '선택 완료';
    });
    optionsGroup.appendChild(btn);
  });

  if (saved.choice && saved.reason && saved.emotion) {
    showAllSteps();
  }

  reasonInput.addEventListener('input', () => {
    btnStepA.disabled = reasonInput.value.trim().length < 10;
  });

  btnStepA.addEventListener('click', () => {
    updateState(s => {
      if (!s.decisions[nodeId]) s.decisions[nodeId] = {};
      s.decisions[nodeId].choice = selectedChoice;
      s.decisions[nodeId].reason = reasonInput.value.trim();
    });
    optionsGroup.querySelectorAll('.card').forEach(c => {
      c.style.pointerEvents = 'none';
      c.style.opacity = '0.7';
    });
    stepA.style.display = 'none';
    stepB.style.display = '';
  });

  EMOTIONS.forEach(em => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (selectedEmotion === em ? ' chip--selected' : '');
    chip.textContent = em;
    chip.addEventListener('click', () => {
      selectedEmotion = em;
      emotionChips.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--selected'));
      chip.classList.add('chip--selected');
      btnStepB.disabled = false;
    });
    emotionChips.appendChild(chip);
  });

  influenceSlider.addEventListener('input', () => {
    influenceValue.textContent = influenceSlider.value;
  });

  btnStepB.addEventListener('click', () => {
    updateState(s => {
      if (!s.decisions[nodeId]) s.decisions[nodeId] = {};
      s.decisions[nodeId].emotion = selectedEmotion;
      s.decisions[nodeId].emotionInfluence = parseInt(influenceSlider.value, 10);
    });
    stepB.style.display = 'none';
    showOutcome();
  });

  function showOutcome() {
    const gradeLabel = node.outcome.grade === '확정' ? '역사 속 실제' : node.outcome.grade === '이견' ? '학자마다 다름' : '만약에';
    const gradeCls = node.outcome.grade === '확정' ? 'badge--fact' : node.outcome.grade === '이견' ? 'badge--debate' : 'badge--hypothetical';

    stepC.style.display = '';
    outcomeCard.innerHTML = `
      <span class="badge ${gradeCls}" style="margin-bottom:var(--space-3);display:inline-block;">${gradeLabel}</span>
      <h2 style="font-size:var(--font-size-base);margin-bottom:var(--space-3);">결과</h2>
      <p style="margin-bottom:var(--space-3);">${node.outcome.historical}</p>
      <div style="display:grid;grid-template-columns:1fr;gap:var(--space-2);margin-top:var(--space-3);">
        <div style="padding:var(--space-2);background:var(--athens-bg);border-radius:var(--radius-sm);">
          <p style="font-size:var(--font-size-sm);"><strong>아테네:</strong> ${node.outcome.effects.athens}</p>
        </div>
        <div style="padding:var(--space-2);background:var(--sparta-bg);border-radius:var(--radius-sm);">
          <p style="font-size:var(--font-size-sm);"><strong>상대:</strong> ${node.outcome.effects.opponent}</p>
        </div>
        <div style="padding:var(--space-2);background:var(--stone-100);border-radius:var(--radius-sm);">
          <p style="font-size:var(--font-size-sm);"><strong>이름 없는 사람들:</strong> ${node.outcome.effects.civilians}</p>
        </div>
      </div>
      ${node.outcome.epilogue ? `<p style="margin-top:var(--space-3);font-style:italic;color:var(--ink-500);">${node.outcome.epilogue}</p>` : ''}
    `;

    if (nodeId === 'D3' && node.outcome.allowRevote) {
      showRevote();
    } else if (nodeId === 'D5' && node.outcome.triggerPause) {
      showD5Extras();
    } else {
      showNav();
    }

    stepC.setAttribute('aria-live', 'polite');
  }

  function showRevote() {
    const alreadyRevoted = !!saved.revisited;
    revoteSection.style.display = '';
    revoteSection.innerHTML = `
      <div class="card card--olive">
        <p style="margin-bottom:var(--space-3);">
          실제 아테네 시민들은 다음 날 다시 모여 결정을 뒤집었다.
          결정을 바꾼 뒤에도 주모자로 지목된 약 1,000여 명은 처형되었다.
        </p>
        <p style="font-weight:600;margin-bottom:var(--space-3);">
          당신도 선택을 바꿀 기회가 있습니다.
        </p>
        ${alreadyRevoted ? `
          <p style="font-size:var(--font-size-sm);color:var(--ink-500);">
            이미 재투표를 했습니다. (${saved.secondChoice === saved.choice ? '선택을 유지했습니다' : '선택을 바꾸었습니다'})
          </p>
        ` : `
          <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;">
            <button class="btn btn--primary btn--sm" id="btn-revote-change">결정을 바꾸겠다</button>
            <button class="btn btn--secondary btn--sm" id="btn-revote-keep">유지하겠다</button>
          </div>
        `}
      </div>
    `;

    if (!alreadyRevoted) {
      document.getElementById('btn-revote-change').addEventListener('click', () => {
        showRevoteOptions();
      });
      document.getElementById('btn-revote-keep').addEventListener('click', () => {
        updateState(s => {
          s.decisions[nodeId].revisited = true;
          s.decisions[nodeId].secondChoice = s.decisions[nodeId].choice;
        });
        revoteSection.innerHTML = '<div class="card card--olive"><p>선택을 유지했습니다.</p></div>';
        showNav();
      });
    } else {
      showNav();
    }
  }

  function showRevoteOptions() {
    const currentChoice = getState().decisions[nodeId].choice;
    const otherOptions = node.options.filter(o => o.id !== currentChoice);

    revoteSection.innerHTML = `
      <div class="card card--olive">
        <p style="font-weight:600;margin-bottom:var(--space-3);">어떤 선택으로 바꾸겠습니까?</p>
        <div id="revote-options"></div>
      </div>
    `;

    const container = document.getElementById('revote-options');
    otherOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn btn--secondary btn--sm';
      btn.style.cssText = 'margin:var(--space-1);';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        updateState(s => {
          s.decisions[nodeId].revisited = true;
          s.decisions[nodeId].secondChoice = opt.id;
        });
        revoteSection.innerHTML = `<div class="card card--olive"><p>"${opt.label}"(으)로 선택을 바꾸었습니다.</p></div>`;
        showNav();
      });
      container.appendChild(btn);
    });
  }

  function showD5Extras() {
    outcomeCard.innerHTML += `
      <div class="card card--olive" style="margin-top:var(--space-4);padding:var(--space-4);text-align:center;">
        <h3 style="font-size:var(--font-size-base);margin-bottom:var(--space-2);">전쟁 범죄를 기억한다는 것</h3>
        <p style="font-size:var(--font-size-sm);">
          이 사건은 전쟁 중에 벌어진 가장 잔혹한 일 가운데 하나로 기록되었다.
          우리는 이런 일이 왜 벌어졌는지, 어떻게 하면 다시 벌어지지 않을지 생각해 보아야 한다.
        </p>
      </div>
    `;

    if (!saved.emotion) {
      showBreathingModal();
    }
    showNav();
  }

  function showNav() {
    navSection.style.display = '';
    const currentIdx = NODE_ORDER.indexOf(nodeId);
    const nextBtn = document.getElementById('btn-next-node');

    if (currentIdx < NODE_ORDER.length - 1) {
      const nextId = NODE_ORDER[currentIdx + 1];
      nextBtn.textContent = '다음 결정으로';
      nextBtn.addEventListener('click', () => {
        markScreenCompleted('s4-' + nodeId);
        navigate(`#/decision/${nextId}`);
      });
    } else {
      nextBtn.textContent = '3차시로 이동';
      nextBtn.addEventListener('click', () => {
        markScreenCompleted('s4');
        navigate('#/trajectory');
      });
    }
  }

  function showAllSteps() {
    optionsGroup.querySelectorAll('.card').forEach(c => {
      c.style.pointerEvents = 'none';
      c.style.opacity = '0.7';
    });
    reasonInput.value = saved.reason || '';
    influenceSlider.value = saved.emotionInfluence || 5;
    influenceValue.textContent = saved.emotionInfluence || 5;
    showOutcome();
  }

  setupTermTooltips(app);
}
