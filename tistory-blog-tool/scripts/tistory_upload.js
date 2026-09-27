#!/usr/bin/env node
// 품질 게이트를 통과한 글을 티스토리에 올린다. 기본 = 비공개 저장 (사람이 보고 공개 전환).
//
//   node scripts/tistory_upload.js <날짜|글.md ...> [--only 1,3] [--dry-run] [--schedule | --public]
//
//   (기본)       비공개 저장 — 승인 없이도 가능 (공개되지 않음)
//   --schedule   예약 발행 — front matter approved: true + 검수 점수 ≥ minReviewScore 필수
//                시간: front matter schedule("YYYY-MM-DD HH:MM") 또는 config.scheduleSlots + 지터
//   --public     즉시 공개 발행 — 승인 조건 동일
//   --dry-run    저장 버튼만 누르지 않고 끝까지 입력·검증 (셀렉터 점검용)
//
// 안전장치: 오류 있는 글·예시 글·이미 올린 글 거부 / 하루 한도(dailyQuota) / 편집기에 다른 원고가 있으면 중단 /
//          예약을 의도했는데 버튼이 "공개 발행"이면 누르지 않음 / 저장 후 실제 글 본문 대조.

const fs = require('fs');
const path = require('path');
const { loadConfig, loadPost, loadAllPosts, loadExisting, updateMeta, parseArgs, resolveTargets, outPathsFor, isUnset, DATA_DIR, ROOT } = require('./lib/core');
const { checkPost, linkIndexFrom, strip } = require('./lib/checks');
const { renderPost } = require('./lib/render');
const { launchProfile } = require('./lib/browser');
const { SEL, DIALOG, normBlog } = require('./lib/tistory');

