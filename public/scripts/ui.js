let toastTimer = null;

export function showToast(message, duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.remove();
  }, duration);
}

export function showModal(options) {
  const { title, body, actions, onClose } = options;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  if (title) overlay.setAttribute('aria-label', title);

  const modal = document.createElement('div');
  modal.className = 'modal';

  if (title) {
    const h = document.createElement('h2');
    h.className = 'modal__title';
    h.textContent = title;
    modal.appendChild(h);
  }

  if (typeof body === 'string') {
    const p = document.createElement('div');
    p.innerHTML = body;
    modal.appendChild(p);
  } else if (body instanceof HTMLElement) {
    modal.appendChild(body);
  }

  if (actions && actions.length > 0) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'modal__actions';
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = `btn ${action.className || 'btn--secondary'}`;
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        closeModal(overlay);
        if (action.onClick) action.onClick();
      });
      actionsDiv.appendChild(btn);
    });
    modal.appendChild(actionsDiv);
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(overlay);
      if (onClose) onClose();
    }
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal(overlay);
      if (onClose) onClose();
      document.removeEventListener('keydown', escHandler);
    }
  });

  const focusable = modal.querySelector('button, [tabindex]');
  if (focusable) focusable.focus();

  return overlay;
}

function closeModal(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.remove();
  }
}

export function showBreathingModal() {
  const bodyEl = document.createElement('div');
  bodyEl.style.textAlign = 'center';

  const circle = document.createElement('div');
  circle.style.cssText = `
    width: 80px; height: 80px; border-radius: 50%;
    background: var(--olive-light); margin: var(--space-6) auto;
    animation: breathe 14s ease-in-out 3;
  `;
  bodyEl.appendChild(circle);

  const guide = document.createElement('p');
  guide.style.cssText = 'color: var(--ink-500); font-size: var(--font-size-sm);';
  guide.textContent = '원을 따라 천천히 숨을 쉬어 보세요.';
  guide.setAttribute('aria-live', 'polite');
  bodyEl.appendChild(guide);

  return showModal({
    title: '잠시 멈추기',
    body: bodyEl,
    actions: [{ label: '닫기', className: 'btn--olive' }]
  });
}

export function createPauseButton() {
  const existing = document.querySelector('.pause-btn');
  if (existing) return;

  const btn = document.createElement('button');
  btn.className = 'pause-btn';
  btn.setAttribute('aria-label', '잠시 멈추기');
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="5.5" y="5" width="2" height="6" rx="0.5"/>
      <rect x="8.5" y="5" width="2" height="6" rx="0.5"/>
    </svg>
    잠시 멈추기
  `;
  btn.addEventListener('click', showBreathingModal);
  document.body.appendChild(btn);
}

export function removePauseButton() {
  const btn = document.querySelector('.pause-btn');
  if (btn) btn.remove();
}

export function createProgressBar(container, current, total) {
  const wrapper = document.createElement('div');
  wrapper.className = 'progress-bar';
  wrapper.setAttribute('role', 'progressbar');
  wrapper.setAttribute('aria-valuenow', current);
  wrapper.setAttribute('aria-valuemin', 0);
  wrapper.setAttribute('aria-valuemax', total);
  wrapper.setAttribute('aria-label', `진행 상황: ${total}개 중 ${current}개 완료`);

  const fill = document.createElement('div');
  fill.className = 'progress-bar__fill';
  fill.style.width = `${(current / total) * 100}%`;
  wrapper.appendChild(fill);

  container.appendChild(wrapper);
  return wrapper;
}

export function createUtilityBar() {
  const bar = document.createElement('nav');
  bar.className = 'utility-bar';
  bar.setAttribute('aria-label', '유틸리티 메뉴');
  bar.innerHTML = `
    <a href="#/">시작 화면</a>
    <a href="#/glossary">용어 사전</a>
  `;
  return bar;
}

export function setupTermTooltips(container) {
  const terms = container.querySelectorAll('.term[data-term]');
  terms.forEach(term => {
    const handler = (e) => {
      e.stopPropagation();
      const existing = term.querySelector('.term-tooltip');
      if (existing) {
        existing.remove();
        return;
      }

      document.querySelectorAll('.term-tooltip').forEach(t => t.remove());

      const glossaryData = window.__glossaryData || {};
      const key = term.getAttribute('data-term');
      const definition = glossaryData[key] || '';
      if (!definition) return;

      const tooltip = document.createElement('span');
      tooltip.className = 'term-tooltip';
      tooltip.id = 'tooltip-' + key;
      tooltip.textContent = definition;
      tooltip.setAttribute('role', 'tooltip');
      term.setAttribute('aria-describedby', tooltip.id);
      term.appendChild(tooltip);
    };

    term.addEventListener('click', handler);
    term.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler(e);
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.term-tooltip').forEach(t => t.remove());
  });
}
