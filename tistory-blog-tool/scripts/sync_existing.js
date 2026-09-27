#!/usr/bin/env node
// 블로그에 이미 있는 글 목록을 data/existing-posts.json 으로 (RSS + 사이트맵, 로그인 불필요).
// 용도: 키워드 잠식 방지 · 제목 유사도 점검 · 내부 링크 후보. 본문은 가져오지 않는다.
const fs = require('fs');
const path = require('path');
const { loadConfig, isUnset, DATA_DIR } = require('./lib/core');
const { normBlog } = require('./lib/tistory');

const unesc = (s) => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? unesc(m[1]) : ''; };

(async () => {
  const config = loadConfig();
  if (isUnset(config.blogUrl)) throw new Error('blogUrl 이 비어 있습니다.');
  const blog = normBlog(config.blogUrl);
  const posts = new Map();
  try {
    const rss = await (await fetch(`${blog}/rss`)).text();
    for (const it of rss.split('<item>').slice(1)) {
      const url = tag(it, 'link');
      posts.set(url, { title: tag(it, 'title'), url, category: tag(it, 'category'), date: tag(it, 'pubDate') });
    }
  } catch (e) { console.warn(`⚠️ RSS 실패: ${e.message}`); }
  try {
    const sm = await (await fetch(`${blog}/sitemap.xml`)).text();
    for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = unesc(m[1]);
      if (!/\/entry\/|\/\d+$/.test(url) || posts.has(url)) continue;
      const slug = decodeURIComponent(url.split('/entry/')[1] || '');
      posts.set(url, { title: slug ? slug.replace(/-/g, ' ') : '', url, titleFromUrl: true });
    }
  } catch (e) { console.warn(`⚠️ 사이트맵 실패: ${e.message}`); }
  const list = [...posts.values()];
  fs.writeFileSync(path.join(DATA_DIR, 'existing-posts.json'), JSON.stringify({ syncedAt: new Date().toISOString(), blog, posts: list }, null, 2) + '\n');
  console.log(`✅ 기존 글 ${list.length}개 → data/existing-posts.json`);
})().catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
