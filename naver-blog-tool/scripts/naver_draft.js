#!/usr/bin/env node
// 네이버 블로그 임시저장 자동화 — 글·사진·태그·지도·동영상·소제목 서식 자동 입력 후 "저장"(임시저장)까지만.
// ⚠️ 발행 금지: 진짜 발행 버튼(seOnePublishBtn)은 발행 차단 가드로 원천 차단된다. 이 가드를 절대 제거하지 말 것.
//
// 사용: node scripts/naver_draft.js drafts/<초안>.json [--dry-run] [--keep-open]
//   --dry-run   저장 클릭만 생략 (셀렉터 디버깅 중 "저장 글" 목록에 실패본이 쌓이지 않게) — 셀렉터 수정 중엔 항상 이걸로 먼저
//   --keep-open 끝난 뒤 브라우저를 닫지 않음 (눈으로 확인할 때)
//
// 입력 순서(실측): 본문 전체 → 동영상(첫 text 블록 직후) → 지도(맨 끝) → 본문 첫 줄 보정 → 제목(맨 마지막) → 태그 → 저장 → 이중 검증

const fs = require('fs');
const path = require('path');
const {
  SEL,
  DRAFTS_DIR,
  sleep,
  launchContext,
  openEditor,
  dismissEntryPopups,
  assertPublishGuard,
} = require('./lib/naver');
const { loadDraft, checkDraft, toManualText, resolvePath, strip } = require('./lib/draft');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const KEEP_OPEN = args.includes('--keep-open');
const draftArg = args.find((a) => !a.startsWith('--'));

const results = {
  본문: { ok: null, note: '' },
  소제목: { ok: null, note: '' },
  사진: { ok: null, note: '' },
  동영상: { ok: null, note: '' },
  지도: { ok: null, note: '' },
  제목: { ok: null, note: '' },
  태그: { ok: null, note: '' },
  저장: { ok: null, note: '' },
  대조검증: { ok: null, note: '' },
};
const setResult = (k, ok, note = '') => (results[k] = { ok, note });
const log = (...m) => console.log(...m);