class Stop extends Error {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// ── 발행 시각 계산 ──
function scheduleFor(post, indexInDay, config, taken) {
  if (post.meta.schedule) {
    const d = new Date(String(post.meta.schedule).replace(' ', 'T'));
    if (isNaN(d)) throw new Stop(`schedule 형식 오류: ${post.meta.schedule} (YYYY-MM-DD HH:MM)`);
    return d;
  }
  const slots = config.scheduleSlots || ['09:00', '12:00', '15:00', '18:00', '21:00'];
  const jitter = config.scheduleJitterMinutes || 0;
  const gap = (config.minGapMinutes || 60) * 60000;
  const date = path.basename(post.dir);
  const minTime = Date.now() + 30 * 60000;
  for (let day = 0; day < 3; day++) {
    for (let k = 0; k < slots.length; k++) {
      const [h, mi] = slots[(indexInDay + k) % slots.length].split(':').map(Number);
      const d = new Date(`${date}T00:00:00`);
      d.setDate(d.getDate() + day);
      d.setHours(h, mi + ((hash(post.meta.slug) % (2 * jitter + 1)) - jitter), 0, 0);
      if (d.getTime() < minTime) continue;
      if (taken.some((t) => Math.abs(t - d.getTime()) < gap)) continue;
      return d;
    }
  }
  throw new Stop('비어 있는 예약 시간대를 찾지 못했습니다 — front matter schedule 을 직접 지정하세요.');
}

// ── 사전 게이트 (브라우저 열기 전) ──
function gate(post, mode, config, ctx, uploadedToday) {
  const m = post.meta;
  if (m.example === true) throw new Stop('예시 글(example: true)은 올리지 않습니다.');
  if (m.url) throw new Stop(`이미 올린 글입니다: ${m.url}`);
  if (m.status === 'held') throw new Stop('보류(held)된 글입니다.');
  if (m.refreshOf) throw new Stop('기존 글 갱신 원고입니다 — 새 글로 올리면 키워드 잠식이 생깁니다. 티스토리에서 원래 글을 열어 HTML 모드에 out/…tistory.html 을 붙여넣으세요.');
  const r = checkPost(post, ctx);
  if (r.errors.length) throw new Stop(`품질 게이트 오류 ${r.errors.length}개 — npm run check 로 확인:\n    - ${r.errors.slice(0, 5).join('\n    - ')}`);
  if (mode !== 'private') {
    if (m.approved !== true) throw new Stop('공개·예약 발행은 사용자 승인(approved: true) 후에만 — 채팅에서 승인받으세요.');
    const score = m.review && Number(m.review.score);
    if (!(score >= (config.minReviewScore || 80))) throw new Stop(`검수 점수 ${score || '없음'} < ${config.minReviewScore || 80} — quality-reviewer 검수 후 다시.`);
  }
  if (uploadedToday >= (config.dailyQuota || 5)) throw new Stop(`오늘 이미 ${uploadedToday}개 올렸습니다 — 하루 한도 ${config.dailyQuota || 5}개.`);
  return r;
}

async function assertLoggedIn(page, blog) {
  if (new URL(page.url()).origin !== blog) throw new Stop(`로그인이 필요합니다 (현재 ${page.url()}) — npm run login 으로 다시 로그인하세요.`);
}

async function firstVisible(page, selectors) {
  for (const s of selectors) {
    const loc = page.locator(s).first();
    if (await loc.isVisible().catch(() => false)) return loc;
  }
  return null;
}

async function switchToHtml(page) {
  if (!(await page.locator(SEL.modeHtml).isVisible().catch(() => false))) await page.locator(SEL.modeLayerOpen).click();
  await page.locator(SEL.modeHtml).click();
  await page.locator(SEL.codeMirror).first().waitFor({ timeout: 10000 });
}

async function setHtml(page, html) {
  const ok = await page.evaluate(
    ({ sel, html }) => {
      const el = document.querySelector(sel.split(',')[0]) || document.querySelector('.CodeMirror');
      if (!el || !el.CodeMirror) return false;
      el.CodeMirror.setValue(html);
      el.CodeMirror.save && el.CodeMirror.save();
      return true;
    },
    { sel: SEL.codeMirror, html },
  );
  if (!ok) {
    // 폴백: 키보드 입력 (CodeMirror 인스턴스를 못 찾을 때)
    await page.locator('.CodeMirror textarea').first().focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(html);
  }
  const got = await page.evaluate(() => {
    const el = document.querySelector('.CodeMirror');
    return el && el.CodeMirror ? el.CodeMirror.getValue() : '';
  });
  if (strip(got).length < strip(html).length * 0.95) throw new Stop('HTML 입력 확인 실패 — 편집기 내용이 원고보다 짧습니다.');
}

async function switchToBasic(page) {
  await page.locator(SEL.htmlToggleInHtmlMode).filter({ hasText: /^HTML/ }).first().click();
  await page.getByText('기본모드', { exact: true }).filter({ visible: true }).first().click();
  await page.frameLocator(SEL.bodyFrame).locator(SEL.bodyRoot).waitFor();
}

async function attachImages(page, images, log) {
  const body = page.frameLocator(SEL.bodyFrame).locator(SEL.bodyRoot);
  const frame = page.frame({ name: SEL.bodyFrame.slice(1) });
  if (!frame) throw new Stop('본문 편집기 iframe 을 찾지 못했습니다.');
  for (const [i, img] of images.entries()) {
    log(`  사진 ${i + 1}/${images.length}: ${path.basename(img.abs)}`);
    await body.press('ControlOrMeta+End');
    await page.getByRole('button', { name: '첨부', exact: true }).click();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByText('사진', { exact: true }).filter({ visible: true }).first().click()]);
    await chooser.setFiles(img.abs);
    await frame.waitForFunction(
      (n) => {
        const imgs = Array.from(document.querySelectorAll('#tinymce img'));
        return imgs.length === n && imgs.every((x) => x.complete && x.naturalWidth > 0);
      },
      i + 1,
      { timeout: 45000 },
    );
  }
  // 대체텍스트·캡션 → 올린 순서대로, 그다음 IMGMARK 자리로 이동
  const moved = await frame.evaluate((imgs) => {
    const figs = Array.from(document.querySelectorAll('#tinymce figure[data-ke-type="image"], #tinymce figure'));
    if (figs.length !== imgs.length) return `figure ${figs.length}개 / 사진 ${imgs.length}개`;
    imgs.forEach((im, k) => {
      const tag = figs[k].querySelector('img');
      if (tag && im.alt) tag.setAttribute('alt', im.alt);
      const cap = figs[k].querySelector('figcaption');
      if (cap && im.caption) cap.textContent = im.caption;
    });
    for (const [k, im] of imgs.entries()) {
      const marks = Array.from(document.querySelectorAll('#tinymce p')).filter((p) => p.textContent.trim() === `IMGMARK-${im.index}`);
      if (marks.length !== 1) return `IMGMARK-${im.index} 위치 ${marks.length}개`;
      marks[0].replaceWith(figs[k]);
    }
    document.querySelector('#tinymce').dispatchEvent(new InputEvent('input', { bubbles: true }));
    return document.querySelector('#tinymce').textContent.includes('IMGMARK-') ? '표식이 남아 있음' : 'ok';
  }, images.map((x) => ({ index: x.index, alt: x.alt, caption: x.caption })));
  if (moved !== 'ok') throw new Stop(`사진 배치 실패: ${moved}`);
}

