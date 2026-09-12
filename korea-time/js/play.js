// ---------------------------------------------------------------------------
// play.js — 미션 진행 (브리핑 → 대화·단서 수집 → 자물쇠 풀기 → 조각 획득)
// ---------------------------------------------------------------------------
import { CHAPTERS, FINAL_GATE } from './data/chapters.js';
import * as S from './store.js';
import * as U from './ui.js';
import { h } from './ui.js';

let onFinish = () => {};
export function setFinishHandler(fn) { onFinish = fn; }

// ── 진입점 : 저장된 상태에 맞는 화면을 그린다 ─────────────────────────
export function resume() {
  U.mountHUD();
  S.startClock();
  if (S.save.chapterIndex >= CHAPTERS.length) return finalGate();
  const ch = CHAPTERS[S.save.chapterIndex];
  U.showScene(ch.art);
  if (S.save.phase === 'shard') return shardScreen(ch);
  if (S.save.phase === 'puzzles') return puzzleScreen(ch);
  if (S.save.beatIndex === 0) return briefing(ch);
  return beatScreen(ch);
}

// ── 미션 브리핑 ────────────────────────────────────────────────────────
function briefing(ch) {
  U.showScene(ch.art);
  U.paintHUD();
  const text = S.isHigh() ? ch.intro.hs : ch.intro.ms;
  U.render(h('section', { class: 'panel brief' },
    h('div', { class: 'brief-no', text: `미션 ${ch.no}` }),
    h('h1', { class: 'brief-title', text: ch.title }),
    h('div', { class: 'brief-meta' },
      h('span', { text: ch.place }), h('span', { class: 'dot' }), h('span', { text: ch.era })),
    h('div', { class: 'brief-body', html: U.paras(text) }),
    h('div', { class: 'brief-goal' },
      h('b', { text: '목표 · ' }), h('span', { text: ch.goal })),
    h('div', { class: 'row-end' },
      U.button('들어가기 →', () => { S.save.phase = 'beats'; S.markDirty(); beatScreen(ch); }, 'primary'))
  ), { announce: `미션 ${ch.no}. ${ch.title}` });
}

// ── 대화 · 단서 수집 ───────────────────────────────────────────────────
function beatScreen(ch) {
  const i = Math.min(S.save.beatIndex, ch.beats.length - 1);
  const beat = ch.beats[i];
  const last = i >= ch.beats.length - 1;

  const sources = [beat.source, ...(beat.extraSources || [])].filter(Boolean);

  const node = h('section', { class: 'panel talk' },
    h('div', { class: 'talk-step', text: `대화 ${i + 1} / ${ch.beats.length}` }),
    U.speaker(beat),
    h('div', { class: 'lines' }, ...beat.lines.map((l) => h('p', { class: 'line', text: l }))),
    ...sources.map((s) => U.sourceBox(s)).filter(Boolean),
    beat.clue ? h('div', { class: 'clue-get' },
      h('span', { class: 'clue-badge', text: '단서 획득' }),
      h('b', { text: beat.clue.title }),
      h('p', { text: beat.clue.text })
    ) : null,
    h('div', { class: 'row-end' },
      i > 0 ? U.button('← 앞으로', () => {
        S.save.beatIndex = i - 1; S.markDirty(); beatScreen(ch);
      }, 'ghost') : null,
      U.button(last ? '자물쇠 풀러 가기 →' : '다음 →', () => {
        if (beat.clue) S.addClue(ch, beat.clue);
        if (last) {
          S.save.phase = 'puzzles';
          S.save.puzzleIndex = 0;
          S.save.beatIndex = ch.beats.length;
          S.markDirty(true);
          puzzleScreen(ch);
        } else {
          S.save.beatIndex = i + 1;
          S.markDirty();
          beatScreen(ch);
        }
      }, 'primary')
    )
  );
  // 이 대화의 단서를 미리 수첩에 넣어 둔다(뒤로 갔다 와도 중복되지 않음)
  if (beat.clue) S.addClue(ch, beat.clue);
  U.paintHUD();
  U.render(node, { announce: `${beat.who}의 말` });
}