// ─── 입력 유틸 ────────────────────────────────────────────────────────────────
// 한글은 반드시 keyboard.insertText (type 은 IME 조합이 꼬임). 이모지는 별도 호출로 분리 (함께 넣으면 뒤 텍스트 유실).
const EMOJI_RE = /(\p{Regional_Indicator}{2}|[0-9#*]️?⃣|\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}]|‍\p{Extended_Pictographic}️?)*)/gu;

const IS_EMOJI = new RegExp(`^${EMOJI_RE.source}$`, 'u');

async function insertText(page, text) {
  const parts = String(text).split(EMOJI_RE).filter((s) => s !== '');
  for (const part of parts) {
    await page.keyboard.insertText(part);
    await sleep(IS_EMOJI.test(part) ? 150 : 40);
  }
}

async function pressEnter(page, n = 1) {
  for (let i = 0; i < n; i += 1) {
    await page.keyboard.press('Enter');
    await sleep(80);
  }
}

// ─── 캐럿 위치 관리 ──────────────────────────────────────────────────────────
async function caretState(editor) {
  return editor.evaluate(() => {
    const comps = [...document.querySelectorAll('.se-component')].filter((c) => !c.classList.contains('se-documentTitle'));
    const last = comps[comps.length - 1];
    const sel = window.getSelection();
    const node = sel && sel.anchorNode;
    const el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
    const comp = el && el.closest ? el.closest('.se-component') : null;
    return {
      total: comps.length,
      lastIsText: !!last && last.classList.contains('se-text'),
      caretInLast: !!comp && comp === last,
      caretInCaption: !!(el && el.closest && el.closest('.se-caption')),
    };
  });
}

// 비텍스트 컴포넌트(사진/인용구/구분선/동영상) 뒤에 이어 쓸 빈 텍스트 문단으로 캐럿을 옮긴다.
async function ensureCaretAtEnd(page, editor) {
  let st = await caretState(editor);
  if (st.lastIsText && st.caretInLast && !st.caretInCaption) return;
  // 1) 마지막 컴포넌트가 텍스트면 그 마지막 문단 끝으로
  if (st.lastIsText) {
    await editor.locator(`.se-component.se-text ${SEL.bodyParagraph}`).last().click();
    await page.keyboard.press('End');
    st = await caretState(editor);
    if (st.caretInLast) return;
  }
  // 2) 마지막 컴포넌트 아래 여백 클릭 (에디터가 뒤에 빈 문단을 만든다)
  const box = await editor.locator(SEL.component).last().boundingBox();
  if (box) {
    await page.mouse.click(box.x + Math.min(200, box.width / 2), box.y + box.height + 25);
    await sleep(300);
    st = await caretState(editor);
    if (st.lastIsText && st.caretInLast) return;
  }
  // 3) 마지막 컴포넌트를 선택하고 아래 방향키 → Enter
  await editor.locator(SEL.component).last().click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('ArrowDown');
  await sleep(200);
  st = await caretState(editor);
  if (st.lastIsText && st.caretInLast) return;
  await pressEnter(page);
  st = await caretState(editor);
  if (st.lastIsText && st.caretInLast) return;
  throw new Error('마지막 컴포넌트 뒤로 캐럿을 옮기지 못했습니다 — probe_selectors.js 로 실제 DOM을 확인하세요.');
}

async function waitCountIncrease(editor, selector, before, timeout = 60000) {
  await editor.waitForFunction(
    ([s, n]) => document.querySelectorAll(s).length > n,
    [selector, before],
    { timeout, polling: 300 },
  );
}

// 팝업을 확실히 닫지 않으면 dim 레이어가 남아 이후 모든 클릭이 "intercepts pointer events" 로 실패한다.
async function clearDim(editor, page) {
  for (const f of [editor, page.mainFrame()]) {
    await f
      .evaluate(() => {
        document.querySelectorAll('.se-popup-dim, .se-popup-dim-transparent').forEach((d) => {
          const st = getComputedStyle(d);
          if (st.display !== 'none' && st.visibility !== 'hidden') d.remove();
        });
      })
      .catch(() => {});
  }
}

// ─── 서식 (소제목) ────────────────────────────────────────────────────────────
// 볼드 토글 금지 — 문단 서식 드롭다운 사용. 순서: 서식 → 크기 → 텍스트 입력.
async function pickToolbarOption(editor, buttonSel, { text, classPart }) {
  await editor.locator(buttonSel).first().click();
  await sleep(250);
  let opt = null;
  if (classPart) {
    const byClass = editor.locator(`button[class*="${classPart}"], li[class*="${classPart}"] button`).filter({ visible: true });
    if (await byClass.count()) opt = byClass.first();
  }
  if (!opt && text) {
    const re = new RegExp(`^\\s*${text}\\s*$`);
    const byText = editor.locator('.se-toolbar-option button, .se-toolbar-layer button, [class*="option"] button, [role="menu"] button, li button').filter({ hasText: re, visible: true });
    if (await byText.count()) opt = byText.first();
  }
  if (!opt) {
    await editor.page().keyboard.press('Escape');
    throw new Error(`툴바 옵션을 찾지 못했습니다: ${buttonSel} → ${text || classPart}`);
  }
  await opt.click();
  await sleep(200);
}

async function formatLabel(editor) {
  return (await editor.locator(SEL.textFormatButton).first().innerText().catch(() => '')).trim();
}

async function setTextFormat(editor, label) {
  await pickToolbarOption(editor, SEL.textFormatButton, { text: label });
  const now = await formatLabel(editor);
  if (!now.includes(label)) throw new Error(`문단 서식 "${label}" 적용 확인 실패 (현재 라벨: "${now}")`);
}

async function setFontSize(editor, size) {
  await pickToolbarOption(editor, SEL.fontSizeButton, { classPart: `fs${size}`, text: String(size) });
}

// ─── 블록별 입력 ─────────────────────────────────────────────────────────────
async function typeLines(page, text) {
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i]) await insertText(page, lines[i]);
    if (i < lines.length - 1) await pressEnter(page);
  }
}

