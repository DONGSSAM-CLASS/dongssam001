// ---------------------------------------------------------------------------
// teacher.js — 교사 모드 : 학급 개설·관리, 학생 현황 대시보드, 비밀번호 초기화
// ---------------------------------------------------------------------------
import * as FB from './firebase.js';
import * as U from './ui.js';
import { h } from './ui.js';
import { CHAPTERS } from './data/chapters.js';
import { STANDARDS, CURRICULUM_NOTICE } from './data/standards.js';

let teacher = null;
let classes = [];
let current = null;
let unwatch = null;
let goHome = () => {};

export function setHomeHandler(fn) { goHome = fn; }

function stopWatch() {
  if (unwatch) { unwatch(); unwatch = null; }
}

export async function open(user) {
  stopWatch();
  teacher = await FB.getTeacher(user.uid) || { id: user.uid, name: '선생님' };
  teacher.id = user.uid;
  await refresh();
}

async function refresh() {
  classes = await FB.listClasses(teacher.id);
  if (current) current = classes.find((c) => c.id === current.id) || null;
  paint();
}

// ── 화면 ───────────────────────────────────────────────────────────────
function paint() {
  U.unmountHUD();
  U.showScene('yuan');
  U.render(h('section', { class: 'panel teacher' },
    h('div', { class: 'row-between head' },
      h('div', {},
        h('h1', { class: 'page-title', text: '선생님 방' }),
        h('p', { class: 'muted small', text: `${teacher.name} 님, 반갑습니다.` })
      ),
      h('div', { class: 'row-gap' },
        U.button('처음 화면', () => { stopWatch(); goHome(); }, 'ghost'),
        U.button('로그아웃', async () => { stopWatch(); await FB.signOutNow(); goHome(); }, 'ghost')
      )
    ),
    classList(),
    current ? dashboard() : h('p', { class: 'muted', text: '학급을 골라 주세요.' }),
    guideBox()
  ));
  if (current) startWatch();
}

function classList() {
  return h('div', { class: 'card' },
    h('div', { class: 'row-between' },
      h('h2', { class: 'card-title', text: '우리 학급' }),
      U.button('+ 학급 만들기', newClassDialog, 'small primary')
    ),
    classes.length
      ? h('div', { class: 'class-grid' }, ...classes.map((c) =>
          h('button', {
            class: `class-chip ${current && current.id === c.id ? 'on' : ''}`,
            type: 'button',
            onclick: () => { current = c; paint(); },
          },
            h('span', { class: 'class-name', text: c.name }),
            h('span', { class: 'class-code', text: c.code }),
            h('span', { class: `class-open ${c.open === false ? 'off' : ''}`,
              text: c.open === false ? '가입 잠김' : '가입 열림' })
          )))
      : h('p', { class: 'muted', text: '아직 만든 학급이 없어요. [+ 학급 만들기]를 눌러 주세요.' })
  );
}

function newClassDialog() {
  const input = h('input', { class: 'text-input', id: 'cname', placeholder: '예) 3학년 2반', maxlength: '30' });
  U.modal('학급 만들기', h('div', { class: 'form' },
    h('label', { class: 'lab', for: 'cname', text: '학급 이름' }), input,
    h('p', { class: 'muted small', text:
      '만들면 6자리 학급 코드가 나옵니다. 학생들에게 그 코드를 알려 주세요. ' +
      '학생은 코드 + 출석번호 + 비밀번호로 가입합니다(이메일을 받지 않습니다).' })
  ), {
    footer: U.button('만들기', async () => {
      const name = input.value.trim();
      if (!name) { U.toast('학급 이름을 적어 주세요.', 'warn'); return; }
      try {
        const res = await FB.createClass(teacher.id, teacher.name, name);
        U.closeModal();
        await refresh();
        current = classes.find((c) => c.id === res.id) || null;
        paint();
        U.modal('학급 코드', h('div', { class: 'code-reveal' },
          h('p', { text: `“${name}” 학급이 만들어졌어요. 학생들에게 이 코드를 알려 주세요.` }),
          h('div', { class: 'big-code', text: res.code }),
          h('p', { class: 'muted small', text: '헷갈리기 쉬운 O·0·I·1 은 코드에 쓰지 않습니다.' })
        ));
      } catch (err) { U.toast(FB.friendlyError(err), 'bad'); }
    }, 'primary'),
  });
}

// ── 대시보드 ───────────────────────────────────────────────────────────
let rows = [];

