import { decisions } from '../../data/decisions.js';
import { getState, setLastScreen, markScreenCompleted } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar } from '../ui.js';

const NODE_ORDER = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];

const EMOTION_COLORS = {
  '평온': '#6E8B3D', '설렘': '#C08B2E', '불안': '#A6413C',
  '지루함': '#9DA19E', '화남': '#C0392B', '슬픔': '#2E6E8E',
  '기대': '#D4A94E', '모르겠음': '#6B706D', '죄책감': '#8B5E3C',
  '안도': '#4A8FB0'
};

function classifyChoice(node, choiceId) {
  if (!choiceId) return 'unknown';
  const idx = node.options.findIndex(o => o.id === choiceId);
  if (idx === 0) return 'hard';
  if (idx === node.options.length - 1) return 'soft';
  return 'middle';
}

export function render(app) {
  setLastScreen('#/trajectory');
  const state = getState();
  const decs = state.decisions || {};

  let hardCount = 0;
  let softCount = 0;
  let maxInfluenceNode = '';
  let maxInfluence = -1;

  NODE_ORDER.forEach(nid => {
    const d = decs[nid];
    if (!d) return;
    const node = decisions.find(n => n.id === nid);
    const cls = classifyChoice(node, d.choice);
    if (cls === 'hard') hardCount++;
    if (cls === 'soft') softCount++;
    if (d.emotionInfluence > maxInfluence) {
      maxInfluence = d.emotionInfluence;
      maxInfluenceNode = nid;
    }
  });

  const middleCount = NODE_ORDER.length - hardCount - softCount;
  const maxNode = decisions.find(n => n.id === maxInfluenceNode);
  const maxLabel = maxNode ? `기원전 ${Math.abs(maxNode.year)}년 ${maxNode.options[0]?.label?.substring(0, 10) || ''}` : '';

  const summary = `당신은 6번의 결정 중 ${hardCount}번을 강경한 쪽으로, ${softCount}번을 협상하는 쪽으로 선택했다.${maxInfluenceNode ? ` 감정의 영향이 가장 컸다고 스스로 표시한 순간은 ${maxLabel} 결정이었다.` : ''}`;

  const svgWidth = 700;
  const svgHeight = 220;
  const nodeSpacing = svgWidth / (NODE_ORDER.length + 1);

  let svgContent = '';
  const points = [];

  NODE_ORDER.forEach((nid, i) => {
    const x = nodeSpacing * (i + 1);
    const d = decs[nid];
    const node = decisions.find(n => n.id === nid);
    const emotion = d?.emotion || '';
    const influence = d?.emotionInfluence ?? 5;
    const color = EMOTION_COLORS[emotion] || '#9DA19E';
    const r = 8 + influence * 1.5;
    const y = 110;

    points.push({ x, y, color, r, nid, emotion, influence, node, d });

    if (i > 0) {
      const prev = points[i - 1];
      const strokeW = 2 + (prev.influence / 10) * 4;
      svgContent += `<line x1="${prev.x}" y1="${prev.y}" x2="${x}" y2="${y}" stroke="${prev.color}" stroke-width="${strokeW}" stroke-opacity="0.5"/>`;
    }

    svgContent += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#fff" stroke-width="2"/>`;

    const yearLabel = node ? `BC ${Math.abs(node.year)}` : nid;
    svgContent += `<text x="${x}" y="${y + r + 18}" text-anchor="middle" font-size="11" fill="var(--ink-700)">${yearLabel}</text>`;
    svgContent += `<text x="${x}" y="${y - r - 8}" text-anchor="middle" font-size="11" fill="${color}">${emotion || '—'}</text>`;

    if (nid === 'D3' && d?.revisited && d?.secondChoice !== d?.choice) {
      svgContent += `<text x="${x}" y="${y + r + 34}" text-anchor="middle" font-size="10" fill="var(--olive)" font-weight="bold">결정을 바꿈</text>`;
    }
  });

  svgContent += `<line x1="${nodeSpacing * 0.5}" y1="170" x2="${nodeSpacing * (NODE_ORDER.length + 0.5)}" y2="170" stroke="var(--stone-300)" stroke-width="1" marker-end="url(#arrowR)"/>`;
  svgContent += `<text x="${nodeSpacing * 0.5}" y="188" font-size="10" fill="var(--ink-500)">기원전 432년</text>`;
  svgContent += `<text x="${nodeSpacing * NODE_ORDER.length}" y="188" font-size="10" fill="var(--ink-500)" text-anchor="end">기원전 415년</text>`;
  svgContent += `<text x="${svgWidth / 2}" y="206" text-anchor="middle" font-size="10" fill="var(--ink-300)">← 숫자가 클수록 옛날 (시간 흐름 →)</text>`;

  app.innerHTML = `
    <div class="screen" id="screen-trajectory">
      <h1 class="screen-title">나의 선택 궤적</h1>
      <p class="screen-subtitle">3차시 — 6번의 결정을 되돌아보기</p>

      <div style="overflow-x:auto;margin:var(--space-6) 0;">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%;min-width:360px;max-width:${svgWidth}px;" role="img" aria-label="나의 선택 궤적 타임라인">
          <title>나의 선택 궤적 타임라인</title>
          <defs>
            <marker id="arrowR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="var(--stone-300)"/>
            </marker>
          </defs>
          ${svgContent}
        </svg>
      </div>

      <div class="card" style="margin-bottom:var(--space-6);">
        <p>${summary}</p>
      </div>

      <h2 style="font-size:var(--font-size-base);margin-bottom:var(--space-4);">결정 상세</h2>
      <div id="decision-details"></div>

      <div style="text-align:center;margin-top:var(--space-6);">
        <button class="btn btn--primary" id="btn-to-perspective">관점 전환실로 가기</button>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const details = document.getElementById('decision-details');
  NODE_ORDER.forEach(nid => {
    const d = decs[nid];
    const node = decisions.find(n => n.id === nid);
    if (!d || !node) return;

    const chosenOpt = node.options.find(o => o.id === d.choice);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'margin-bottom:var(--space-3);padding:var(--space-3);';
    card.innerHTML = `
      <p style="font-weight:600;font-size:var(--font-size-sm);color:var(--ink-500);">
        기원전 ${Math.abs(node.year)}년
      </p>
      <p><strong>선택:</strong> ${chosenOpt ? chosenOpt.label : '—'}</p>
      <p style="font-size:var(--font-size-sm);"><strong>근거:</strong> ${d.reason || '—'}</p>
      <p style="font-size:var(--font-size-sm);"><strong>감정:</strong> ${d.emotion || '—'} (영향도 ${d.emotionInfluence ?? '—'}/10)</p>
      ${d.revisited ? `<p style="font-size:var(--font-size-sm);color:var(--olive);"><strong>재투표:</strong> ${d.secondChoice === d.choice ? '선택을 유지함' : '선택을 바꿈'}</p>` : ''}
    `;
    details.appendChild(card);
  });

  document.getElementById('btn-to-perspective').addEventListener('click', () => {
    markScreenCompleted('s5');
    navigate('#/perspective');
  });
}