async function insertSubtitle(page, editor, text) {
  await setTextFormat(editor, '소제목');
  try {
    await setFontSize(editor, 19);
  } catch (e) {
    results.소제목.note += `크기19 실패(${e.message}) `;
  }
  await insertText(page, text);
  const label = await formatLabel(editor);
  if (!label.includes('소제목')) throw new Error(`소제목 서식 검증 실패 (라벨: "${label}")`);
  await pressEnter(page);
  await setTextFormat(editor, '본문'); // 다음 문단은 "본문" 으로 명시 복귀
}

async function insertImage(page, editor, block) {
  const abs = resolvePath(block.path);
  const before = await editor.locator(SEL.imageComponent).count();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 20000 }),
    editor.locator(SEL.imageButton).first().click(),
  ]);
  await chooser.setFiles(abs);
  await waitCountIncrease(editor, SEL.imageComponent, before, 90000);
  // 업로드 완료(썸네일 src) 대기
  await editor
    .waitForFunction(
      ([s, i]) => {
        const c = document.querySelectorAll(s)[i];
        const img = c && c.querySelector('img');
        return !!(img && img.getAttribute('src') && !/^blob:|^data:/.test(img.getAttribute('src')));
      },
      [SEL.imageComponent, before],
      { timeout: 90000, polling: 500 },
    )
    .catch(() => {});
  if (block.caption) {
    const comp = editor.locator(SEL.imageComponent).nth(before);
    const cap = comp.locator('.se-caption p.se-text-paragraph, .se-caption [contenteditable="true"], .se-caption').first();
    try {
      await cap.click({ timeout: 5000 });
      await insertText(page, block.caption);
    } catch (e) {
      results.사진.note += `캡션 입력 실패(${path.basename(abs)}) `;
    }
  }
  await ensureCaretAtEnd(page, editor);
}

async function insertQuote(page, editor, text) {
  const before = await editor.locator(SEL.quoteComponent).count();
  await editor.locator(SEL.quoteButton).first().click();
  await waitCountIncrease(editor, SEL.quoteComponent, before, 10000);
  await sleep(200);
  await typeLines(page, text);
  await ensureCaretAtEnd(page, editor);
}

async function insertDivider(page, editor) {
  const before = await editor.locator(SEL.hrComponent).count();
  await editor.locator(SEL.hrButton).first().click();
  await waitCountIncrease(editor, SEL.hrComponent, before, 10000);
  await ensureCaretAtEnd(page, editor);
}

// ─── 동영상 (항상 첫 text 블록 직후) ──────────────────────────────────────────
async function insertVideo(page, editor, draft) {
  const abs = resolvePath(draft.video.path);
  const title = String(draft.video.title || draft.title || '동영상').slice(0, 40); // 40자 제한: video.title > 글 제목 > 기본값
  const before = await editor.locator(SEL.videoComponent).count();
  await editor.locator(SEL.videoButton).first().click();
  const popup = editor.locator(SEL.videoPopup).first();
  await popup.waitFor({ state: 'visible', timeout: 15000 });
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 20000 }),
      popup.locator(SEL.videoAddButton).first().click(),
    ]);
    await chooser.setFiles(abs);
    const titleInput = editor.locator(SEL.videoTitleInput).first();
    await titleInput.waitFor({ state: 'visible', timeout: 60000 });
    await titleInput.fill(title);
    if ((await titleInput.inputValue()) !== title) throw new Error('동영상 제목 입력 확인 실패');
    log(`  … 동영상 업로드 중 (수 분 걸릴 수 있어요): ${path.basename(abs)}`);
    const confirm = popup.locator('button').filter({ hasText: /^\s*(완료|확인|등록|첨부)\s*$/ }).last();
    await confirm.waitFor({ state: 'visible', timeout: 60000 });
    const deadline = Date.now() + 10 * 60 * 1000;
    while (!(await confirm.isEnabled()) && Date.now() < deadline) await sleep(2000);
    await confirm.click();
    await waitCountIncrease(editor, SEL.videoComponent, before, 10 * 60 * 1000);
    setResult('동영상', true, `${path.basename(abs)} / 제목 "${title}"`);
  } finally {
    if (await popup.isVisible().catch(() => false)) {
      await editor.locator(SEL.videoCloseButton).first().click({ timeout: 3000 }).catch(() => {});
      await sleep(300);
      if (await popup.isVisible().catch(() => false)) {
        await editor.evaluate((s) => document.querySelectorAll(s).forEach((p) => p.remove()), SEL.videoPopup).catch(() => {});
      }
    }
    await clearDim(editor, page);
  }
  await ensureCaretAtEnd(page, editor);
}