function startWatch() {
  stopWatch();
  unwatch = FB.watchProgress(current.id, (list) => { rows = list; paintRows(); });
}

function dashboard() {
  return h('div', { class: 'card', id: 'dash' },
    h('div', { class: 'row-between' },
      h('h2', { class: 'card-title', text: `${current.name} · 학습 현황` }),
      h('div', { class: 'row-gap' },
        h('span', { class: 'code-pill', text: `코드 ${current.code}` }),
        U.button(current.open === false ? '가입 열기' : '가입 잠그기', async () => {
          await FB.setClassOpen(current.id, current.open === false);
          await refresh();
        }, 'small ghost'),
        U.button('CSV 내려받기', exportCSV, 'small ghost')
      )
    ),
    h('p', { class: 'muted small', text:
      '학생이 문제를 풀면 아래 표가 저절로 바뀝니다. 새로 고칠 필요가 없어요.' }),
    h('div', { class: 'table-wrap' }, h('div', { id: 'rows' }, h('p', { class: 'muted', text: '불러오는 중…' })))
  );
}

function paintRows() {
  const box = U.$('#rows');
  if (!box) return;
  box.innerHTML = '';
  if (!rows.length) {
    box.append(h('p', { class: 'muted', text: '아직 시작한 학생이 없어요. 학급 코드를 알려 주세요.' }));
    return;
  }
  const done = rows.filter((r) => r.finishedAt).length;
  const avg = Math.round(rows.reduce((n, r) => n + (r.percent || 0), 0) / rows.length);

  box.append(
    h('div', { class: 'stat-row' },
      stat('참여', `${rows.length}명`),
      stat('완주', `${done}명`),
      stat('평균 진행', `${avg}%`),
      stat('평균 시간', avgTime())
    ),
    h('table', { class: 'dash-table' },
      h('thead', {}, h('tr', {},
        ...['번호', '별명', '수준', '진행 중인 미션', '푼 문제', '진행률', '걸린 시간', '관리']
          .map((t) => h('th', { text: t })))),
      h('tbody', {}, ...rows.map(rowEl))
    )
  );
}

function stat(k, v) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat-k', text: k }), h('b', { class: 'stat-v', text: v }));
}

function avgTime() {
  const fin = rows.filter((r) => r.finishedAt && r.elapsedMs);
  if (!fin.length) return '—';
  const ms = fin.reduce((n, r) => n + r.elapsedMs, 0) / fin.length;
  return `${Math.floor(ms / 60000)}분 ${Math.floor((ms % 60000) / 1000)}초`;
}

function rowEl(r) {
  const ci = Math.min(r.chapterIndex || 0, CHAPTERS.length - 1);
  const missionName = (r.chapterIndex || 0) >= CHAPTERS.length
    ? '시간의 문'
    : `${CHAPTERS[ci].no}. ${CHAPTERS[ci].title}`;
  const pct = r.percent || 0;
  return h('tr', { class: r.finishedAt ? 'done' : '' },
    h('td', { text: String(r.number) }),
    h('td', { text: r.nickname || '' }),
    h('td', { text: r.tier === 'hs' ? '고등' : '중등' }),
    h('td', { text: r.finishedAt ? '완주 🎉' : missionName }),
    h('td', { text: `${r.solvedCount || 0} / ${r.totalPuzzles || '—'}` }),
    h('td', {}, h('div', { class: 'mini-bar' }, h('i', { style: `width:${pct}%` })), h('span', { class: 'mini-pct', text: `${pct}%` })),
    h('td', { text: r.elapsedMs ? `${Math.floor(r.elapsedMs / 60000)}분` : '—' }),
    h('td', {},
      h('button', { class: 'mini', type: 'button', text: '비밀번호 초기화',
        onclick: () => resetDialog(r) }),
      h('button', { class: 'mini danger', type: 'button', text: '기록 삭제',
        onclick: () => deleteDialog(r) })
    )
  );
}

