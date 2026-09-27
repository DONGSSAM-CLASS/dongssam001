// 테스트용 가짜 티스토리 (로컬 HTTP) — 실측 셀렉터(scripts/lib/tistory.js)와 같은 구조만 흉내 낸다.
// 목적: 업로더 흐름(모드 전환·HTML 입력·사진 첨부·배치·카테고리·태그·공개 설정·저장·대조)의 코드 버그 잡기.
// 실제 티스토리 DOM 과 100% 같다는 보장은 없다 — 실제 첫 실행은 반드시 --dry-run.

const http = require('http');

const posts = [];

const EDITOR = `<!doctype html><html><head><meta charset="utf-8"><title>글쓰기</title></head><body>
<textarea id="post-title-inp"></textarea>
<button id="editor-mode-layer-btn-open">모드</button>
<div id="mode-layer" style="display:none"><button id="editor-mode-html-text">HTML</button></div>
<div id="html-editor-container" style="display:none"><button id="to-basic">HTML 모드</button><div id="basic-opt" style="display:none"><span>기본모드</span></div>
  <div class="cm-s-tistory-html CodeMirror"><textarea></textarea><pre class="CodeMirror-line"></pre></div></div>
<div id="basic" style="display:none"><button>첨부</button><div id="attach-menu" style="display:none"><span id="photo">사진</span></div>
  <input type="file" id="file" style="display:none"><iframe id="editor-tistory_ifr" name="editor-tistory_ifr"></iframe>
  <button class="mce-represent-image-btn">대표</button></div>
<button id="category-btn">카테고리 없음</button><ul id="cats" style="display:none"><li role="option">업무 꿀팁</li><li role="option">생활 돈 정보</li></ul>
<input id="tagText" placeholder="태그입력"><div id="tags"></div>
<button id="publish-layer-btn">완료</button>
<div id="publish-layer" style="display:none"><label><input type="radio" name="open" id="open0" value="0">비공개</label>
<label><input type="radio" name="open" id="open20" value="20" checked>공개</label><button id="publish-btn">공개 발행</button></div>
<script>
const $ = (s) => document.querySelector(s);
let cmValue = '';
const cm = $('.CodeMirror');
cm.CodeMirror = { setValue(v) { cmValue = v; }, getValue() { return cmValue; }, save() {} };
$('#editor-mode-layer-btn-open').onclick = () => { $('#mode-layer').style.display = 'block'; };
$('#editor-mode-html-text').onclick = () => {
  if (!confirm('작성 모드를 변경하시겠습니까?\\n현재 서식이 유지되지 않을 수 있습니다.')) return;
  $('#mode-layer').style.display = 'none'; $('#html-editor-container').style.display = 'block';
};
$('#to-basic').onclick = () => { $('#basic-opt').style.display = 'block'; };
$('#basic-opt span').onclick = () => {
  if (!confirm('작성 모드를 변경하시겠습니까?\\n현재 서식이 유지되지 않을 수 있습니다.')) return;
  $('#html-editor-container').style.display = 'none'; $('#basic').style.display = 'block';
  const doc = $('#editor-tistory_ifr').contentDocument;
  doc.open(); doc.write('<body id="tinymce" contenteditable="true">' + cmValue + '</body>'); doc.close();
};
document.querySelectorAll('#basic > button')[0].onclick = () => { $('#attach-menu').style.display = 'block'; };
$('#photo').onclick = () => $('#file').click();
$('#file').onchange = (e) => {
  const f = e.target.files[0]; const url = URL.createObjectURL(f);
  const doc = $('#editor-tistory_ifr').contentDocument;
  const fig = doc.createElement('figure'); fig.setAttribute('data-ke-type', 'image');
  fig.innerHTML = '<img src="' + url + '"><figcaption></figcaption>';
  doc.body.appendChild(fig); e.target.value = ''; $('#attach-menu').style.display = 'none';
};
$('.mce-represent-image-btn').onclick = (e) => e.target.classList.add('active');
$('#category-btn').onclick = () => { const c = $('#cats'); c.style.display = c.style.display === 'none' ? 'block' : 'none'; };
document.querySelectorAll('#cats li').forEach((li) => li.onclick = () => { $('#category-btn').textContent = li.textContent; $('#cats').style.display = 'none'; });
$('#tagText').onkeydown = (e) => { if (e.key === 'Enter') { $('#tags').textContent += '#' + e.target.value; e.target.value = ''; } };
$('#publish-layer-btn').onclick = () => { $('#publish-layer').style.display = 'block'; };
document.querySelectorAll('input[name=open]').forEach((r) => r.onchange = () => { $('#publish-btn').textContent = $('#open0').checked ? '비공개 저장' : '공개 발행'; });
$('#publish-btn').onclick = async () => {
  const basic = $('#basic').style.display === 'block';
  const html = basic ? $('#editor-tistory_ifr').contentDocument.body.innerHTML : cmValue;
  await fetch('/api/save', { method: 'POST', body: JSON.stringify({ title: $('#post-title-inp').value, html, category: $('#category-btn').textContent, tags: $('#tags').textContent, open: $('#open0').checked ? 0 : 20 }) });
  location.href = '/manage/posts';
};
</script></body></html>`;

function start(port = 0) {
  const server = http.createServer((req, res) => {
    const send = (code, body, type = 'text/html; charset=utf-8') => {
      res.writeHead(code, { 'content-type': type });
      res.end(body);
    };
    if (req.url === '/manage') return send(200, '<a class="link_write" href="/manage/post">글쓰기</a>');
    if (req.url.startsWith('/manage/newpost')) return send(200, EDITOR);
    if (req.url === '/manage/posts') return send(200, '<ul>' + posts.map((p, i) => `<li><a href="/entry/${i + 1}">${p.title}</a> <span class="txt_cate">${p.category}</span></li>`).join('') + '</ul>');
    const m = req.url.match(/^\/entry\/(\d+)/);
    if (m && posts[m[1] - 1]) return send(200, `<h1>${posts[m[1] - 1].title}</h1><div class="tt_article_useless_p_margin">${posts[m[1] - 1].html}</div>`);
    if (req.url === '/api/save' && req.method === 'POST') {
      let b = '';
      req.on('data', (c) => (b += c));
      req.on('end', () => {
        posts.push(JSON.parse(b));
        send(200, '{}', 'application/json');
      });
      return;
    }
    send(404, 'not found');
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r({ server, posts, url: `http://127.0.0.1:${server.address().port}` })));
}

module.exports = { start };