// ─── 지도(플레이스) — 글 맨 끝 ────────────────────────────────────────────────
async function insertPlace(page, editor, place) {
  const before = await editor.locator(SEL.placeComponent).count();
  await editor.locator(SEL.mapButton).first().click();
  const popup = editor.locator(SEL.popup).filter({ has: editor.locator('input') }).last();
  await popup.waitFor({ state: 'visible', timeout: 15000 });
  try {
    const input = popup.locator('input[type="text"], input[placeholder*="장소"], input[placeholder*="검색"]').first();
    await input.click();
    await input.fill(place.query);
    await page.keyboard.press('Enter');
    await sleep(1500);
    const items = popup.locator('li').filter({ visible: true });
    const n = await items.count();
    if (n === 0) {
      setResult('지도', false, `검색 0건 "${place.query}" — ❗수동 첨부 필요`);
      return;
    }
    const names = [];
    for (let i = 0; i < n; i += 1) names.push(((await items.nth(i).innerText().catch(() => '')) || '').split('\n')[0]);
    const target = strip(place.name);
    let idx = names.findIndex((t) => strip(t) === target);
    let how = '정확 일치';
    if (idx < 0) {
      idx = names.findIndex((t) => strip(t).includes(target) || (strip(t) && target.includes(strip(t))));
      how = '부분 포함';
    }
    if (idx < 0) {
      idx = 0;
      how = '첫 결과';
    }
    const item = items.nth(idx);
    // "추가" 버튼은 hover 전에는 not visible → hover 후 클릭, 폴백은 DOM 직접 click
    await item.hover();
    await sleep(300);
    const addBtn = item.locator('button').filter({ hasText: /추가/ }).first();
    try {
      await addBtn.click({ timeout: 3000 });
    } catch (_) {
      await addBtn.evaluate((b) => b.click());
    }
    const confirm = popup.locator('button').filter({ hasText: /^\s*확인\s*$/ }).last();
    await editor.waitForFunction((b) => b && !b.disabled, await confirm.elementHandle(), { timeout: 10000 }).catch(() => {});
    await confirm.click();
    await waitCountIncrease(editor, SEL.placeComponent, before, 15000);
    setResult('지도', true, `"${names[idx]}" (${how})`);
  } finally {
    // 장소 팝업은 Escape 로 안 닫힌다 → 반드시 닫기 버튼
    if (await popup.isVisible().catch(() => false)) {
      await popup.locator(SEL.popupClose).first().click({ timeout: 3000 }).catch(() => {});
    }
    await clearDim(editor, page);
  }
}

// ─── 본문 첫 줄 보정 / 제목 ──────────────────────────────────────────────────
async function verifyFirstLine(page, editor, draft) {
  const firstText = draft.blocks.find((b) => b.type === 'text');
  if (!firstText) return;
  const expected = String(firstText.text).split('\n').find((l) => l.trim()) || '';
  const head = strip(expected).slice(0, 12);
  const firstPara = editor.locator(`.se-component.se-text ${SEL.bodyParagraph}`).first();
  const actual = strip(await firstPara.innerText().catch(() => ''));
  if (actual.startsWith(head)) return;
  log(`  ⚠ 본문 첫 줄 누락 감지 → 맨 앞에 보정 삽입: "${expected.slice(0, 20)}…"`);
  await firstPara.click();
  await page.keyboard.press('Home');
  await insertText(page, expected);
  await pressEnter(page);
  results.본문.note += '첫 줄 보정 삽입 ';
}