async function setCover(page) {
  const body = page.frameLocator(SEL.bodyFrame).locator(SEL.bodyRoot);
  await body.locator('img').first().click();
  const btn = page.locator(SEL.representBtn).first();
  if (!(await btn.count())) return false;
  const cls = (await btn.getAttribute('class')) || '';
  if (!cls.split(' ').includes('active')) await btn.click();
  return true;
}

async function setCategory(page, name) {
  await page.locator(SEL.category).click();
  const opt = page.getByRole('option', { name, exact: true }).first();
  if (!(await opt.count())) {
    await page.locator(SEL.category).click();
    throw new Stop(`블로그에 "${name}" 카테고리가 없습니다 — 티스토리 관리 > 카테고리에서 만들거나 글의 category 를 고치세요.`);
  }
  await opt.click();
}

async function setTags(page, tags) {
  const input = await firstVisible(page, SEL.tagInputs);
  if (!input) return false;
  for (const t of tags) {
    await input.fill(String(t).replace(/^#+/, '').trim());
    await page.keyboard.press('Enter');
    await sleep(150);
  }
  return true;
}

async function setReserve(page, when) {
  await page.getByText('예약', { exact: true }).filter({ visible: true }).first().click();
  await page.locator(SEL.reserveDateBtn).first().click();
  const day = String(when.getDate());
  const clicked = await page.evaluate((day) => {
    const cands = Array.from(document.querySelectorAll('.layer_calendar button, .layer_calendar td, .calendar button, .calendar td, button.btn_day, td.day, a.day'));
    const hit = cands.find((el) => el.textContent.trim() === day && !el.disabled && !/disabled|prev|next|other/.test(el.className));
    if (hit) {
      hit.click();
      return true;
    }
    return false;
  }, day);
  if (!clicked) throw new Stop('예약 달력에서 날짜를 찾지 못했습니다.');
  for (const [sel, v] of [
    [SEL.reserveHour, pad(when.getHours())],
    [SEL.reserveMinute, pad(when.getMinutes())],
  ]) {
    const inp = page.locator(sel).first();
    await inp.click({ clickCount: 3 });
    await inp.fill(v);
    await page.keyboard.press('Tab');
  }
  const shown = await page.locator(SEL.reserveDateBtn).first().innerText().catch(() => '');
  const hh = await page.locator(SEL.reserveHour).first().inputValue();
  const mm = await page.locator(SEL.reserveMinute).first().inputValue();
  if (!shown.includes(day) || Number(hh) !== when.getHours() || Number(mm) !== when.getMinutes())
    throw new Stop(`예약 시각 확인 실패 (표시 "${shown.trim()}" ${hh}:${mm}, 목표 ${fmt(when)})`);
}

async function findSavedUrl(page, blog, title) {
  await page.goto(`${blog}/manage/posts`, { waitUntil: 'domcontentloaded' });
  const link = page.getByRole('link', { name: title, exact: true }).first();
  await link.waitFor({ timeout: 15000 });
  const href = await link.getAttribute('href');
  return href ? new URL(href, blog).href : null;
}

async function verifyPublished(page, url, expectedText, imageCount) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const art = page.locator(SEL.articleBody).first();
  if (!(await art.count())) return { ok: false, note: '현재 스킨에서 본문 영역을 찾지 못함 — 브라우저로 직접 확인' };
  const got = strip(await art.innerText());
  const exp = strip(expectedText);
  const head = exp.slice(0, 40);
  const tail = exp.slice(-40);
  const imgs = await art.locator('img').count();
  const ok = got.includes(head) && got.includes(tail);
  return { ok, note: `본문 앞·뒤 대조 ${ok ? '일치' : '불일치'} · 사진 ${imgs}/${imageCount}` };
}

async function uploadOne(page, post, opts) {
  const { blog, mode, when, config, linkIndex, dryRun, log, out } = opts;
  const m = post.meta;
  const r = renderPost(post, { mode: 'tistory', config, linkIndex });
  const images = [...r.images];
  let html = r.html;
  const thumbExists = m.cover !== 'none' && fs.existsSync(out.thumb);
  if (thumbExists) {
    html = `<p data-ke-size="size16">IMGMARK-0</p>\n${html}`;
    images.unshift({ index: 0, abs: out.thumb, alt: m.title, caption: '' });
  } else if (m.cover !== 'none') log('  ⚠️ 썸네일 없음 — npm run build 를 먼저 실행하면 대표 이미지가 붙습니다.');

  await page.goto(`${blog}/manage/newpost/`, { waitUntil: 'domcontentloaded' });
  await assertLoggedIn(page, blog);
  await page.locator(SEL.title).waitFor({ timeout: 20000 });
  if ((await page.locator(SEL.title).inputValue()).trim()) throw new Stop('편집기에 다른 원고(제목)가 이미 있습니다 — 자동저장 원고를 직접 정리한 뒤 다시.');

  log('  HTML 모드 전환·원고 입력');
  await switchToHtml(page);
  await page.locator(SEL.title).fill(m.title);
  await setHtml(page, html);

  if (images.length) {
    log('  기본모드 전환·사진 첨부');
    await switchToBasic(page);
    await attachImages(page, images, log);
    if (thumbExists && !(await setCover(page))) log('  ⚠️ 대표 이미지 버튼을 못 찾음 — 발행 전 직접 지정');
  }
  if (!isUnset(m.category)) await setCategory(page, m.category);
  if (!(await setTags(page, m.tags || []))) log('  ⚠️ 태그 입력란을 못 찾음 — 직접 입력 필요');
  if ((await page.locator(SEL.title).inputValue()) !== m.title) throw new Stop('제목 확인 실패');

  await page.locator(SEL.publishLayer).click();
  const vis = mode === 'private' ? 'private' : 'public';
  await page.locator(SEL.visibility[vis]).check();
  if (mode === 'schedule') await setReserve(page, when);
  const btnText = (await page.locator(SEL.publishBtn).innerText()).trim();
  log(`  발행 레이어 버튼: "${btnText}"`);
  if (mode === 'private' && btnText !== '비공개 저장') throw new Stop(`비공개 설정 확인 실패 (버튼 "${btnText}")`);
  if (mode === 'schedule' && !/예약/.test(btnText)) throw new Stop(`예약 설정이 버튼에 반영되지 않았습니다 ("${btnText}") — 즉시 공개될 수 있어 누르지 않았습니다.`);
  if (mode === 'public' && !/공개/.test(btnText)) throw new Stop(`공개 설정 확인 실패 ("${btnText}")`);

  fs.mkdirSync(out.dir, { recursive: true });
  const shot = out.uploadLog.replace(/\.upload\.log\.txt$/, '.upload.png');
  await page.screenshot({ path: shot });
  if (dryRun) {
    log(`  🧪 dry-run — 저장하지 않음 (화면: ${path.relative(ROOT, shot)})`);
    await page.keyboard.press('Escape');
    return { dry: true };
  }
  await page.locator(SEL.publishBtn).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/manage/newpost'), { timeout: 30000 });
  const url = await findSavedUrl(page, blog, m.title);
  const patch = {
    status: 'uploaded',
    url,
    visibility: mode === 'private' ? 'private' : 'public',
    uploadedAt: new Date().toISOString(),
  };
  if (mode === 'schedule') patch.scheduledAt = fmt(when);
  updateMeta(post.file, patch);
  const v = url ? await verifyPublished(page, url, r.bodyText, images.length) : { ok: false, note: '글 주소를 찾지 못함' };
  log(`  ${v.ok ? '✅' : '❗'} 저장 확인: ${v.note}`);
  return { url, verify: v };
}

function markQueueDone(rel) {
  const f = path.join(DATA_DIR, 'topic-queue.json');
  if (!fs.existsSync(f)) return;
  const q = JSON.parse(fs.readFileSync(f, 'utf8'));
  const t = q.topics.find((x) => x.post === rel);
  if (t) {
    t.status = 'done';
    fs.writeFileSync(f, JSON.stringify(q, null, 2) + '\n');
  }
}

async function main() {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  if (isUnset(config.blogUrl)) throw new Stop('config/blog.json 의 blogUrl 이 비어 있습니다 — /setup-blog 먼저.');
  const blog = normBlog(config.blogUrl);
  const mode = opt.schedule ? 'schedule' : opt.public ? 'public' : 'private';
  const dryRun = !!opt['dry-run'];
  let files = resolveTargets(pos);
  if (opt.only) {
    const nums = String(opt.only).split(',').map((s) => pad(Number(s.trim())));
    files = files.filter((f) => nums.includes(path.basename(f).split('-')[0]));
  }
  if (!files.length) throw new Stop('올릴 글이 없습니다.');

  const allPosts = loadAllPosts();
  const existing = loadExisting();
  const ctx = { config, allPosts, existing };
  const linkIndex = linkIndexFrom(allPosts, existing);
  const todayStr = new Date().toDateString();
  let uploadedToday = allPosts.filter((p) => p.meta.uploadedAt && new Date(p.meta.uploadedAt).toDateString() === todayStr).length;
  const taken = allPosts.filter((p) => p.meta.scheduledAt).map((p) => new Date(String(p.meta.scheduledAt).replace(' ', 'T')).getTime());

  // 게이트 먼저 전부 — 통과한 글만 브라우저로
  const plan = [];
  for (const [i, f] of files.entries()) {
    const post = loadPost(f);
    try {
      gate(post, mode, config, ctx, uploadedToday + plan.length);
      const when = mode === 'schedule' ? scheduleFor(post, i, config, taken) : null;
      if (when) taken.push(when.getTime());
      plan.push({ post, when });
      console.log(`☑ ${post.rel}${when ? ` → 예약 ${fmt(when)}` : ''}`);
    } catch (e) {
      if (!(e instanceof Stop)) throw e;
      console.log(`⛔ ${post.rel}: ${e.message}`);
    }
  }
  if (!plan.length) {
    console.log('\n올릴 수 있는 글이 없습니다.');
    process.exit(1);
  }
  console.log(`\n${mode === 'private' ? '비공개 저장' : mode === 'schedule' ? '예약 발행' : '공개 발행'} ${plan.length}개${dryRun ? ' (dry-run)' : ''} — 브라우저를 엽니다.`);

  const context = await launchProfile();
  const page = context.pages()[0] || (await context.newPage());
  const unexpected = [];
  page.on('dialog', async (d) => {
    const msg = d.message();
    if (DIALOG.modeChange.test(msg)) return d.accept();
    if (DIALOG.autosave.test(msg)) return d.dismiss(); // 이어쓰기 거절 → 새 글
    unexpected.push(msg);
    return d.dismiss();
  });
  const results = [];
  try {
    for (const { post, when } of plan) {
      const out = outPathsFor(post);
      const lines = [];
      const log = (s) => {
        console.log(s);
        lines.push(s);
      };
      log(`\n▶ ${post.rel} — ${post.meta.title}`);
      try {
        const r = await uploadOne(page, post, { blog, mode, when, config, linkIndex, dryRun, log, out });
        if (!r.dry) {
          uploadedToday++;
          markQueueDone(post.rel);
        }
        results.push({ rel: post.rel, ok: true, ...r });
      } catch (e) {
        log(`  ❌ ${e.message.split('\n')[0]}`);
        try {
          fs.mkdirSync(out.dir, { recursive: true });
          await page.screenshot({ path: out.uploadLog.replace(/\.upload\.log\.txt$/, '.upload-fail.png') });
        } catch {}
        results.push({ rel: post.rel, ok: false, error: e.message });
        if (/로그인/.test(e.message)) break;
      } finally {
        if (unexpected.length) log(`  ❗ 예상 못 한 확인창: ${unexpected.splice(0).join(' / ')}`);
        fs.mkdirSync(out.dir, { recursive: true });
        fs.writeFileSync(out.uploadLog, lines.join('\n') + '\n');
      }
      await sleep(3000 + Math.random() * 4000);
    }
  } finally {
    await context.close();
  }
  console.log('\n===== 업로드 결과 =====');
  results.forEach((r) => console.log(`${r.ok ? (r.dry ? '🧪' : '✅') : '❌'} ${r.rel}${r.url ? ` → ${r.url}` : ''}${r.verify && !r.verify.ok ? ' (❗저장 확인 필요)' : ''}${r.error ? ` — ${r.error.split('\n')[0]}` : ''}`));
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((e) => {
  console.error(`❌ ${e instanceof Stop ? e.message : e.stack || e.message}`);
  process.exit(1);
});
