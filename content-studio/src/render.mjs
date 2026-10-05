// 생성된 데이터를 판매·업로드할 파일들로 바꾸는 순수 함수 모음 (API 호출 없음).

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function slugify(text) {
  const slug = String(text)
    .normalize('NFC')
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!'@`=+^~,.;()[\]]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40);
  return slug || 'kit';
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

function questionBlock(q, i) {
  const choices = q.choices.length
    ? `<ol class="choices">${q.choices
        .map((c, j) => `<li><span>${CIRCLED[j] ?? j + 1}</span> ${escapeHtml(c)}</li>`)
        .join('')}</ol>`
    : `<div class="answer-space ${q.kind === '서술형' ? 'long' : ''}"></div>`;
  return `<li class="question"><p><b>${i + 1}.</b> <em>[${escapeHtml(q.kind)}]</em> ${escapeHtml(q.prompt)}</p>${choices}</li>`;
}

function answerBlock(q, i) {
  return `<li><p><b>${i + 1}. 정답:</b> ${escapeHtml(q.answer)}</p><p class="muted">${escapeHtml(q.explanation)}</p></li>`;
}

// A4 인쇄용 단일 HTML. 브라우저에서 열고 "PDF로 저장"하면 그대로 판매 파일이 된다.
export function renderProductHtml(product, { author = '' } = {}) {
  const p = product;
  const sections = p.sections
    .map(
      (s) => `<section><h2>${escapeHtml(s.heading)}</h2>${s.paragraphs
        .map((t) => `<p>${escapeHtml(t)}</p>`)
        .join('')}${
        s.keyTerms.length
          ? `<p class="terms">핵심 용어: ${s.keyTerms.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</p>`
          : ''
      }</section>`,
    )
    .join('');
  const activities = p.activities
    .map(
      (a) => `<li><b>${escapeHtml(a.title)}</b> <span class="muted">(${a.minutes}분)</span><p>${escapeHtml(a.instructions)}</p></li>`,
    )
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(p.title)}</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }
  :root { --ink: #1d2433; --muted: #5b6475; --line: #d5dae3; --accent: #2f5bd3; --paper: #ffffff; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink);
    font-family: "Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
    font-size: 11pt; line-height: 1.7; }
  main { max-width: 180mm; margin: 0 auto; padding: 12mm 0; }
  .cover { border-bottom: 3px solid var(--accent); padding-bottom: 6mm; margin-bottom: 8mm; }
  .cover h1 { font-size: 22pt; margin: 0 0 2mm; line-height: 1.3; }
  .cover .sub { font-size: 13pt; color: var(--muted); margin: 0; }
  .meta { margin-top: 4mm; font-size: 10pt; color: var(--muted); }
  h2 { font-size: 14pt; border-left: 5px solid var(--accent); padding-left: 3mm; margin: 8mm 0 3mm; }
  .muted { color: var(--muted); }
  .terms span { display: inline-block; border: 1px solid var(--line); border-radius: 4px; padding: 0 2mm; margin: 0 1mm 1mm 0; }
  .goals li, .activities li { margin-bottom: 2mm; }
  .page-break { break-before: page; }
  .name-row { display: flex; gap: 8mm; border: 1px solid var(--line); padding: 3mm 4mm; margin-bottom: 5mm; }
  .name-row span { flex: 1; border-bottom: 1px solid var(--ink); }
  ol.questions { padding-left: 0; list-style: none; }
  .question { break-inside: avoid; margin-bottom: 6mm; }
  .question em { font-style: normal; color: var(--accent); font-size: 9.5pt; }
  ol.choices { list-style: none; padding-left: 5mm; margin: 1mm 0; }
  ol.choices span { color: var(--muted); }
  .answer-space { border-bottom: 1px solid var(--line); height: 12mm; }
  .answer-space.long { height: 40mm; border: 1px solid var(--line); border-radius: 4px; }
  .answers li { break-inside: avoid; margin-bottom: 3mm; }
  footer { margin-top: 10mm; font-size: 9pt; color: var(--muted); border-top: 1px solid var(--line); padding-top: 3mm; }
  @media screen and (max-width: 640px) { main { padding: 16px; } .cover h1 { font-size: 20pt; } }
</style>
</head>
<body>
<main>
  <header class="cover">
    <h1>${escapeHtml(p.title)}</h1>
    <p class="sub">${escapeHtml(p.subtitle)}</p>
    <p class="meta">대상: ${escapeHtml(p.audience)}<br>교육과정 연계: ${escapeHtml(p.curriculumLink)}</p>
  </header>

  <h2>학습 목표</h2>
  <ul class="goals">${p.learningGoals.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>

  ${sections}

  <h2>활동</h2>
  <ol class="activities">${activities}</ol>

  <div class="page-break"></div>
  <h2>활동지</h2>
  <div class="name-row">학년·반·번호 <span></span> 이름 <span></span></div>
  <ol class="questions">${p.questions.map(questionBlock).join('')}</ol>

  <div class="page-break"></div>
  <h2>정답과 해설</h2>
  <ol class="answers" style="list-style:none;padding-left:0">${p.questions.map(answerBlock).join('')}</ol>

  <h2>지도 유의점</h2>
  <ul>${p.teacherNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>

  <footer>${author ? `© ${escapeHtml(author)}. ` : ''}이 자료는 구매자 본인의 수업·학습용으로만 사용할 수 있으며 무단 재배포를 금합니다.</footer>
</main>
</body>
</html>
`;
}

export function renderListingsMd(marketing) {
  return [
    '# 판매 페이지 등록 문구',
    '',
    ...marketing.listings.flatMap((l) => [
      `## ${l.platform}`,
      '',
      `**상품명:** ${l.title}`,
      '',
      `**한 줄 소개:** ${l.shortDescription}`,
      '',
      `**제안 가격:** ${l.suggestedPriceKRW.toLocaleString('ko-KR')}원 — ${l.priceRationale}`,
      '',
      `**태그:** ${l.tags.join(', ')}`,
      '',
      '**상세 설명:**',
      '',
      l.longDescription,
      '',
    ]),
  ].join('\n');
}