// ── 자물쇠(퍼즐) ───────────────────────────────────────────────────────
function puzzleScreen(ch) {
  const list = S.puzzlesOf(ch, S.save.tier);
  // 아직 못 푼 첫 문제로 이동
  let idx = S.save.puzzleIndex;
  while (idx < list.length && S.save.solved[list[idx].id]) idx++;
  if (idx >= list.length) return shardScreen(ch);
  S.save.puzzleIndex = idx;

  const p = list[idx];
  const body = h('section', { class: 'panel puzzle' },
    h('div', { class: 'lock-head' },
      h('span', { class: 'lock-ico', text: '🔒' }),
      h('span', { class: 'lock-name', text: p.lock || `자물쇠 ${idx + 1}` }),
      h('span', { class: 'lock-count', text: `${idx + 1} / ${list.length}` })
    ),
    h('p', { class: 'puzzle-prompt', text: p.prompt }),
    inputFor(p),
    h('div', { class: 'puzzle-msg', id: 'pmsg', role: 'status', 'aria-live': 'polite' }),
    h('div', { class: 'row-between' },
      hintButton(p),
      U.button('확인', () => submit(ch, list, idx, p), 'primary')
    )
  );
  U.paintHUD();
  U.render(body, { announce: p.lock || '자물쇠' });
}

function hintButton(p) {
  if (!p.hint) return h('span');
  const used = !!S.save.hintsUsed[p.id];
  // 중학생용은 힌트가 처음부터 열려 있고, 고등학생용은 두 번 틀려야 열린다
  const wrongs = S.save.wrong[p.id] || 0;
  const locked = S.isHigh() && wrongs < 2 && !used;
  return U.button(
    locked ? `힌트 (두 번 틀리면 열려요 · ${wrongs}/2)` : '힌트 보기',
    () => {
      if (locked) { U.toast('조금 더 생각해 볼까요? 사료를 다시 읽어 보세요.', 'warn'); return; }
      S.save.hintsUsed[p.id] = true;
      S.markDirty();
      U.modal('힌트', h('p', { class: 'hint-text', text: p.hint }));
      U.paintHUD();
    },
    locked ? 'ghost dim' : 'ghost'
  );
}

function inputFor(p) {
  if (p.kind === 'input') {
    return h('div', { class: 'ans-input' },
      h('input', {
        id: 'ans', type: 'text', class: 'text-input', autocomplete: 'off',
        placeholder: p.placeholder || '답을 입력하세요', 'aria-label': '답 입력',
        onkeydown: (e) => { if (e.key === 'Enter') U.$('#stage .btn.primary').click(); },
      })
    );
  }
  if (p.kind === 'choice' || p.kind === 'multi') {
    const type = p.kind === 'choice' ? 'radio' : 'checkbox';
    return h('div', { class: 'options', role: p.kind === 'choice' ? 'radiogroup' : 'group' },
      ...p.options.map((o, i) =>
        h('label', { class: 'opt' },
          h('input', { type, name: 'ans', value: String(i) }),
          h('span', { class: 'opt-mark', text: String.fromCharCode(9312 + i) }),
          h('span', { class: 'opt-text', text: o })
        ))
    );
  }
  if (p.kind === 'order') {
    // 위/아래 버튼으로 순서를 바꾼다 (드래그보다 접근성과 터치 조작이 좋다)
    const wrap = h('ol', { class: 'order-list', id: 'orderlist' });
    const items = p.options.map((o, i) => ({ i, text: o }));
    const paint = () => {
      wrap.innerHTML = '';
      items.forEach((it, pos) => {
        wrap.append(h('li', { class: 'order-item', dataset: { idx: String(it.i) } },
          h('span', { class: 'order-num', text: String(pos + 1) }),
          h('span', { class: 'order-text', text: it.text }),
          h('span', { class: 'order-btns' },
            h('button', {
              class: 'mini', type: 'button', 'aria-label': '위로', text: '▲',
              disabled: pos === 0,
              onclick: () => { [items[pos - 1], items[pos]] = [items[pos], items[pos - 1]]; paint(); },
            }),
            h('button', {
              class: 'mini', type: 'button', 'aria-label': '아래로', text: '▼',
              disabled: pos === items.length - 1,
              onclick: () => { [items[pos + 1], items[pos]] = [items[pos], items[pos + 1]]; paint(); },
            })
          )
        ));
      });
    };
    paint();
    return h('div', { class: 'order-wrap' },
      h('p', { class: 'order-help', text: '▲ ▼ 단추로 순서를 바꾼 뒤 [확인]을 누르세요.' }), wrap);
  }
  return h('div');
}