async function readTitle(editor) {
  return (await editor.locator(SEL.title).first().innerText().catch(() => '')).replace(/\n/g, '').trim();
}

async function inputTitle(page, editor, title) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const tp = editor.locator(SEL.titleParagraph).first();
    const target = (await tp.count()) ? tp : editor.locator(SEL.title).first();
    await target.click();
    if (attempt > 1 || (await readTitle(editor))) {
      // 전체 선택·삭제 후 재입력 (제목 문단만 선택: 트리플 클릭)
      await target.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await sleep(150);
    }
    await insertText(page, title);
    await sleep(300);
    const got = await readTitle(editor);
    if (strip(got) === strip(title)) {
      setResult('제목', true, attempt > 1 ? `${attempt}회차에 일치` : '');
      return;
    }
    log(`  ⚠ 제목 불일치 (${attempt}회차): "${got}" → 재입력`);
  }
  throw new Error('제목을 3회 입력했지만 초안과 일치하지 않습니다.');
}

// ─── 태그 (발행 패널) ────────────────────────────────────────────────────────
async function inputTags(page, editor, tags) {
  const clean = [...new Set(tags.map((t) => String(t).replace(/^#+/, '').trim()).filter(Boolean))].slice(0, 30);
  if (!clean.length) {
    setResult('태그', null, '태그 없음');
    return;
  }
  await assertPublishGuard(page, editor); // 패널 안에 진짜 발행 버튼이 있으므로 가드가 전제
  const frames = [editor, page.mainFrame()];
  let toggleFrame = null;
  for (const f of frames) {
    const cand = f.locator(SEL.publishToggle).filter({ hasNot: f.locator(SEL.realPublish) });
    if (await cand.count()) {
      toggleFrame = f;
      break;
    }
  }
  if (!toggleFrame) throw new Error('우상단 발행(패널 열기) 버튼을 찾지 못했습니다.');
  const toggle = toggleFrame.locator(SEL.publishToggle).first();
  if ((await toggle.getAttribute('data-testid')) === 'seOnePublishBtn') throw new Error('패널 토글 대신 진짜 발행 버튼이 잡혔습니다 — 중단.');
  await toggle.click();

  let tagFrame = null;
  for (let i = 0; i < 20 && !tagFrame; i += 1) {
    for (const f of frames) if (await f.locator(SEL.tagInput).isVisible().catch(() => false)) tagFrame = f;
    if (!tagFrame) await sleep(300);
  }
  if (!tagFrame) throw new Error('태그 입력란(input#tag-input)을 찾지 못했습니다.');
  const input = tagFrame.locator(SEL.tagInput);
  for (const t of clean) {
    await input.click();
    await insertText(page, t);
    await page.keyboard.press('Enter'); // 칩 확정
    await sleep(250);
  }
  // 검증: 칩 클래스는 해시가 바뀌므로 의존 금지 → 태그 영역 텍스트를 # 로 쪼개 센다
  const areaText = await input.evaluate((el) => {
    let node = el.parentElement;
    for (let i = 0; i < 4 && node && !/#/.test(node.innerText || ''); i += 1) node = node.parentElement;
    return node ? node.innerText : '';
  });
  const got = areaText.split('#').map((s) => s.trim().split('\n')[0].trim()).filter(Boolean);
  const missing = clean.filter((t) => !got.some((g) => strip(g) === strip(t)));
  await page.keyboard.press('Escape'); // 패널만 닫기
  await sleep(400);
  if (await tagFrame.locator(SEL.tagInput).isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await sleep(300);
  }
  if (missing.length) setResult('태그', false, `${clean.length - missing.length}/${clean.length} 입력, 누락: ${missing.join(', ')} — ❗수동 필요`);
  else setResult('태그', true, `${clean.length}개`);
}

// ─── 임시저장 ────────────────────────────────────────────────────────────────
async function clickSave(page, editor) {
  for (const f of [editor, page.mainFrame()]) {
    const btn = f.locator(SEL.saveButton).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      return;
    }
  }
  for (const f of [editor, page.mainFrame()]) {
    const btn = f.locator('button').filter({ hasText: /^\s*저장\s*$/ }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      return;
    }
  }
  throw new Error('임시저장(저장) 버튼을 찾지 못했습니다.');
}

// ─── 이중 검증: 스크린샷 + 전체 텍스트 덤프 대조 ─────────────────────────────
async function dumpEditor(editor) {
  return editor.evaluate(() => {
    const title = (document.querySelector('.se-title-text') || {}).innerText || '';
    const comps = [...document.querySelectorAll('.se-component')]
      .filter((c) => !c.classList.contains('se-documentTitle'))
      .map((c) => {
        const cls = [...c.classList].find((k) => k.startsWith('se-') && k !== 'se-component' && !k.startsWith('se-l-')) || 'unknown';
        return { type: cls, text: (c.innerText || '').trim() };
      });
    return { title: title.replace(/\n/g, '').trim(), components: comps };
  });
}

function compareDump(draft, dump) {
  const problems = [];
  if (strip(dump.title) !== strip(draft.title)) problems.push(`제목 불일치: 기대 "${draft.title}" / 실제 "${dump.title}"`);
  const body = strip(dump.components.map((c) => c.text).join('\n'));
  let pos = 0;
  draft.blocks.forEach((b, i) => {
    const exp = ['text', 'subtitle', 'quote'].includes(b.type) ? strip(b.text) : '';
    if (!exp) return;
    const at = body.indexOf(exp, pos);
    if (at === -1) {
      // 어디까지 일치하는지 글자 단위로 찾아 보고
      let k = exp.length;
      while (k > 0 && body.indexOf(exp.slice(0, k), pos) === -1) k -= 1;
      problems.push(`blocks[${i}] (${b.type}) 불일치 — ${k}/${exp.length}자까지 일치, 이후 기대: "${exp.slice(k, k + 20)}…"`);
    } else pos = at + exp.length;
  });
  draft.blocks
    .filter((b) => b.type === 'image' && b.caption)
    .forEach((b) => {
      if (!body.includes(strip(b.caption))) problems.push(`캡션 누락: "${b.caption}"`);
    });
  const count = (t) => dump.components.filter((c) => c.type === t).length;
  const expImg = draft.blocks.filter((b) => b.type === 'image').length;
  const expQuote = draft.blocks.filter((b) => b.type === 'quote').length;
  const expHr = draft.blocks.filter((b) => b.type === 'divider').length;
  if (count('se-image') !== expImg) problems.push(`사진 수 불일치: 기대 ${expImg} / 실제 ${count('se-image')}`);
  if (count('se-quotation') !== expQuote) problems.push(`인용구 수 불일치: 기대 ${expQuote} / 실제 ${count('se-quotation')}`);
  if (count('se-horizontalLine') !== expHr) problems.push(`구분선 수 불일치: 기대 ${expHr} / 실제 ${count('se-horizontalLine')}`);
  if (draft.video && results.동영상.ok && count('se-video') < 1) problems.push('동영상 컴포넌트가 없습니다.');
  if (draft.place && results.지도.ok && count('se-placesMap') < 1) problems.push('지도 컴포넌트가 없습니다.');
  return problems;
}

function printResults() {
  const icon = (r) => (r.ok === true ? '✅' : r.ok === false ? '❗수동 필요' : '—');
  log('\n===== 자동 처리 결과 =====');
  for (const [k, r] of Object.entries(results)) log(`${k.padEnd(5, '　')} ${icon(r)} ${r.note || ''}`.trimEnd());
  log('==========================');
}

function bumpAttempts(base, ok) {
  const f = path.join(DRAFTS_DIR, `${base}.attempts.json`);
  let n = 0;
  try {
    n = JSON.parse(fs.readFileSync(f, 'utf8')).failures || 0;
  } catch (_) {}
  n = ok ? 0 : n + 1;
  fs.writeFileSync(f, JSON.stringify({ failures: n, updatedAt: new Date().toISOString() }, null, 2));
  return n;
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  if (!draftArg) {
    console.error('사용법: node scripts/naver_draft.js drafts/<초안>.json [--dry-run] [--keep-open]');
    process.exit(1);
  }
  const draft = loadDraft(draftArg);
  const base = path.basename(draft.__file, '.json');
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });

  // 자동 임시저장은 실제 사진 파일이 있어야 한다 (모바일 수동 모드 초안이라도 파일이 준비돼 있어야 함)
  const missing = draft.blocks.filter((b) => b.type === 'image' && (!b.path || !fs.existsSync(resolvePath(b.path))));
  if (missing.length) {
    console.error(`❌ 사진 파일 ${missing.length}장이 없습니다 — PC 자동 임시저장은 input/photos/ 에 파일이 있어야 해요. (모바일에서는 scripts/mobile_kit.js 로 수동 붙여넣기)`);
    missing.slice(0, 5).forEach((b) => console.error(`  - ${b.path || '(path 없음)'} ${b.label ? `— ${b.label}` : ''}`));
    process.exit(1);
  }
  const check = checkDraft(draft);
  if (check.errors.length) {
    console.error('❌ 초안 오류 — 임시저장 전에 수정하세요:');
    check.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  log(`▶ ${DRY_RUN ? '[DRY-RUN — 저장 클릭 생략] ' : ''}${draft.title}`);

  const context = await launchContext({ headless: false });
  const page = context.pages()[0] || (await context.newPage());
  page.on('console', (m) => {
    if (/publish-guard/.test(m.text())) log(`  🛡 ${m.text()}`);
  });
  let editor;
  let fatal = null;
  try {
    editor = await openEditor(page, { log });
    await dismissEntryPopups(editor, log);

    // 1) 본문 전체 (제목은 맨 마지막 — 제목 직후 본문을 치면 레이스 컨디션으로 섞임)
    await editor.locator(SEL.bodyParagraph).first().click();
    const firstTextIdx = draft.blocks.findIndex((b) => b.type === 'text');
    let subtitleOk = 0;
    let subtitleFail = 0;
    let imagesOk = 0;
    for (let i = 0; i < draft.blocks.length; i += 1) {
      const b = draft.blocks[i];
      const next = draft.blocks[i + 1];
      log(`  [${i + 1}/${draft.blocks.length}] ${b.type}${b.text ? `: ${String(b.text).split('\n')[0].slice(0, 24)}…` : b.path ? `: ${path.basename(b.path)}` : ''}`);
      if (b.type === 'text') {
        await typeLines(page, b.text);
        if (i === firstTextIdx && draft.video) {
          await pressEnter(page);
          try {
            await insertVideo(page, editor, draft);
          } catch (e) {
            setResult('동영상', false, `${e.message} — ❗수동 첨부 필요`);
            await clearDim(editor, page);
            await ensureCaretAtEnd(page, editor);
          }
        } else if (next) {
          await pressEnter(page, next.type === 'text' ? 2 : 1); // text 가 연달아 올 때만 빈 줄 하나 더
        }
      } else if (b.type === 'subtitle') {
        try {
          await insertSubtitle(page, editor, b.text);
          subtitleOk += 1;
        } catch (e) {
          subtitleFail += 1;
          results.소제목.note += `"${b.text.slice(0, 10)}" 실패(${e.message}) `;
          await page.keyboard.press('Escape').catch(() => {});
          const got = strip(await editor.locator(`.se-component.se-text ${SEL.bodyParagraph}`).last().innerText().catch(() => ''));
          if (!got.endsWith(strip(b.text))) await insertText(page, b.text); // 서식 실패여도 글은 남긴다
          await pressEnter(page);
        }
      } else if (b.type === 'image') {
        await insertImage(page, editor, b);
        imagesOk += 1;
      } else if (b.type === 'quote') {
        await insertQuote(page, editor, b.text);
      } else if (b.type === 'divider') {
        await insertDivider(page, editor);
      }
    }
    const subtitleTotal = draft.blocks.filter((b) => b.type === 'subtitle').length;
    if (subtitleTotal) setResult('소제목', subtitleFail === 0, `${subtitleOk}/${subtitleTotal} 서식 적용 ${results.소제목.note}`.trim());
    const imgTotal = draft.blocks.filter((b) => b.type === 'image').length;
    if (imgTotal) setResult('사진', imagesOk === imgTotal && !results.사진.note, `${imagesOk}/${imgTotal}장 ${results.사진.note}`.trim());

    // 2) 지도 — 글 맨 끝
    if (draft.place) {
      try {
        await ensureCaretAtEnd(page, editor);
        await insertPlace(page, editor, draft.place);
      } catch (e) {
        setResult('지도', false, `${e.message} — ❗수동 첨부 필요`);
        await clearDim(editor, page);
      }
    }

    // 3) 본문 첫 줄 누락 검사 → 4) 제목(맨 마지막)
    await verifyFirstLine(page, editor, draft);
    setResult('본문', true, results.본문.note.trim());
    await inputTitle(page, editor, draft.title);

    // 5) 태그 (발행 패널 열기 → 입력 → Escape 로 패널만 닫기)
    if (draft.tags && draft.tags.length) {
      try {
        await inputTags(page, editor, draft.tags);
      } catch (e) {
        setResult('태그', false, `${e.message} — ❗수동 필요`);
        await page.keyboard.press('Escape').catch(() => {});
      }
    }

    // 6) 임시저장
    await assertPublishGuard(page, editor);
    if (DRY_RUN) setResult('저장', null, 'DRY-RUN — 저장 클릭 생략');
    else {
      await clickSave(page, editor);
      await sleep(2500);
      setResult('저장', true, '임시저장 클릭 완료 — 네이버 "저장 글" 목록에서 확인');
    }

    // 7) 이중 검증 — (a) 스크린샷 (b) 전체 텍스트 덤프 대조 (본검증)
    const shot = path.join(DRAFTS_DIR, `${base}.screenshot.png`);
    await page.screenshot({ path: shot });
    const dump = await dumpEditor(editor);
    fs.writeFileSync(path.join(DRAFTS_DIR, `${base}.dump.json`), JSON.stringify(dump, null, 2));
    fs.writeFileSync(
      path.join(DRAFTS_DIR, `${base}.dump.txt`),
      [`[제목] ${dump.title}`, '', ...dump.components.map((c) => `[${c.type}]\n${c.text}\n`)].join('\n'),
    );
    const problems = compareDump(draft, dump);
    if (problems.length) {
      setResult('대조검증', false, `불일치 ${problems.length}건 — drafts/${base}.dump.txt 확인`);
      problems.forEach((p) => log(`  ✗ ${p}`));
    } else setResult('대조검증', true, `제목·본문 전문 일치 (덤프: drafts/${base}.dump.txt, 스크린샷: ${path.basename(shot)})`);

    const blocked = await editor.evaluate(() => window.__publishBlockedCount || 0).catch(() => 0);
    if (blocked) log(`  🛡 발행 버튼 클릭 ${blocked}회 차단됨`);
  } catch (e) {
    fatal = e;
    console.error(`\n❌ 오류: ${e.message}`);
    await page.screenshot({ path: path.join(DRAFTS_DIR, `${base}.error.png`) }).catch(() => {});
  } finally {
    printResults();
    const ok = !fatal && results.대조검증.ok === true;
    const failures = bumpAttempts(base, ok);
    if (!ok) {
      const manual = path.join(DRAFTS_DIR, `${base}.manual.txt`);
      fs.writeFileSync(manual, toManualText(draft));
      log(`\n수동 붙여넣기용 원고: drafts/${base}.manual.txt (연속 실패 ${failures}회${failures >= 3 ? ' — 3회 이상: 수동 원고로 진행 안내' : ''})`);
    }
    if (!KEEP_OPEN) await context.close();
    else {
      log('\n--keep-open: 확인이 끝나면 브라우저 창을 직접 닫으세요.');
      await new Promise((r) => context.on('close', r));
    }
    process.exit(fatal ? 1 : results.대조검증.ok === false ? 2 : 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
