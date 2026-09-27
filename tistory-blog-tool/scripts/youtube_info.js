#!/usr/bin/env node
// 유튜브 영상 참고용 — 제목·채널·설명·챕터(목차)·인기 댓글을 가져온다 (자막 전문은 불가).
//   node scripts/youtube_info.js <유튜브 URL 또는 영상 ID> [--comments 40]
// 클라우드 세션에서는 www.youtube.com 이 막혀 있어도 youtubei.googleapis.com 은 열려 있어서 이 경로로 읽는다.
// 자막(대본)은 유튜브가 브라우저 인증 토큰을 요구해 여기서는 못 받는다 → 필요하면 내 PC 에서 yt-dlp:
//   yt-dlp --skip-download --write-auto-subs --sub-langs ko <URL>

const API = 'https://youtubei.googleapis.com/youtubei/v1/next?prettyPrint=false';
const CLIENT = { clientName: 'WEB', clientVersion: '2.20250925.01.00', hl: 'ko', gl: 'KR' };

function videoId(s) {
  const m = String(s).match(/(?:v=|youtu\.be\/|shorts\/|live\/)([\w-]{11})/) || String(s).match(/^([\w-]{11})$/);
  if (!m) throw new Error(`영상 ID 를 찾지 못했습니다: ${s}`);
  return m[1];
}
function collect(o, key, out = []) {
  if (Array.isArray(o)) o.forEach((x) => collect(x, key, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) (k === key ? out.push(v) : null, collect(v, key, out));
  return out;
}
const text = (r) => (!r ? '' : r.simpleText || r.content || (r.runs || []).map((x) => x.text).join(''));
async function post(body) {
  const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`유튜브 API ${res.status}`);
  return res.json();
}

(async () => {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--'));
  if (!target) throw new Error('사용법: node scripts/youtube_info.js <유튜브 URL>');
  const maxComments = Number(args[args.indexOf('--comments') + 1]) || (args.includes('--comments') ? 40 : 20);
  const id = videoId(target);
  const d = await post({ videoId: id, context: { client: CLIENT } });
  const p = collect(d, 'videoPrimaryInfoRenderer')[0] || {};
  const s = collect(d, 'videoSecondaryInfoRenderer')[0] || {};
  console.log(`# ${text(p.title) || '(제목 없음 — 비공개·삭제·연령 제한 영상일 수 있음)'}`);
  console.log(`채널: ${text(collect(s, 'videoOwnerRenderer')[0]?.title)} · ${text(p.dateText)} · ${text(collect(p, 'videoViewCountRenderer')[0]?.viewCount)}`);
  console.log(`https://www.youtube.com/watch?v=${id}\n\n## 설명\n${(s.attributedDescription && s.attributedDescription.content) || text(s.description)}`);
  const seen = new Set();
  const chapters = collect(d, 'macroMarkersListItemRenderer')
    .map((c) => `${text(c.timeDescription)} ${text(c.title)}`)
    .filter((c) => !seen.has(c) && seen.add(c));
  if (chapters.length) console.log(`\n## 챕터\n${chapters.join('\n')}`);

  // 댓글 (좋아요 많은 순 기본 정렬)
  const secs = collect(d, 'itemSectionRenderer').filter((x) => x.sectionIdentifier === 'comment-item-section');
  let token = secs.length ? collect(secs[0], 'token')[0] : null;
  const comments = [];
  for (let page = 0; token && page < 5 && comments.length < maxComments; page++) {
    const c = await post({ continuation: token, context: { client: { ...CLIENT, visitorData: d.responseContext?.visitorData } } });
    collect(c, 'commentEntityPayload').forEach((x) => comments.push({ likes: x.toolbar?.likeCountNotliked || '0', text: x.properties?.content?.content || '' }));
    const next = collect(c, 'continuationCommand').map((x) => x.token);
    token = next[next.length - 1];
  }
  if (comments.length) console.log(`\n## 댓글 ${Math.min(comments.length, maxComments)}개\n${comments.slice(0, maxComments).map((c) => `- (👍${c.likes}) ${c.text.replace(/\s+/g, ' ').slice(0, 300)}`).join('\n')}`);
  console.log('\n(자막 전문은 이 경로로 못 받습니다 — 파일 상단 주석의 yt-dlp 안내 참고)');
})().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
