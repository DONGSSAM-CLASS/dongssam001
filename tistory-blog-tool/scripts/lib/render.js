// 마크다운 글 → 티스토리 에디터(HTML 모드)용 HTML.
// 티스토리 에디터 고유 속성(data-ke-*)을 써서 HTML → 기본모드 전환 때 서식이 덜 깨지게 한다.
//
// 글 문법 (CLAUDE.md "글 파일 포맷"과 같음)
//   ## 소제목 / ### 작은 소제목        (# H1 금지 — 제목이 H1)
//   :::summary 핵심 요약  ...  :::      상자형 요약 (summary | tip | warning | note)
//   ![대체텍스트](images/01.png "캡션")  사진 (대체텍스트 필수)
//   [[slug]] 또는 [[slug|앵커 텍스트]]   내 블로그 다른 글 링크 (URL 은 자동 연결)
//   표·목록·굵게 등 일반 마크다운

const fs = require('fs');
const path = require('path');
const { Marked } = require('marked');
const { resolvePath } = require('./core');

const CALLOUTS = {
  summary: { style: 'style3', icon: '✔' },
  tip: { style: 'style2', icon: '💡' },
  warning: { style: 'style2', icon: '⚠️' },
  note: { style: 'style2', icon: '📌' },
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function textOfHtml(html) {
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h\d|li|tr|blockquote|div|figcaption)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

// [[slug|앵커]] → 링크. linkIndex: slug/제목 → url
function resolveInternalLinks(md, linkIndex, problems) {
  return md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, key, anchor) => {
    const k = key.trim();
    const hit = linkIndex.get(k);
    const label = (anchor || (hit && hit.title) || k).trim();
    if (hit && hit.url) return `[${label}](${hit.url})`;
    problems.push(`내부 링크 [[${k}]] 의 URL 을 아직 모릅니다 (업로드 전이거나 목록에 없음) — 앵커 텍스트만 남깁니다.`);
    return label;
  });
}

function makeMarked(ctx) {
  const marked = new Marked({ gfm: true, breaks: true }); // 한 줄 바꿈 = <br> (모바일 가독성)
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        if (depth <= 2) {
          ctx.h2.push(textOfHtml(inner));
          const id = `sec-${ctx.h2.length}`;
          return `<h2 id="${id}" data-ke-size="size26">${inner}</h2>\n`;
        }
        return `<h3 data-ke-size="size23">${inner}</h3>\n`;
      },
      paragraph({ tokens }) {
        // 사진만 있는 문단은 figure 로 (p 로 감싸지 않음)
        if (tokens.length === 1 && tokens[0].type === 'image') return this.parser.parseInline(tokens) + '\n';
        return `<p data-ke-size="size16">${this.parser.parseInline(tokens)}</p>\n`;
      },
      image({ href, title, text }) {
        const idx = ctx.images.length + 1;
        const abs = resolvePath(path.isAbsolute(href) || /^https?:/.test(href) ? href : path.join(ctx.baseDir, href));
        ctx.images.push({ index: idx, src: href, abs, alt: text || '', caption: title || '' });
        if (ctx.mode === 'tistory') return `<p data-ke-size="size16">IMGMARK-${idx}</p>\n`;
        const src = /^https?:/.test(href) ? href : ctx.imageSrc(abs);
        return `<figure data-ke-type="image" style="margin:24px 0;text-align:center"><img src="${esc(src)}" alt="${esc(text)}" style="max-width:100%;height:auto;border-radius:6px" />${
          title ? `<figcaption style="font-size:13px;color:#888;margin-top:6px">${esc(title)}</figcaption>` : ''
        }</figure>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !(ctx.blogOrigin && href.startsWith(ctx.blogOrigin));
        ctx.links.push({ href, external });
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
      },
      hr() {
        return '<hr contenteditable="false" data-ke-type="horizontalRule" data-ke-style="style6" />\n';
      },
      blockquote({ tokens }) {
        return `<blockquote data-ke-style="style2">${this.parser.parse(tokens)}</blockquote>\n`;
      },
      table(token) {
        const cell = (c, tag) => `<${tag}${c.align ? ` style="text-align:${c.align}"` : ''}>${this.parser.parseInline(c.tokens)}</${tag}>`;
        const head = `<tr>${token.header.map((c) => cell(c, 'th')).join('')}</tr>`;
        const rows = token.rows.map((r) => `<tr>${r.map((c) => cell(c, 'td')).join('')}</tr>`).join('');
        ctx.tables += 1;
        return `<table style="border-collapse: collapse; width: 100%;" border="1" data-ke-align="alignLeft"><thead>${head}</thead><tbody>${rows}</tbody></table>\n`;
      },
    },
  });
  return marked;
}

// :::type 제목 ... ::: → 상자형 블록 (안쪽도 마크다운)
function renderCallouts(md, marked, ctx) {
  const lines = md.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^:::\s*(summary|tip|warning|note)\s*(.*)$/);
    if (!m) {
      out.push(lines[i]);
      continue;
    }
    const inner = [];
    i++;
    while (i < lines.length && !/^:::\s*$/.test(lines[i])) inner.push(lines[i++]);
    const kind = CALLOUTS[m[1]];
    ctx.callouts.push(m[1]);
    const head = m[2].trim() ? `<p data-ke-size="size16"><b>${kind.icon} ${esc(m[2].trim())}</b></p>` : '';
    const body = marked.parse(inner.join('\n')).replace(/\n\s*\n/g, '\n').trim();
    out.push('', `<blockquote data-ke-style="${kind.style}">${head}${body.replace(/\n/g, '')}</blockquote>`, '');
  }
  return out.join('\n');
}

function buildToc(h2) {
  const items = h2.map((t, i) => `<li><a href="#sec-${i + 1}">${esc(t)}</a></li>`).join('');
  return `<blockquote data-ke-style="style3"><p data-ke-size="size16"><b>목차</b></p><ol>${items}</ol></blockquote>\n`;
}

function sourcesHtml(meta) {
  const src = (meta.sources || []).filter((s) => s && s.url);
  if (!src.length) return '';
  const li = src.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a></li>`).join('');
  return `<h3 data-ke-size="size23">참고한 공식 자료</h3>\n<ul>${li}</ul>\n`;
}

