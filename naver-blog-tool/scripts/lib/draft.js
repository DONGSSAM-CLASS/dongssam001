// 초안 JSON 로드 · 구조 검증 · 글쓰기 공식(SEO/가독성/협찬) 자동 점검.
// check_draft.js(검수용 CLI)와 naver_draft.js(임시저장 전 사전 검사)가 공유한다.

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./naver');

const BLOCK_TYPES = ['text', 'subtitle', 'image', 'quote', 'divider'];
const BREAK_TYPES = ['subtitle', 'image', 'quote', 'divider']; // 리듬 파괴 장치

// 광고·과장 어휘 (저품질/광고성 판단 위험) — 필요하면 추가
const AD_WORDS = ['최고의', '최저가', '무조건', '100%', '대박', '강추', '완벽한', '보장', '특가', '파격', '할인코드', '역대급', '필수템', '인생템'];
// 협찬 글에서 쓰면 위법이 되는 거짓 부인 표현
const FALSE_DENIAL = ['내돈내산', '내 돈 내 산', '광고 아님', '광고아님', '협찬 아님', '협찬아님', '광고 아닙니다', '협찬 아닙니다'];
// 협찬 표기로 인정할 단서 (data/sponsored-disclosure.md 문구와 맞출 것)
const DISCLOSURE_HINTS = ['제공받', '지원받', '협찬', '광고', '수수료', '원고료', '무상으로', '체험단'];
// 제목 금지 특수문자
const TITLE_FORBIDDEN = /[!?~★☆♥♡◆◇■□▶▷◀【】『』「」\[\]<>|#@$%^&*+=_{}\\]/;

function resolvePath(p) {
  if (!p) return p;
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function loadDraft(file) {
  const abs = resolvePath(file);
  if (!fs.existsSync(abs)) throw new Error(`초안 파일이 없습니다: ${file}`);
  let draft;
  try {
    draft = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    throw new Error(`초안 JSON 파싱 실패 (${file}): ${e.message}`);
  }
  draft.__file = abs;
  return draft;
}

const strip = (s) => String(s || '').replace(/[\s​-‍﻿]/g, '');
const countOcc = (hay, needle) => {
  if (!needle) return 0;
  let n = 0;
  let i = hay.indexOf(needle);
  while (i !== -1) {
    n += 1;
    i = hay.indexOf(needle, i + needle.length);
  }
  return n;
};

function blockText(b) {
  if (b.type === 'text' || b.type === 'subtitle' || b.type === 'quote') return String(b.text || '');
  if (b.type === 'image') return String(b.caption || '');
  return '';
}

// 모바일 기준 "한 문장 = 한 줄" 위반 감지: 한 줄 안에 문장 종결이 2번 이상
function multiSentenceLines(text) {
  return String(text)
    .split('\n')
    .filter((line) => (line.match(/[다요죠까네][.!?]\s+\S/g) || []).length >= 1);
}

function checkDraft(draft, { requireFiles = true } = {}) {
  const errors = [];
  const warnings = [];
  const info = [];

  // ── 구조 ──
  if (!draft.title || typeof draft.title !== 'string') errors.push('title(제목)이 없습니다.');
  if (!Array.isArray(draft.blocks) || draft.blocks.length === 0) errors.push('blocks 가 비어 있습니다.');
  if (typeof draft.sponsored !== 'boolean') errors.push('sponsored(협찬 여부)를 true/false 로 반드시 명시하세요 — 메모에 없으면 사용자에게 질문.');
  const blocks = Array.isArray(draft.blocks) ? draft.blocks : [];
  blocks.forEach((b, i) => {
    if (!b || !BLOCK_TYPES.includes(b.type)) errors.push(`blocks[${i}] type 이 올바르지 않습니다 (${b && b.type}). 허용: ${BLOCK_TYPES.join('/')}`);
    else if (['text', 'subtitle', 'quote'].includes(b.type) && !strip(b.text)) errors.push(`blocks[${i}] (${b.type}) text 가 비어 있습니다.`);
    else if (b.type === 'image') {
      if (!b.path) errors.push(`blocks[${i}] image path 가 없습니다.`);
      else if (requireFiles && !fs.existsSync(resolvePath(b.path))) errors.push(`blocks[${i}] 사진 파일이 없습니다: ${b.path}`);
    }
  });
  if (blocks.length && blocks[0].type !== 'text') warnings.push('첫 블록이 text 가 아닙니다 — Yes-set 첫 문단(또는 협찬 표기)이 맨 앞에 와야 합니다.');

  // 사진 재사용 금지
  const imgPaths = blocks.filter((b) => b.type === 'image').map((b) => path.normalize(String(b.path)));
  const dup = imgPaths.filter((p, i) => imgPaths.indexOf(p) !== i);
  if (dup.length) errors.push(`같은 사진이 두 번 쓰였습니다: ${[...new Set(dup)].join(', ')}`);

  // ── 태그/지도/동영상 ──
  const tags = Array.isArray(draft.tags) ? draft.tags : [];
  if (!Array.isArray(draft.tags)) warnings.push('tags 가 없습니다 (5~10개 권장).');
  if (tags.some((t) => /^#/.test(String(t)))) info.push('태그 앞의 # 은 스크립트가 자동 제거합니다.');
  const normTags = tags.map((t) => String(t).replace(/^#+/, '').trim()).filter(Boolean);
  if (new Set(normTags).size !== normTags.length) warnings.push('중복 태그가 있습니다.');
  if (normTags.length > 30) errors.push(`태그는 최대 30개입니다 (현재 ${normTags.length}).`);
  else if (normTags.length && (normTags.length < 5 || normTags.length > 10)) warnings.push(`태그 ${normTags.length}개 — 5~10개 권장.`);

  if (draft.place) {
    if (!draft.place.query || !draft.place.name) errors.push('place 는 {query, name} 둘 다 필요합니다.');
  }
  if (draft.video) {
    if (!draft.video.path) errors.push('video.path 가 없습니다.');
    else if (requireFiles && !fs.existsSync(resolvePath(draft.video.path))) errors.push(`동영상 파일이 없습니다: ${draft.video.path}`);
    const vt = draft.video.title || draft.title || '';
    if (vt.length > 40) errors.push(`동영상 제목은 40자 이내 (현재 ${vt.length}자) — video.title 을 따로 지정하세요.`);
    if (!blocks.some((b) => b.type === 'text')) errors.push('동영상은 첫 text 블록 직후에 삽입되므로 text 블록이 최소 1개 필요합니다.');
  }

  // ── 협찬 (공정위 표시광고법) ──
  const allText = [draft.title, ...blocks.map(blockText)].join('\n');
  if (draft.sponsored === true) {
    const first = blocks[0];
    const firstOk = first && first.type === 'text' && DISCLOSURE_HINTS.some((h) => String(first.text).includes(h));
    if (!firstOk) errors.push('협찬 글인데 첫 블록(일반 text 블록)에 협찬 표기가 없습니다 — data/sponsored-disclosure.md 문구 사용.');
    const denial = FALSE_DENIAL.filter((w) => allText.includes(w));
    if (denial.length) errors.push(`협찬 글에 거짓 부인 표현 사용 (위법): ${denial.join(', ')}`);
  }

  // ── 제목 ──
  const title = String(draft.title || '');
  const mk = String(draft.mainKeyword || '').trim();
  if (title && (title.length < 25 || title.length > 32)) warnings.push(`제목 ${title.length}자 — 25~32자 권장.`);
  if (TITLE_FORBIDDEN.test(title)) warnings.push('제목에 특수문자가 있습니다 (저품질 위험) — 제거 권장.');
  if (!mk) warnings.push('mainKeyword(메인 키워드)가 비어 있어 키워드 점검을 건너뜁니다.');

  // ── 키워드 ──
  const textBlocks = blocks.filter((b) => b.type === 'text');
  const bodyJoined = blocks.map(blockText).join('\n');
  const stats = {};
  if (mk) {
    const exact = countOcc(bodyJoined, mk);
    const loose = countOcc(strip(bodyJoined), strip(mk));
    stats.mainKeyword = { keyword: mk, exactInBody: exact, looseInBody: loose };
    if (!title.includes(mk) && !strip(title).includes(strip(mk))) warnings.push('제목에 메인 키워드가 없습니다.');
    else if (strip(title).indexOf(strip(mk)) > strip(title).length / 2) warnings.push('메인 키워드를 제목 앞쪽으로 옮기세요.');
    if (exact < 1) warnings.push('띄어쓰기까지 검색어와 동일한 메인 키워드가 본문에 1회 이상 있어야 합니다.');
    if (loose < 5 || loose > 7) warnings.push(`본문 메인 키워드 ${loose}회 — 5~7회 권장.`);
    // 협찬 글은 첫 text 블록이 협찬 표기이므로 그다음 text 블록이 실제 첫 문단
    const firstContent = draft.sponsored === true && blocks[0] && blocks[0].type === 'text' ? textBlocks[1] : textBlocks[0];
    if (firstContent && !strip(firstContent.text).includes(strip(mk))) warnings.push('첫 문단에 메인 키워드가 없습니다.');
    const lastText = textBlocks[textBlocks.length - 1];
    if (lastText && !strip(lastText.text).includes(strip(mk))) warnings.push('마지막 문단에 메인 키워드가 없습니다.');
  }
  const subs = Array.isArray(draft.subKeywords) ? draft.subKeywords : [];
  const subtitles = blocks.filter((b) => b.type === 'subtitle').map((b) => strip(b.text));
  subs.forEach((k) => {
    if (!subtitles.some((s) => s.includes(strip(k)))) warnings.push(`서브 키워드 "${k}" 가 소제목에 없습니다.`);
  });

  // ── 분량/가독성 ──
  const charsNoSpace = strip(bodyJoined).length;
  const charsWithSpace = bodyJoined.replace(/\n/g, '').length;
  stats.chars = { noSpace: charsNoSpace, withSpace: charsWithSpace };
  const isInfo = draft.postType === 'info';
  const maxChars = isInfo ? 3000 : 2500;
  if (charsNoSpace < 1800 || charsNoSpace > maxChars) warnings.push(`본문 ${charsNoSpace}자(공백 제외) — 1,800~${maxChars.toLocaleString()}자 권장.`);

  const images = blocks.filter((b) => b.type === 'image');
  stats.images = images.length;
  if (images.length < 10 || images.length > 15) warnings.push(`사진 ${images.length}장 — 10~15장 권장.`);
  // 캡션은 전체 사진의 절반 정도에만 달고, 그중 키워드는 1~2회만 자연 배치
  const captioned = images.filter((b) => strip(b.caption)).length;
  const kwCaptions = mk ? images.filter((b) => strip(b.caption).includes(strip(mk))).length : 0;
  stats.captions = { captioned, withKeyword: kwCaptions };
  if (images.length >= 4 && (captioned < images.length * 0.3 || captioned > images.length * 0.7))
    info.push(`캡션 ${captioned}/${images.length}장 — 사진의 절반 정도에만 권장.`);
  if (images.length && mk && (kwCaptions < 1 || kwCaptions > 2)) warnings.push(`키워드 포함 캡션 ${kwCaptions}개 — 1~2개 권장.`);

  const quotes = blocks.filter((b) => b.type === 'quote').length;
  stats.quotes = quotes;
  if (quotes < 2 || quotes > 4) warnings.push(`인용구 ${quotes}개 — 핵심 문장 인용구 2~4개 권장.`);
  stats.subtitles = subtitles.length;

  // 리듬 파괴 장치 사이 텍스트 길이 (300~400자마다 1개, 500자 연속이면 실패작)
  let run = 0;
  let maxRun = 0;
  for (const b of blocks) {
    if (BREAK_TYPES.includes(b.type)) {
      maxRun = Math.max(maxRun, run);
      run = 0;
    } else if (b.type === 'text') run += strip(b.text).length;
  }
  maxRun = Math.max(maxRun, run);
  stats.maxTextRun = maxRun;
  if (maxRun >= 500) errors.push(`텍스트만 ${maxRun}자 연속 — 500자 연속은 실패작. 인용구/사진/소제목/구분선으로 끊으세요.`);
  else if (maxRun > 400) warnings.push(`텍스트 연속 ${maxRun}자 — 300~400자마다 리듬 파괴 장치 권장.`);

  textBlocks.forEach((b) => {
    const lines = String(b.text).split('\n').filter((l) => l.trim());
    const idx = blocks.indexOf(b);
    if (lines.length > 5) warnings.push(`blocks[${idx}] ${lines.length}줄 — 한 블록 3~5줄 권장.`);
    const multi = multiSentenceLines(b.text);
    if (multi.length) warnings.push(`blocks[${idx}] 한 줄에 두 문장: "${multi[0].slice(0, 30)}…" — 한 문장 = 한 줄.`);
  });

  // ── 저품질/홍보 냄새 ──
  const ads = AD_WORDS.filter((w) => allText.includes(w));
  if (ads.length) warnings.push(`광고성 어휘: ${ads.join(', ')}`);
  const links = (allText.match(/https?:\/\/\S+/g) || []).length;
  if (links > 1) warnings.push(`외부 링크 ${links}개 — 1개 이하 권장.`);
  const contacts = (allText.match(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|[\w.+-]+@[\w-]+\.[\w.]+|open\.kakao\.com\/\S+/g) || []).length;
  if (contacts > 1) warnings.push(`연락처가 ${contacts}회 — 글 전체 1회만.`);
  if (draft.brandName) {
    const bn = countOcc(bodyJoined, draft.brandName);
    stats.brandMentions = bn;
    if (bn > 3) warnings.push(`업체/브랜드명 본문 ${bn}회 — 3회 이내.`);
    if (isInfo && bn > 1) warnings.push('정보성 글 — 업체/브랜드명은 CTA에서 1회만.');
  }
  // 채워지지 않은 자리표시자 ([문의 경로], {업체명} 등) — 그대로 임시저장되면 안 된다
  const placeholders = allText.match(/\[[^\]\n]{1,30}\]|\{[^}\n]{1,30}\}|❓/g) || [];
  if (placeholders.length) errors.push(`채워지지 않은 자리표시자: ${[...new Set(placeholders)].slice(0, 5).join(', ')} — 사용자에게 확인 후 채우세요.`);
  if (!draft.persona) warnings.push('persona(검색자 페르소나)가 비어 있습니다 — 초안 검수 보고에 필수.');

  return { errors, warnings, info, stats };
}

// 에디터에 붙여넣기 실패 시 사용자 수동 작업용 원고
function toManualText(draft) {
  const out = [];
  out.push(`[제목] ${draft.title}`, '');
  (draft.blocks || []).forEach((b) => {
    if (b.type === 'text') out.push(b.text, '');
    else if (b.type === 'subtitle') out.push(`[소제목] ${b.text}`, '');
    else if (b.type === 'quote') out.push(`[인용구] ${b.text}`, '');
    else if (b.type === 'divider') out.push('[구분선]', '');
    else if (b.type === 'image') out.push(`[사진] ${b.path}${b.caption ? `  (캡션: ${b.caption})` : ''}`, '');
  });
  if (draft.video) out.push(`[동영상 — 첫 문단 바로 아래] ${draft.video.path} / 제목: ${draft.video.title || draft.title}`);
  if (draft.place) out.push(`[지도 — 글 맨 끝] 검색어: ${draft.place.query} / 장소: ${draft.place.name}`);
  if (draft.tags && draft.tags.length) out.push(`[태그] ${draft.tags.map((t) => `#${String(t).replace(/^#+/, '')}`).join(' ')}`);
  return out.join('\n');
}

module.exports = { loadDraft, checkDraft, toManualText, resolvePath, strip, blockText, BLOCK_TYPES };