export function renderBlogMd(marketing) {
  const b = marketing.blogPost;
  return [
    `# ${b.title}`,
    '',
    `> 검색 설명(메타): ${b.metaDescription}`,
    `> 키워드: ${b.keywords.join(', ')}`,
    '',
    b.bodyMarkdown,
    '',
    '---',
    '',
    b.callToAction,
    '',
  ].join('\n');
}

export function renderSnsMd(marketing) {
  const s = marketing.shortsScript;
  return [
    '# SNS 홍보 글',
    '',
    ...marketing.sns.flatMap((p) => [`## ${p.channel}`, '', p.text, '', p.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '), '']),
    '# 숏폼(쇼츠·릴스) 대본',
    '',
    `**첫 3초:** ${s.hook}`,
    '',
    '| 초 | 내레이션 | 화면 자막 |',
    '| --- | --- | --- |',
    ...s.scenes.map((sc) => `| ${sc.seconds} | ${sc.narration.replaceAll('|', '/')} | ${sc.onScreenText.replaceAll('|', '/')} |`),
    '',
    `**마무리:** ${s.cta}`,
    '',
  ].join('\n');
}

// 판매 전 사람이 직접 확인해야 하는 항목. AI 결과물을 그대로 팔지 않게 하는 마지막 관문.
export function renderChecklistMd(product) {
  return [
    '# 판매 전 체크리스트',
    '',
    '모든 칸에 체크한 뒤에 업로드하세요. AI가 만든 초안은 틀릴 수 있고, 책임은 판매자에게 있습니다.',
    '',
    '## 1. 사실 검증 (AI가 표시한 항목)',
    '',
    ...product.factCheck.map((f) => `- [ ] ${f.claim}\n  - 확인 방법: ${f.howToVerify}`),
    '',
    '## 2. 내용 점검',
    '',
    '- [ ] 정답·해설을 직접 풀어 보고 오류가 없는지 확인했다',
    '- [ ] 교과서·참고서·기출 문장과 똑같은 문장이 없다 (저작권)',
    '- [ ] 사진·지도·그림을 추가했다면 공공누리·퍼블릭 도메인 등 이용 허락을 확인했다',
    '- [ ] 학생 개인정보나 실제 학급 정보가 들어가 있지 않다',
    '',
    '## 3. 판매 자격·정산',
    '',
    '- [ ] (현직 교원·공무원) 소속 기관에 겸직 허가가 필요한지 확인하고 필요하면 허가를 받았다',
    '- [ ] 판매처의 디지털 상품(PDF) 판매 정책과 수수료를 확인했다',
    '- [ ] 판매처에 정산받을 본인 명의 계좌와 판매자 정보(개인/사업자)를 등록했다',
    '- [ ] 판매 수익의 세금 신고 방법(기타소득·사업소득 등)을 확인했다',
    '',
    '## 4. 업로드',
    '',
    '- [ ] `product.html` 을 브라우저로 열어 "인쇄 → PDF로 저장" 했다',
    '- [ ] 미리보기용으로 표지·활동지 1쪽만 이미지로 캡처했다 (정답 페이지는 공개하지 않기)',
    '- [ ] `listing.md` 문구로 상품을 등록하고, `blog.md`·`sns.md` 에 실제 판매 링크를 넣어 게시했다',
    '',
  ].join('\n');
}

export function renderKit(kit, opts) {
  return {
    'product.html': renderProductHtml(kit.product, opts),
    'listing.md': renderListingsMd(kit.marketing),
    'blog.md': renderBlogMd(kit.marketing),
    'sns.md': renderSnsMd(kit.marketing),
    'CHECKLIST.md': renderChecklistMd(kit.product),
    'kit.json': JSON.stringify(kit, null, 2) + '\n',
  };
}