function readAnswer(p) {
  if (p.kind === 'input') return (U.$('#ans') || {}).value || '';
  if (p.kind === 'choice') {
    const c = U.$('input[name="ans"]:checked');
    return c ? Number(c.value) : -1;
  }
  if (p.kind === 'multi') {
    return U.$$('input[name="ans"]:checked').map((e) => Number(e.value));
  }
  if (p.kind === 'order') {
    return U.$$('#orderlist .order-item').map((li) => Number(li.dataset.idx));
  }
  return null;
}

function submit(ch, list, idx, p) {
  const ans = readAnswer(p);
  const empty =
    (p.kind === 'input' && !String(ans).trim()) ||
    (p.kind === 'choice' && ans < 0) ||
    (p.kind === 'multi' && (!ans || !ans.length));
  if (empty) { U.toast('먼저 답을 고르거나 입력해 주세요.', 'warn'); return; }

  const msg = U.$('#pmsg');
  if (S.checkAnswer(p, ans)) {
    S.save.solved[p.id] = true;
    S.markDirty(true);
    U.paintHUD();
    msg.className = 'puzzle-msg ok';
    msg.innerHTML = '';
    U.appendAll(msg,
      h('div', { class: 'msg-head', text: '🔓 자물쇠가 열렸어요!' }),
      h('div', { class: 'msg-body', html: U.paras(p.explain) }),
      ...(p.extraSources || []).map((s) => U.sourceBox(s)).filter(Boolean),
      h('div', { class: 'row-end' },
        U.button(idx + 1 >= list.length ? '조각 받기 →' : '다음 자물쇠 →', () => {
          S.save.puzzleIndex = idx + 1;
          S.markDirty();
          if (idx + 1 >= list.length) shardScreen(ch); else puzzleScreen(ch);
        }, 'primary'))
    );
    msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    U.announce('정답입니다. 자물쇠가 열렸어요.');
  } else {
    S.save.wrong[p.id] = (S.save.wrong[p.id] || 0) + 1;
    S.markDirty();
    const n = S.save.wrong[p.id];
    msg.className = 'puzzle-msg no';
    msg.textContent =
      n === 1 ? '아직 열리지 않네요. 사료를 한 번 더 읽어 볼까요?'
        : n === 2 ? '조금 아쉬워요. 단서 수첩을 열어 보면 도움이 될 거예요.'
          : '천천히 해도 괜찮아요. 힌트를 열어서 함께 풀어 봐요.';
    U.announce(msg.textContent);
    // 3번 틀리면 고등학생용에서도 힌트를 열어 준다
    if (n >= 3 && p.hint && !S.save.hintsUsed[p.id]) {
      S.save.hintsUsed[p.id] = true;
      U.modal('힌트', h('p', { class: 'hint-text', text: p.hint }));
    }
  }
}

