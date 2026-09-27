// 품질 게이트 — 구글 검색 스팸 정책 · 애드센스 프로그램 정책 · 가독성 · 사실 검증을 코드로 강제한다.
// ❌ 오류가 1개라도 있으면 업로드 스크립트가 거부한다. ⚠️ 경고는 고치거나 사유를 검수 보고에 적는다.
// 근거 정리: data/policy-guardrails.md

const fs = require('fs');
const path = require('path');
const { renderPost } = require('./render');
const { shingles, jaccard, titleSimilarity, normalize } = require('./similarity');
const { isUnset } = require('./core');

const FORMATS = ['guide', 'comparison', 'checklist', 'faq', 'case-study', 'review', 'explainer', 'calculator', 'news'];

// 애드센스: 광고 클릭 유도 = 무효 클릭 정책 위반 (계정 정지 사유)
const AD_CLICK_BAIT = [
  /광고[^\n.!?]{0,12}(클릭|눌러|누르|터치|봐\s*주|방문해\s*주)/,
  /(후원|응원)[^\n.!?]{0,10}광고/,
  /click\s+(on\s+)?(the\s+|our\s+)?ads?\b/i,
  /support\s+us\s+by\s+clicking/i,
];
// 애드센스 게시자 정책 — 광고 게재 불가 콘텐츠 (강: 오류 / 약: 경고, 맥락 확인)
const RESTRICTED_STRONG = ['야동', '음란물', '성인용품 후기', '토토사이트', '바카라', '사설토토', '온라인카지노', '먹튀', '대마 구매', '마약 구매', '불법 다운로드', '토렌트 다운', '크랙 다운', '시리얼 키 무료', '정품인증 크랙', '해킹 툴', '짝퉁 구매', '레플리카 구매', '총기 구매'];
const RESTRICTED_SOFT = ['카지노', '도박', '토토', '성인', '음주', '담배', '전자담배', '무료 다운로드', '레플리카', '다이어트 약'];
// AI 티 나는 상투어 — 많으면 "대량 생산 글" 인상 (구글 helpful content · 독자 이탈)
const AI_PHRASES = ['알아보겠습니다', '알아볼까요', '살펴보겠습니다', '살펴볼까요', '이번 포스팅', '이번 글에서는', '결론적으로', '요약하자면', '종합적으로', '다양한 ', '효과적인 ', '중요합니다', '도움이 되셨', '도움이 되길', '유익한 정보', '마무리하며', '마치며', '그럼 지금부터', '함께 알아', '에 대해 자세히', '것은 매우', '필수적입니다', '핵심적인 역할'];
// 낚시·과장 (저품질 · 오해 소지 제목)
const CLICKBAIT = ['충격', '경악', '소름', '무조건', '100%', '대박', '역대급', '당장', '모르면 손해', '안 보면 후회', '99%', '비밀 공개'];
const TITLE_FORBIDDEN = /[★☆♥♡◆◇■□▶▷◀【】『』「」|#@$^*+=_{}\\]/;
const FALSE_DENIAL = ['내돈내산', '내 돈 내 산', '광고 아님', '광고아님', '협찬 아님', '협찬아님', '광고 아닙니다', '협찬 아닙니다'];
const DISCLOSURE_HINTS = ['제공받', '지원받', '협찬', '광고', '수수료', '원고료', '무상으로', '체험단', '제휴'];
// YMYL: 본문 숫자(금액·기간·비율·나이 등) — 전부 facts 에 등록·검증돼야 함
const NUMBER_RE = /\d[\d,.]*\s*(?:만\s*원|억\s*원|천\s*원|원|%|퍼센트|개월|년|월|일|세|살|명|회|배|시간|분)/g;
const PLACEHOLDER_RE = /❓|\{[^}\n]{1,30}\}|\[(?:확인 ?필요|TODO|todo|미정|추가 예정)[^\]]*\]|○○|OO원|XX/g;

