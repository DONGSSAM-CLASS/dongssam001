import { factcheck } from '../../data/factcheck.js';
import { setLastScreen } from '../state.js';
import { createUtilityBar } from '../ui.js';

const GRADE_COLORS = {
  '확정': 'var(--olive)',
  '이견': 'var(--gold)',
  '가정': 'var(--ink-500)'
};

export function render(app) {
  setLastScreen('#/factcheck');

  const grades = { '확정': 0, '이견': 0 };
  factcheck.forEach(f => {
    if (grades[f.grade] !== undefined) grades[f.grade]++;
  });

  const rows = factcheck.map(f => `
    <div class="card" style="margin-bottom:var(--space-3);padding:var(--space-3);">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:var(--space-2);margin-bottom:var(--space-1);">
        <span style="font-size:var(--font-size-sm);color:var(--ink-500);">${f.id}</span>
        <span class="badge" style="background:${GRADE_COLORS[f.grade] || 'var(--ink-500)'};color:#fff;font-size:11px;">
          ${f.grade}
        </span>
      </div>
      <p style="font-size:var(--font-size-sm);font-weight:600;margin-bottom:var(--space-1);">
        ${f.statement}
      </p>
      <p style="font-size:var(--font-size-sm);color:var(--ink-500);">
        출처: ${f.source}
      </p>
      <p style="font-size:var(--font-size-sm);color:var(--ink-500);">
        화면: ${f.screen}
      </p>
      ${f.dissent ? `
        <p style="font-size:var(--font-size-sm);color:var(--gold);margin-top:var(--space-1);">
          이견: ${f.dissent}
        </p>
      ` : ''}
    </div>
  `).join('');

  app.innerHTML = `
    <div class="screen" id="screen-factcheck">
      <h1 class="screen-title">사실 검증 목록</h1>
      <p class="screen-subtitle">이 수업에 등장하는 역사적 진술 ${factcheck.length}건</p>

      <div class="card card--olive" style="margin-bottom:var(--space-6);padding:var(--space-3);">
        <p style="font-size:var(--font-size-sm);">
          <strong>확정</strong> ${grades['확정']}건 ·
          <strong>이견</strong> ${grades['이견']}건
        </p>
        <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-top:var(--space-1);">
          "확정"은 학계에서 널리 받아들여지는 사실,
          "이견"은 학자마다 해석이 다른 부분입니다.
        </p>
      </div>

      ${rows}

      <div style="text-align:center;margin-top:var(--space-6);">
        <a href="#/teacher" class="btn btn--secondary">교사 화면으로</a>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());
}
