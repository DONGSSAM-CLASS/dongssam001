import { glossary } from '../../data/glossary.js';
import { setLastScreen } from '../state.js';
import { createUtilityBar } from '../ui.js';

export function render(app) {
  setLastScreen('#/glossary');

  const rows = glossary.map(item => `
    <tr>
      <td style="padding:var(--space-2) var(--space-3);border-bottom:1px solid var(--stone-200);font-weight:600;white-space:nowrap;">
        <a href="${item.firstScreen}" style="color:var(--athens);text-decoration:none;">${item.term}</a>
      </td>
      <td style="padding:var(--space-2) var(--space-3);border-bottom:1px solid var(--stone-200);font-size:var(--font-size-sm);">
        ${item.definition}
      </td>
    </tr>
  `).join('');

  app.innerHTML = `
    <div class="screen" id="screen-glossary">
      <h1 class="screen-title">용어 사전</h1>
      <p class="screen-subtitle">이 수업에서 사용하는 주요 용어 ${glossary.length}개</p>

      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-4);">
        용어를 누르면 해당 화면으로 이동합니다.
        수업 중 화면에서 <span style="border-bottom:1px dashed var(--athens);color:var(--athens);">밑줄 표시된 단어</span>를 누르면 뜻이 나타납니다.
      </p>

      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:var(--stone-100);">
              <th style="padding:var(--space-2) var(--space-3);text-align:left;font-size:var(--font-size-sm);">용어</th>
              <th style="padding:var(--space-2) var(--space-3);text-align:left;font-size:var(--font-size-sm);">뜻</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div style="text-align:center;margin-top:var(--space-6);">
        <a href="#/" class="btn btn--secondary">시작 화면으로</a>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());
}