// ── 열쇠 조각 획득 ─────────────────────────────────────────────────────
function shardScreen(ch) {
  S.save.phase = 'shard';
  if (!S.save.shards.includes(ch.shard.glyph)) S.save.shards.push(ch.shard.glyph);
  if (ch.reward && !S.save.records.some((r) => r.record === ch.reward.record)) {
    S.save.records.push({ chapter: ch.no, ...ch.reward });
  }
  S.markDirty(true);
  U.paintHUD();

  const lastChapter = ch.no >= CHAPTERS.length;
  U.render(h('section', { class: 'panel shard-panel' },
    h('div', { class: 'shard-big', text: ch.shard.glyph }),
    h('h1', { class: 'shard-title', text: `열쇠 조각 ‘${ch.shard.name}’ 획득!` }),
    h('p', { class: 'shard-mean', text: ch.shard.meaning }),
    ch.reward ? h('div', { class: 'record-card' },
      h('span', { class: 'record-label', text: '기록판에 남김' }),
      h('b', { text: ch.reward.record }),
      h('p', { class: 'muted small', text: ch.reward.note })
    ) : null,
    h('div', { class: 'shard-row' },
      ...['開', '疆', '亂', '抗', '革', '文'].map((g) =>
        h('span', { class: `shard-slot ${S.save.shards.includes(g) ? 'on' : ''}`, text: g }))
    ),
    h('div', { class: 'row-end' },
      U.button(lastChapter ? '시간의 문으로 →' : `미션 ${ch.no + 1}로 →`, () => {
        S.save.chapterIndex = ch.no; // 다음 장(0-based)
        S.save.beatIndex = 0;
        S.save.puzzleIndex = 0;
        S.save.phase = lastChapter ? 'final' : 'beats';
        S.markDirty(true);
        if (lastChapter) finalGate();
        else { const next = CHAPTERS[S.save.chapterIndex]; U.showScene(next.art); briefing(next); }
      }, 'primary'))
  ), { announce: `열쇠 조각 ${ch.shard.glyph} 획득` });
}

// ── 마지막 관문 : 시간의 문 ────────────────────────────────────────────
function finalGate() {
  S.save.phase = 'final';
  U.showScene('gate');
  U.paintHUD();
  const p = FINAL_GATE.puzzle;

  if (S.save.solved[p.id]) return victory();

  U.render(h('section', { class: 'panel gate' },
    h('h1', { class: 'gate-title', text: FINAL_GATE.title }),
    h('div', { class: 'gate-shards' },
      ...S.save.shards.map((g) => h('span', { class: 'shard-slot on big', text: g }))),
    h('div', { class: 'brief-body', html: U.paras(FINAL_GATE.intro) }),
    h('div', { class: 'gate-records' },
      h('h3', { text: '기록판' }),
      h('ul', {}, ...S.save.records.map((r) => h('li', { text: `${r.chapter}장 · ${r.record}` })))
    ),
    h('p', { class: 'puzzle-prompt', text: p.prompt }),
    h('div', { class: 'ans-input' },
      h('input', {
        id: 'ans', type: 'text', class: 'text-input big', autocomplete: 'off',
        placeholder: p.placeholder, 'aria-label': '문을 여는 숫자',
        onkeydown: (e) => { if (e.key === 'Enter') U.$('#stage .btn.primary').click(); },
      })),
    h('div', { class: 'puzzle-msg', id: 'pmsg', role: 'status', 'aria-live': 'polite' }),
    h('div', { class: 'row-between' },
      hintButton(p),
      U.button('문 열기', () => {
        const v = (U.$('#ans') || {}).value || '';
        if (!String(v).trim()) { U.toast('숫자를 입력해 주세요.', 'warn'); return; }
        if (S.checkAnswer(p, v)) {
          S.save.solved[p.id] = true;
          S.save.finishedAt = Date.now();
          S.pauseClock();
          S.markDirty(true);
          victory();
        } else {
          S.save.wrong[p.id] = (S.save.wrong[p.id] || 0) + 1;
          S.markDirty();
          const msg = U.$('#pmsg');
          msg.className = 'puzzle-msg no';
          msg.textContent = '문이 꿈쩍도 하지 않아요. 기록판의 두 숫자를 다시 보세요.';
          if (S.save.wrong[p.id] >= 2) {
            S.save.hintsUsed[p.id] = true;
            U.modal('힌트', h('p', { class: 'hint-text', text: p.hint }));
          }
        }
      }, 'primary')
    )
  ), { announce: '시간의 문' });
}

function victory() {
  S.pauseClock();
  U.showScene('gate');
  const p = FINAL_GATE.puzzle;
  U.render(h('section', { class: 'panel victory' },
    h('div', { class: 'victory-crest', text: '474' }),
    h('h1', { class: 'gate-title', text: '문이 열렸습니다' }),
    h('div', { class: 'brief-body', html: U.paras(p.explain) }),
    h('div', { class: 'row-end' },
      U.button('학습 결과 보기 →', () => onFinish(), 'primary'))
  ), { announce: '문이 열렸습니다' });
}