function resetDialog(r) {
  U.modal('비밀번호 초기화', h('div', {},
    h('p', {}, h('b', { text: `${r.number}번 ${r.nickname || ''}` }), ' 학생의 비밀번호를 초기화할까요?'),
    h('ol', { class: 'steps' },
      h('li', { text: '초기화를 누르면 이 번호의 기존 비밀번호가 더 이상 쓰이지 않습니다.' }),
      h('li', { text: '학생은 [처음 시작하기]에서 같은 학급 코드와 같은 번호로 다시 가입하고, 새 비밀번호를 정합니다.' }),
      h('li', { text: '지금까지 푼 기록은 그대로 이어집니다(기록은 번호로 저장되기 때문입니다).' })
    )
  ), {
    footer: U.button('초기화하기', async () => {
      try {
        await FB.resetStudentPassword(current.id, r.number);
        U.closeModal();
        await refresh();
        U.toast(`${r.number}번 학생이 다시 가입할 수 있어요.`, 'good');
      } catch (err) { U.toast(FB.friendlyError(err), 'bad'); }
    }, 'primary'),
  });
}

function deleteDialog(r) {
  U.modal('기록 삭제', h('div', {},
    h('p', {}, h('b', { text: `${r.number}번 ${r.nickname || ''}` }), ' 학생의 학습 기록을 지울까요?'),
    h('p', { class: 'muted small', text: '되돌릴 수 없습니다. 학생 계정은 남고 진행 기록만 사라집니다.' })
  ), {
    footer: U.button('삭제하기', async () => {
      try {
        await FB.deleteProgress(current.id, r.number);
        U.closeModal();
        U.toast('기록을 지웠어요.', 'good');
      } catch (err) { U.toast(FB.friendlyError(err), 'bad'); }
    }, 'primary danger'),
  });
}

function exportCSV() {
  const head = ['번호', '별명', '수준', '진행미션', '푼문제', '전체문제', '진행률(%)', '걸린시간(분)', '완주'];
  const body = rows.map((r) => {
    const ci = Math.min(r.chapterIndex || 0, CHAPTERS.length - 1);
    return [
      r.number, r.nickname || '', r.tier === 'hs' ? '고등' : '중등',
      (r.chapterIndex || 0) >= CHAPTERS.length ? '시간의 문' : CHAPTERS[ci].title,
      r.solvedCount || 0, r.totalPuzzles || '', r.percent || 0,
      r.elapsedMs ? Math.round(r.elapsedMs / 60000) : '',
      r.finishedAt ? 'O' : '',
    ];
  });
  const csv = [head, ...body]
    .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  // 엑셀에서 한글이 깨지지 않도록 BOM 을 붙인다
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${current.name}_학습현황.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ── 수업 안내 ──────────────────────────────────────────────────────────
function guideBox() {
  return h('details', { class: 'card guide' },
    h('summary', { text: '수업에서 쓰는 법 · 성취기준 · 출처 안내' }),
    h('h3', { text: '1. 수업 흐름 (한 차시)' }),
    h('ol', { class: 'steps' },
      h('li', { text: '학급을 만들고 6자리 코드를 칠판에 적어 줍니다.' }),
      h('li', { text: '학생은 코드 + 출석번호 + 비밀번호 + 별명으로 가입합니다(이메일 없음).' }),
      h('li', { text: '학생이 수준(중학생용/고등학생용)을 고릅니다. 내용은 같고 힌트와 심화 문항만 다릅니다.' }),
      h('li', { text: '플레이 시간 15~20분. 남는 시간에 이 화면의 현황표로 함께 이야기 나눕니다.' })
    ),
    h('h3', { text: '2. 연계 성취기준 (2022 개정 역사과 교육과정)' }),
    h('ul', {}, ...Object.values(STANDARDS).map((s) =>
      h('li', {}, h('b', { text: `[${s.code}] ` }), s.text))),
    h('p', { class: 'notice' }, h('b', { text: '※ ' }), CURRICULUM_NOTICE.body),
    h('p', { class: 'muted small', text: CURRICULUM_NOTICE.source }),
    h('h3', { text: '3. 사료 출처' }),
    h('p', { class: 'muted small', text:
      '게임에 나오는 모든 사료는 『고려사』·『고려사절요』·『삼국사기』·『삼국유사』·' +
      '『동국이상국집』·『악장가사』·『권수정혜결사문』·『직지』 등 실제 원전에서 가져왔고, ' +
      '인물의 대사 바로 아래에 APA 양식으로 출처를 밝혔습니다.' }),
    h('h3', { text: '4. 개인정보' }),
    h('p', { class: 'muted small', text:
      '학생에게서 이름·이메일·전화번호를 받지 않습니다. 학급코드와 출석번호로 만든 내부 식별자와, ' +
      '학생이 직접 정한 별명만 저장합니다. 학기가 끝나면 [기록 삭제]로 지울 수 있습니다.' })
  );
}