const strip = (s) => String(s || '').replace(/[\s​-‍﻿]/g, '');
const countOcc = (hay, needle) => {
  if (!needle) return 0;
  let n = 0;
  let i = hay.indexOf(needle);
  while (i !== -1) {
    n++;
    i = hay.indexOf(needle, i + needle.length);
  }
  return n;
};

function linkIndexFrom(allPosts, existing) {
  const idx = new Map();
  for (const e of existing || []) {
    if (e.url) {
      if (e.slug) idx.set(e.slug, e);
      if (e.title) idx.set(e.title, e);
    }
  }
  for (const p of allPosts || []) {
    const m = p.meta || {};
    if (m.slug) idx.set(m.slug, { title: m.title, url: m.url || null, slug: m.slug });
  }
  return idx;
}

/**
 * 글 1개 점검.
 * @param post      loadPost() 결과
 * @param ctx       { config, allPosts, existing }
 */
function checkPost(post, ctx = {}) {
  const config = ctx.config || {};
  const allPosts = (ctx.allPosts || []).filter((p) => p.file !== post.file && !p.error);
  const existing = ctx.existing || [];
  const m = post.meta || {};
  const errors = [];
  const warnings = [];
  const info = [];
  const stats = {};
  const E = (s) => errors.push(s);
  const W = (s) => warnings.push(s);

  // ── 필수 메타 ──
  for (const k of ['title', 'slug', 'category', 'format', 'searchIntent', 'mainKeyword', 'persona', 'infoGain']) {
    if (isUnset(m[k])) E(`front matter "${k}" 가 비어 있습니다.`);
  }
  if (m.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(m.slug))) E('slug 는 영문 소문자·숫자·하이픈만 (예: year-end-tax-preview).');
  if (m.format && !FORMATS.includes(m.format)) E(`format 은 ${FORMATS.join(' | ')} 중 하나.`);
  if (typeof m.sponsored !== 'boolean') E('sponsored(협찬·제휴 여부)를 true/false 로 명시하세요.');
  if (typeof m.ymyl !== 'boolean') E('ymyl(돈·건강·법률 등 삶에 영향 주는 주제인지)을 true/false 로 명시하세요.');
  if (!Array.isArray(m.tags) || !m.tags.length) E('tags 가 없습니다 (5~10개).');
  const cats = (config.categories || []).filter((c) => !isUnset(c));
  if (cats.length && m.category && !cats.includes(m.category)) E(`category "${m.category}" 가 config/blog.json categories 에 없습니다: ${cats.join(', ')}`);
  if (strip(m.infoGain).length < 30) E('infoGain(이 글에만 있는 정보 이득 — 직접 경험·직접 계산·비교표·원본 사진 등)을 30자 이상 구체적으로 적으세요. 없으면 쓰지 않는 게 맞습니다.');
  if (m.example === true) info.push('예시 글(example: true) — 업로드 스크립트가 거부합니다.');

  // ── 렌더링 ──
  const linkIndex = linkIndexFrom(ctx.allPosts, existing);
  const r = renderPost(post, { mode: 'tistory', config, linkIndex });
  r.problems.forEach((p) => W(p));
  const body = r.bodyText;
  const bodyNS = strip(body);
  const allText = [m.title, body].join('\n');
  stats.chars = bodyNS.length;
  stats.h2 = r.h2.length;
  stats.images = r.images.length;
  stats.tables = r.tables;
  stats.callouts = r.callouts.length;

  // ── 구조·분량 ──
  if (/^#\s/m.test(post.body)) E('본문에 # (H1) 제목이 있습니다 — 제목이 H1 이므로 본문은 ## 부터.');
  if (r.h2.length < 3) E(`소제목(##) ${r.h2.length}개 — 최소 3개 (검색 의도별 섹션).`);
  else if (r.h2.length > 9) W(`소제목 ${r.h2.length}개 — 너무 잘게 쪼갰습니다 (4~7개 권장).`);
  const L = config.length || { minError: 1500, min: 2000, max: 4500 };
  if (bodyNS.length < L.minError) E(`본문 ${bodyNS.length}자(공백 제외) — ${L.minError}자 미만은 얇은 콘텐츠(thin content) 위험.`);
  else if (bodyNS.length < L.min || bodyNS.length > L.max) W(`본문 ${bodyNS.length}자 — ${L.min}~${L.max}자 권장 (분량 채우기용 반복 금지, 검색 의도가 끝나면 끝).`);
  if (!r.callouts.includes('summary')) W('첫 소제목 앞에 :::summary 핵심 요약 상자가 없습니다 (답 먼저 — 체류·스니펫).');
  if (!r.h2.some((h) => /자주\s*묻|FAQ|Q\s*&\s*A|질문/.test(h))) W('자주 묻는 질문(FAQ) 섹션이 없습니다 — 실제 검색 질문 3~5개 권장.');
  const longPara = (post.body.split(/\n\s*\n/) || []).find((p) => !/^(\||:::|[-*]|\d+\.|>|!\[)/.test(p.trim()) && strip(p).length > 260);
  if (longPara) W(`긴 문단(${strip(longPara).length}자): "${longPara.trim().slice(0, 25)}…" — 모바일 기준 2~4문장으로 나누세요.`);

  // ── 사진 ──
  r.images.forEach((img) => {
    if (!strip(img.alt)) E(`사진 ${img.index} (${img.src}) 대체텍스트(alt)가 없습니다 — 무엇이 보이는지 구체적으로.`);
    if (!/^https?:/.test(img.src) && !fs.existsSync(img.abs)) E(`사진 파일이 없습니다: ${img.src}`);
    if (/^https?:/.test(img.src)) E(`외부 이미지 링크(${img.src}) — 저작권·핫링크 위험, 업로드도 불가. 직접 찍거나 만든 이미지를 images/ 에 파일로 넣으세요.`);
  });
  const imgSrcs = r.images.map((i) => i.src);
  if (new Set(imgSrcs).size !== imgSrcs.length) E('같은 사진을 두 번 썼습니다.');
  if (!r.images.length) W('본문 사진 0장 — 자동 썸네일 외에 직접 캡처·촬영·제작한 이미지 1장 이상 권장 (정보 이득).');

  // ── 제목 ──
  const title = String(m.title || '');
  if (title && (title.length < 15 || title.length > 45)) W(`제목 ${title.length}자 — 20~40자 권장 (검색 결과에서 잘리지 않게).`);
  if (TITLE_FORBIDDEN.test(title)) W('제목에 장식용 특수문자 — 제거 권장.');
  const bait = CLICKBAIT.filter((w) => title.includes(w));
  if (bait.length) W(`제목 낚시·과장 표현: ${bait.join(', ')} — 오해 소지 제목은 신뢰·클릭 후 이탈률을 떨어뜨립니다.`);
  const yr = title.match(/20\d{2}/);
  if (yr && m.basisDate && !String(m.basisDate).startsWith(yr[0]) && !String(m.basisDate).startsWith(String(Number(yr[0]) - 1)))
    W(`제목 연도(${yr[0]})와 basisDate(${m.basisDate})가 맞지 않습니다.`);

  // ── 키워드 (자연스럽게 — 스터핑 금지) ──
  const mk = String(m.mainKeyword || '').trim();
  if (mk && !isUnset(mk)) {
    const occ = countOcc(bodyNS, strip(mk));
    const density = bodyNS.length ? (occ * strip(mk).length) / bodyNS.length : 0;
    stats.keyword = { keyword: mk, count: occ, density: Math.round(density * 1000) / 10 };
    if (!strip(title).includes(strip(mk))) W('제목에 메인 키워드가 없습니다.');
    else if (strip(title).indexOf(strip(mk)) > strip(title).length / 2) W('메인 키워드를 제목 앞쪽으로.');
    if (!strip(body.slice(0, 220)).includes(strip(mk))) W('첫 문단(앞 200자)에 메인 키워드가 없습니다 — 첫 문단에서 바로 답하세요.');
    if (occ < 3) W(`메인 키워드 본문 ${occ}회 — 3회 이상 자연스럽게.`);
    if (density > 0.03) E(`키워드 밀도 ${stats.keyword.density}% — 키워드 스터핑(구글 스팸 정책). 동의어·대명사로 바꾸세요.`);
    else if (density > 0.02) W(`키워드 밀도 ${stats.keyword.density}% — 2% 이하 권장.`);
  }
  const subs = Array.isArray(m.subKeywords) ? m.subKeywords : [];
  subs.forEach((k) => {
    if (!r.h2.some((h) => strip(h).includes(strip(k))) && !strip(body).includes(strip(k))) W(`서브 키워드 "${k}" 가 본문·소제목에 없습니다.`);
  });

  // ── 애드센스 정책 ──
  allText.split('\n').forEach((line) => {
    if (AD_CLICK_BAIT.some((re) => re.test(line))) E(`광고 클릭 유도 문구 (애드센스 무효 클릭 정책 위반): "${line.trim().slice(0, 40)}"`);
  });
  const strong = RESTRICTED_STRONG.filter((w) => allText.includes(w));
  if (strong.length) E(`애드센스 게시자 정책상 광고 게재 불가 콘텐츠 의심: ${strong.join(', ')}`);
  const soft = RESTRICTED_SOFT.filter((w) => allText.includes(w));
  if (soft.length) W(`애드센스 민감 주제어: ${soft.join(', ')} — 맥락상 문제없는지 확인 (조장·판매·방법 안내면 삭제).`);

  // ── AI 상투어·반복 ──
  const ai = AI_PHRASES.map((p) => [p.trim(), countOcc(body, p)]).filter(([, n]) => n > 0);
  const aiTotal = ai.reduce((s, [, n]) => s + n, 0);
  stats.aiPhrases = aiTotal;
  if (aiTotal >= 6) E(`AI 상투어 ${aiTotal}회 (${ai.map(([p, n]) => `${p}×${n}`).join(', ')}) — 구체적인 문장으로 바꾸세요.`);
  else if (aiTotal >= 3) W(`AI 상투어 ${aiTotal}회 (${ai.map(([p, n]) => `${p}×${n}`).join(', ')}).`);
  const endings = countOcc(body, '할 수 있습니다') + countOcc(body, '할 수 있어요');
  if (endings > 8) W(`"할 수 있습니다/있어요" ${endings}회 — 단정할 곳은 단정, 문장 끝을 다양하게.`);
  const sentences = body.split(/(?<=[.!?요다])\s+/).map((s) => strip(s)).filter((s) => s.length > 15);
  const dupSent = sentences.filter((s, i) => sentences.indexOf(s) !== i);
  if (dupSent.length) W(`같은 문장 반복 ${dupSent.length}회: "${dupSent[0].slice(0, 25)}…"`);

  // ── 자리표시자 ──
  const ph = [...new Set([...(allText.match(PLACEHOLDER_RE) || []), ...(String(post.body).match(PLACEHOLDER_RE) || [])])];
  if (ph.length) E(`채워지지 않은 자리표시자: ${ph.slice(0, 5).join(', ')} — 확인 후 채우거나 삭제.`);

  // ── 링크 ──
  const ext = r.links.filter((l) => l.external);
  stats.links = { external: ext.length, internal: r.links.length - ext.length };
  if (ext.some((l) => /^http:\/\//.test(l.href))) W('http(비보안) 외부 링크가 있습니다.');
  if (ext.length > 6) W(`본문 외부 링크 ${ext.length}개 — 공식 출처 위주로 줄이세요.`);
  const linkable = allPosts.filter((p) => p.meta.url).length + existing.filter((e) => e.url).length;
  if (linkable >= 2 && stats.links.internal === 0 && !/\[\[/.test(post.body)) W('내 블로그 관련 글 링크([[slug]])가 없습니다 — 주제 클러스터 내부 링크 1~3개 권장.');

  // ── 협찬·제휴 (공정위 표시광고법) ──
  if (m.sponsored === true) {
    const first = strip(body.slice(0, 200));
    if (!DISCLOSURE_HINTS.some((h) => first.includes(h))) E('협찬·제휴 글인데 글 맨 앞에 경제적 이해관계 표기가 없습니다.');
    const denial = FALSE_DENIAL.filter((w) => allText.includes(w));
    if (denial.length) E(`협찬 글에 거짓 부인 표현 (위법): ${denial.join(', ')}`);
  }

  // ── YMYL: 공식 출처 · 사실 검증 · 기준일 ──
  if (m.ymyl === true) {
    const sources = Array.isArray(m.sources) ? m.sources : [];
    const facts = Array.isArray(m.facts) ? m.facts : [];
    const ids = new Set(sources.map((s) => s && s.id));
    if (!sources.length) E('YMYL 글은 sources(공식 1차 출처)가 필수입니다.');
    sources.forEach((s, i) => {
      if (!s || !s.id || !/^https:\/\//.test(String(s.url || ''))) E(`sources[${i}] 에 id 와 https 공식 URL 이 필요합니다.`);
    });
    if (!facts.length) E('YMYL 글은 facts(본문의 숫자·날짜·자격·금액 주장 목록)가 필수입니다.');
    facts.forEach((f, i) => {
      if (!ids.has(f.source)) E(`facts[${i}] source "${f.source}" 가 sources 에 없습니다.`);
      if (f.verified === true && strip(f.evidence).length < 10) E(`facts[${i}] verified 인데 evidence(출처 원문 발췌)가 없습니다.`);
    });
    const unv = facts.filter((f) => f.verified !== true);
    if (unv.length) E(`미검증 사실 ${unv.length}/${facts.length}건 — fact-checker 로 공식 출처와 대조. 예: "${String(unv[0].claim).slice(0, 40)}"`);
    const used = new Set(facts.filter((f) => f.verified === true).map((f) => f.source));
    sources.filter((s) => used.has(s.id) && !s.checkedAt).forEach((s) => E(`sources ${s.id} checkedAt(확인 날짜)이 비어 있습니다.`));
    stats.facts = { total: facts.length, verified: facts.length - unv.length };
    if (!m.basisDate) E('basisDate(정보 기준일)가 필요합니다.');
    else {
      const age = (Date.now() - new Date(m.basisDate).getTime()) / 86400000;
      if (age > 180) W(`기준일 ${m.basisDate} — 6개월 이상 지났습니다. 최신 공고로 갱신하세요.`);
    }
    if (!/20\d{2}년[^\n]{0,20}기준/.test(body)) E('본문에 "20○○년 ○월 기준" 문구가 없습니다.');
    const claims = strip(facts.map((f) => f.claim).join(' '));
    const scan = [title, body].join('\n').replace(/20\d{2}년[^\n]{0,20}기준/g, '');
    const nums = [...new Set((scan.match(NUMBER_RE) || []).map((n) => n.trim()))];
    const unreg = nums.filter((n) => !claims.includes(strip(n)));
    stats.numbers = { total: nums.length, unregistered: unreg.length };
    if (unreg.length) E(`facts 에 없는 숫자 ${unreg.length}개: ${unreg.slice(0, 8).join(', ')} — facts 에 등록해 검증하거나 본문에서 빼세요.`);
  }

  // ── 유사문서 · 키워드 잠식(카니벌라이제이션) ──
  const simCfg = config.similarity || { error: 0.35, warn: 0.2 };
  const mine = shingles(body);
  let top = { score: 0, rel: null };
  for (const p of allPosts) {
    if (m.refreshOf && (p.meta.slug === m.refreshOf || p.meta.url === m.refreshOf)) continue;
    if (p.meta.refreshOf && (p.meta.refreshOf === m.slug || (m.url && p.meta.refreshOf === m.url))) continue; // 이 글의 갱신본
    const other = renderPost(p, { mode: 'tistory', config }).bodyText;
    const s = jaccard(mine, shingles(other));
    if (s > top.score) top = { score: s, rel: p.rel };
    if (mk && p.meta.mainKeyword && normalize(p.meta.mainKeyword) === normalize(mk) && !m.refreshOf)
      E(`메인 키워드 "${mk}" 를 이미 쓴 글이 있습니다 (${p.rel}) — 같은 키워드 글끼리 순위를 갉아먹습니다. 다른 검색 의도를 고르거나 refreshOf 로 기존 글 갱신.`);
    if (title && p.meta.title && titleSimilarity(title, p.meta.title) > 0.6) W(`제목이 ${p.rel} 와 매우 비슷합니다.`);
  }
  for (const e of existing) {
    if (!e.title || (m.refreshOf && (e.url === m.refreshOf || e.slug === m.refreshOf))) continue;
    if (title && titleSimilarity(title, e.title) > 0.6) W(`블로그 기존 글 "${e.title}" 와 제목이 매우 비슷합니다 — 키워드 잠식 확인.`);
    if (mk && strip(e.title).includes(strip(mk)) && !m.refreshOf) W(`기존 글 "${e.title}" 가 같은 키워드를 다룹니다 — 새 글 대신 기존 글 갱신(refreshOf)이 나은지 검토.`);
  }
  stats.maxSimilarity = { score: Math.round(top.score * 100) / 100, with: top.rel };
  if (top.score >= simCfg.error) E(`유사문서: ${top.rel} 와 유사도 ${stats.maxSimilarity.score} — 템플릿 복제 글은 구글 scaled content abuse · 애드센스 복제 콘텐츠 위험.`);
  else if (top.score >= simCfg.warn) W(`유사도 ${stats.maxSimilarity.score} (${top.rel}) — 도입·구성·예시를 더 다르게.`);

  // ── 태그 ──
  const tags = (m.tags || []).map((t) => String(t).replace(/^#+/, '').trim()).filter(Boolean);
  if (new Set(tags).size !== tags.length) W('중복 태그가 있습니다.');
  if (tags.length && (tags.length < 3 || tags.length > 10)) W(`태그 ${tags.length}개 — 5~10개 권장.`);

  // 참고용 점수 (최종 판단은 quality-reviewer 점수)
  stats.gateScore = Math.max(0, 100 - errors.length * 15 - warnings.length * 4);
  return { errors, warnings, info, stats, render: r };
}

// 하루치 묶음 점검 — 하루 한도 · 주제 다양성 · 도입 템플릿 반복
function checkBatch(posts, config = {}) {
  const errors = [];
  const warnings = [];
  const quota = config.dailyQuota || 5;
  const live = posts.filter((p) => !p.error && p.meta.status !== 'held');
  if (live.length > quota) errors.push(`하루 글 ${live.length}개 — 한도 ${quota}개 초과 (짧은 기간 대량 발행 = 스팸 신호).`);
  const kw = live.map((p) => normalize(p.meta.mainKeyword || ''));
  const dupKw = kw.filter((k, i) => k && kw.indexOf(k) !== i);
  if (dupKw.length) errors.push('같은 날 메인 키워드가 겹치는 글이 있습니다.');
  const byFormat = {};
  const byCat = {};
  live.forEach((p) => {
    byFormat[p.meta.format] = (byFormat[p.meta.format] || 0) + 1;
    byCat[p.meta.category] = (byCat[p.meta.category] || 0) + 1;
  });
  Object.entries(byFormat).forEach(([f, n]) => n > 2 && warnings.push(`같은 형식(${f}) ${n}개 — 하루 2개 이하로 형식을 섞으세요 (템플릿 반복 신호).`));
  Object.entries(byCat).forEach(([c, n]) => n > 3 && warnings.push(`같은 카테고리(${c}) ${n}개 — 하루 3개 이하 권장.`));
  const intros = live.map((p) => strip(renderPost(p, { mode: 'tistory', config }).bodyText).slice(0, 12));
  const dupIntro = intros.filter((s, i) => s && intros.indexOf(s) !== i);
  if (dupIntro.length) warnings.push(`도입부 첫 문장이 같은 글이 있습니다 ("${dupIntro[0]}…") — 도입 패턴을 매번 다르게.`);
  return { errors, warnings, count: live.length, quota };
}

module.exports = { checkPost, checkBatch, linkIndexFrom, FORMATS, strip };
