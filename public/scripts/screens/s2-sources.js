import { sources } from '../../data/sources.js';
import { getState, updateState, markScreenCompleted, setLastScreen } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar, createProgressBar, setupTermTooltips, showToast } from '../ui.js';

export function render(app) {
  setLastScreen('#/sources');
  const state = getState();

  app.innerHTML = `
    <div class="screen" id="screen-sources">
      <h1 class="screen-title">사료 탐구실</h1>
      <p class="screen-subtitle">1차시 — <span class="term" data-term="사료" tabindex="0" role="button">사료</span>를 읽고 분석하기</p>
      <div id="progress-area" style="margin-bottom:var(--space-4);"></div>
      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-6);">
        카드를 눌러 뒤집어 읽고, 아래 질문에 답해 주세요. 최소 4장 이상 작성해야 다음으로 넘어갑니다.
      </p>
      <div id="source-cards"></div>
      <div style="margin-top:var(--space-6);text-align:center;">
        <button class="btn btn--primary" id="btn-to-compare" disabled>
          두 폴리스 비교하러 가기
        </button>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const cardsContainer = document.getElementById('source-cards');
  const nextBtn = document.getElementById('btn-to-compare');
  const progressArea = document.getElementById('progress-area');

  function countCompleted() {
    let count = 0;
    sources.forEach(s => {
      const note = state.sourceNotes[s.id];
      if (note && note.who && note.claim && note.trust && note.reason) count++;
    });
    return count;
  }

  function updateProgress() {
    const done = countCompleted();
    progressArea.innerHTML = '';
    createProgressBar(progressArea, done, sources.length);
    const label = document.createElement('p');
    label.style.cssText = 'font-size:var(--font-size-sm);color:var(--ink-500);text-align:center;margin-top:var(--space-1);';
    label.textContent = `${sources.length}장 중 ${done}장 작성 완료`;
    label.setAttribute('aria-live', 'polite');
    progressArea.appendChild(label);
    nextBtn.disabled = done < 4;
  }

  sources.forEach(source => {
    const card = document.createElement('div');
    card.className = 'flip-card';
    card.style.cssText = 'margin-bottom:var(--space-4);';

    const note = state.sourceNotes[source.id] || {};
    const isFlipped = note.who || note.claim;

    card.innerHTML = `
      <div class="flip-card__inner card" style="min-height:120px;${isFlipped ? '' : 'cursor:pointer;'}">
        <div class="flip-card__front" id="front-${source.id}" style="${isFlipped ? 'display:none;' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:var(--space-3);">
            <div>
              <h3 style="font-size:var(--font-size-base);margin-bottom:var(--space-1);">${source.title}</h3>
              <span class="badge badge--fact">${source.type}</span>
              <span style="font-size:var(--font-size-sm);color:var(--ink-500);margin-left:var(--space-2);">
                기원전 ${Math.abs(source.year)}년${source.year === -500 ? '쯤' : ''}
              </span>
            </div>
            <span style="font-size:var(--font-size-sm);color:var(--athens);">눌러서 뒤집기</span>
          </div>
        </div>
        <div class="flip-card__back" id="back-${source.id}" style="${isFlipped ? '' : 'display:none;'}position:relative;">
          <h3 style="font-size:var(--font-size-base);margin-bottom:var(--space-2);">${source.title}</h3>
          <p style="margin-bottom:var(--space-2);font-size:var(--font-size-sm);">${source.body}</p>
          <details style="margin-bottom:var(--space-3);">
            <summary style="font-size:var(--font-size-sm);color:var(--ink-500);cursor:pointer;">출처 정보 보기</summary>
            <div style="font-size:var(--font-size-sm);color:var(--ink-500);padding:var(--space-2) 0;">
              <p>저자: ${source.provenance.author}</p>
              <p>시기: ${source.provenance.period}</p>
              <p>성격: ${source.provenance.nature}</p>
              <p>한계: ${source.provenance.limitation}</p>
            </div>
          </details>
          <p style="font-size:var(--font-size-sm);color:var(--athens);font-weight:600;margin-bottom:var(--space-3);">
            ${source.guidingQuestion}
          </p>
          <div class="input-group" style="margin-bottom:var(--space-2);">
            <label for="who-${source.id}">누가 남긴 기록인가?</label>
            <input class="input-field" id="who-${source.id}" type="text" maxlength="100" value="${escapeAttr(note.who || '')}" placeholder="예: 동시대 장군 출신 역사가">
          </div>
          <div class="input-group" style="margin-bottom:var(--space-2);">
            <label for="claim-${source.id}">무엇을 주장하는가?</label>
            <input class="input-field" id="claim-${source.id}" type="text" maxlength="100" value="${escapeAttr(note.claim || '')}" placeholder="예: 아테네가 동맹의 돈을 가져갔다">
          </div>
          <div style="margin-bottom:var(--space-2);">
            <label style="font-weight:600;font-size:var(--font-size-sm);color:var(--ink-700);">
              이 기록을 얼마나 믿을 수 있는가?
            </label>
            <div class="star-rating" id="stars-${source.id}" role="radiogroup" aria-label="신뢰도 1~5" style="margin:var(--space-1) 0;"></div>
          </div>
          <div class="input-group">
            <label for="reason-${source.id}">신뢰도 이유 한 줄</label>
            <input class="input-field" id="reason-${source.id}" type="text" maxlength="100" value="${escapeAttr(note.reason || '')}" placeholder="예: 직접 경험한 사람이니 믿을 만하다">
          </div>
        </div>
      </div>
    `;

    const front = card.querySelector(`#front-${source.id}`);
    const back = card.querySelector(`#back-${source.id}`);

    if (!isFlipped) {
      card.addEventListener('click', function flipHandler(e) {
        if (back.style.display !== 'none') return;
        front.style.display = 'none';
        back.style.display = '';
        card.style.cursor = 'default';
      });
    }

    cardsContainer.appendChild(card);

    const starsContainer = card.querySelector(`#stars-${source.id}`);
    const currentTrust = note.trust || 0;
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('button');
      star.style.cssText = `
        background:none;border:none;font-size:20px;cursor:pointer;padding:2px;
        color:${i <= currentTrust ? 'var(--gold)' : 'var(--stone-300)'};
      `;
      star.textContent = '★';
      star.setAttribute('role', 'radio');
      star.setAttribute('aria-checked', i === currentTrust ? 'true' : 'false');
      star.setAttribute('aria-label', `신뢰도 ${i}`);
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        starsContainer.querySelectorAll('button').forEach((s, idx) => {
          s.style.color = idx < i ? 'var(--gold)' : 'var(--stone-300)';
          s.setAttribute('aria-checked', idx + 1 === i ? 'true' : 'false');
        });
        saveNote(source.id, 'trust', i);
      });
      starsContainer.appendChild(star);
    }

    ['who', 'claim', 'reason'].forEach(field => {
      const input = card.querySelector(`#${field}-${source.id}`);
      input.addEventListener('input', () => {
        saveNote(source.id, field, input.value);
      });
      input.addEventListener('click', (e) => e.stopPropagation());
    });
  });

  function saveNote(sourceId, field, value) {
    updateState(s => {
      if (!s.sourceNotes[sourceId]) {
        s.sourceNotes[sourceId] = {};
      }
      s.sourceNotes[sourceId][field] = value;
    });
    updateProgress();
  }

  updateProgress();
  setupTermTooltips(app);

  nextBtn.addEventListener('click', () => {
    markScreenCompleted('s2');
    navigate('#/compare');
  });
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