function footerHtml(meta, config) {
  const parts = [];
  if (meta.basisDate) parts.push(`<p data-ke-size="size14" style="color:#888">정보 기준일: ${esc(meta.basisDate)}${meta.ymyl ? ' · 공식 자료로 확인했지만, 개별 상황은 해당 기관에 꼭 확인해 주세요.' : ''}</p>`);
  const a = config && config.author;
  if (config && config.authorBox && a && a.name && !String(a.name).includes('❓')) {
    parts.push(`<blockquote data-ke-style="style3"><p data-ke-size="size16"><b>✍ 글쓴이 ${esc(a.name)}</b></p><p data-ke-size="size14">${esc(a.bio || '')}</p></blockquote>`);
  }
  if (config && config.aiDisclosure) parts.push(`<p data-ke-size="size14" style="color:#888">${esc(config.aiDisclosure)}</p>`);
  return parts.join('\n');
}

/**
 * @param post  loadPost() 결과
 * @param opts  { mode: 'tistory'|'preview', config, linkIndex: Map, imageSrc: fn(abs)->src }
 * @returns { html, text, images, h2, links, tables, callouts, problems }
 */
function renderPost(post, opts = {}) {
  const mode = opts.mode || 'tistory';
  const config = opts.config || {};
  const ctx = {
    mode,
    baseDir: post.dir,
    images: [],
    h2: [],
    links: [],
    tables: 0,
    callouts: [],
    blogOrigin: config.blogUrl && !String(config.blogUrl).includes('❓') ? new URL(config.blogUrl).origin : null,
    imageSrc: opts.imageSrc || ((abs) => 'file://' + abs.split(path.sep).join('/')),
  };
  const problems = [];
  const marked = makeMarked(ctx);
  let md = resolveInternalLinks(post.body, opts.linkIndex || new Map(), problems);
  md = renderCallouts(md, marked, ctx);
  let html = marked.parse(md);
  // 본문 순수 텍스트 (목차·출처·글쓴이 상자 제외) — 분량·키워드·유사도 점검용
  const bodyText = textOfHtml(html).replace(/IMGMARK-\d+/g, '').trim();

  // 목차: 소제목 3개 이상이면 첫 소제목 바로 앞에 (front matter toc: false 로 끔)
  if (post.meta.toc !== false && ctx.h2.length >= 3) {
    const at = html.indexOf('<h2 id="sec-1"');
    if (at >= 0) html = html.slice(0, at) + buildToc(ctx.h2) + html.slice(at);
  }
  html += sourcesHtml(post.meta) + footerHtml(post.meta, config);
  return { html, text: textOfHtml(html), bodyText, ...ctx, problems };
}

// 사진 파일을 미리보기용 data URI 로 (미리보기 HTML 하나로 폰에서도 열리게)
function dataUri(abs) {
  try {
    const ext = path.extname(abs).slice(1).toLowerCase().replace('jpg', 'jpeg');
    return `data:image/${ext};base64,${fs.readFileSync(abs).toString('base64')}`;
  } catch {
    return '';
  }
}

module.exports = { renderPost, textOfHtml, dataUri, esc };
