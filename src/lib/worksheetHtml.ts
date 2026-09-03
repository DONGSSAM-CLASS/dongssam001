/**
 * 활동지 → 인쇄용/오프라인 HTML.
 * - PDF: 이 HTML 을 그대로 화면에 렌더링한 뒤 window.print() (A4 @page 규칙, 인쇄 여백)
 * - HTML 다운로드: 아래 buildStandaloneHtml() 이 만든 단일 파일(오프라인 열람, 학생 입력 폼 포함)
 * 서버 없이 브라우저에서만 처리한다(Spark 요금제).
 */
import { formatYear } from '@/lib/history';
import { KIND_LABELS } from '@/lib/worksheet';
import type { WorksheetItem } from '@/types/firestore';
import type { WorksheetMeta } from '@/lib/worksheet';

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface RenderOptions {
  /** true 면 학생이 직접 입력할 수 있는 폼(input/textarea)을 넣는다 */
  withInputs: boolean;
  /** true 면 교사용 정답·해설을 함께 보여준다 */
  withAnswers?: boolean;
}

const blank = (o: RenderOptions, w = '100%') =>
  o.withInputs ? `<input class="fill" style="width:${w}" />` : `<span class="fill" style="width:${w}"></span>`;

const lines = (o: RenderOptions, n: number) =>
  o.withInputs
    ? `<textarea class="lines" rows="${n}"></textarea>`
    : `<div class="lines">${Array.from({ length: n }, () => '<div class="line"></div>').join('')}</div>`;

function renderItem(item: WorksheetItem, index: number, o: RenderOptions): string {
  const p = (item.payload ?? {}) as Record<string, unknown>;
  const head = `<h2><span class="no">${index}</span>${esc(KIND_LABELS[item.kind])}</h2>`;
  const prompt = `<p class="prompt">${esc(item.prompt).replace(/\n/g, '<br />')}</p>`;

  switch (item.kind) {
    case 'objective':
      return `<section class="item objective">${head}<ul class="goals">${esc(item.prompt)
        .split('\n')
        .map((l) => `<li>${l}</li>`)
        .join('')}</ul></section>`;

    case 'explore': {
      const targets = (p.targets as { name: string; ask: string }[] | undefined) ?? [];
      return `<section class="item">${head}${prompt}
        <table class="grid"><thead><tr><th style="width:30%">찾을 나라·인물</th><th>알아낸 것 (${esc(targets[0]?.ask ?? '수도와 존속 기간')})</th></tr></thead>
        <tbody>${targets.map((t) => `<tr><td>${esc(t.name)}</td><td>${blank(o)}</td></tr>`).join('')}</tbody></table></section>`;
    }

    case 'compare_table': {
      const rows = (p.rows as { label: string; hint?: string }[] | undefined) ?? [];
      const cols = (p.columns as string[] | undefined) ?? ['나라(왕조)', '대표 인물', '특징'];
      return `<section class="item">${head}${prompt}
        <table class="grid"><thead><tr><th style="width:16%">지역</th>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${rows
          .map((r) => `<tr><th class="rowhead">${esc(r.label)}</th>${cols.map(() => `<td>${blank(o)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></section>`;
    }

    case 'distance': {
      const from = p.from as { name: string } | undefined;
      const to = p.to as { name: string } | undefined;
      const ans = p.answer as { km: number; walkDays: number; horseDays: number; sailDays: number } | undefined;
      const rates = p.rates as { walkKmPerDay: number; horseKmPerDay: number; sailKmPerDay: number } | undefined;
      return `<section class="item">${head}${prompt}
        <table class="grid"><tbody>
          <tr><th class="rowhead" style="width:28%">두 지점</th><td>${esc(from?.name ?? '')} ↔ ${esc(to?.name ?? '')}</td></tr>
          <tr><th class="rowhead">직선거리(대권거리)</th><td>${blank(o, '8em')} km</td></tr>
          <tr><th class="rowhead">도보(하루 ${esc(rates?.walkKmPerDay ?? 30)}km)</th><td>약 ${blank(o, '5em')} 일</td></tr>
          <tr><th class="rowhead">범선(하루 ${esc(rates?.sailKmPerDay ?? 120)}km)</th><td>약 ${blank(o, '5em')} 일</td></tr>
        </tbody></table>
        ${o.withAnswers && ans ? `<p class="answer">교사용 참고: 약 ${ans.km.toLocaleString()} km · 도보 ${ans.walkDays}일 · 말 ${ans.horseDays}일 · 범선 ${ans.sailDays}일</p>` : ''}
      </section>`;
    }

    case 'route': {
      const stops = Number(p.stops ?? 3);
      return `<section class="item">${head}${prompt}
        <table class="grid"><thead><tr><th style="width:16%">순서</th><th>장소</th><th style="width:22%">연대</th></tr></thead>
        <tbody>${Array.from({ length: stops }, (_, i) => `<tr><td>${i + 1}</td><td>${blank(o)}</td><td>${blank(o)}</td></tr>`).join('')}</tbody></table>
        <p class="sub">총거리 ${blank(o, '8em')} km · 지나간 지역 ${blank(o, '55%')}</p></section>`;
    }

    case 'essay':
      return `<section class="item">${head}${prompt}${lines(o, Number(p.lines ?? 6))}</section>`;

    case 'self_check': {
      const checks = (p.items as string[] | undefined) ?? [];
      return `<section class="item">${head}${prompt}
        <table class="grid check"><thead><tr><th>항목</th><th style="width:8%">잘함</th><th style="width:8%">보통</th><th style="width:10%">더 노력</th></tr></thead>
        <tbody>${checks.map((c) => `<tr><td>${esc(c)}</td><td>☐</td><td>☐</td><td>☐</td></tr>`).join('')}</tbody></table></section>`;
    }
  }
}

export const WORKSHEET_CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: #f1f5f9; color: #0f172a;
  font-family: "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; font-size: 11pt; line-height: 1.55; }
.sheet { width: 210mm; min-height: 297mm; margin: 8mm auto; padding: 16mm 14mm; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
header.ws { border-bottom: 2px solid #0f172a; padding-bottom: 6mm; margin-bottom: 6mm; }
header.ws h1 { font-size: 17pt; margin: 0 0 2mm; }
header.ws .meta { font-size: 9.5pt; color: #475569; display: flex; flex-wrap: wrap; gap: 4mm; }
header.ws .who { margin-top: 4mm; font-size: 10pt; display: flex; gap: 6mm; }
header.ws .who span { border-bottom: 1px solid #94a3b8; min-width: 28mm; display: inline-block; }
.item { margin: 0 0 7mm; page-break-inside: avoid; break-inside: avoid; }
.item h2 { font-size: 11.5pt; margin: 0 0 2mm; display: flex; align-items: center; gap: 2mm; }
.item h2 .no { background: #0f172a; color: #fff; border-radius: 999px; width: 6.5mm; height: 6.5mm; display: inline-flex; align-items: center; justify-content: center; font-size: 9pt; }
.prompt { margin: 0 0 2.5mm; }
.goals { margin: 0; padding-left: 5mm; }
.goals li { margin-bottom: 1mm; }
table.grid { width: 100%; border-collapse: collapse; }
table.grid th, table.grid td { border: 1px solid #94a3b8; padding: 2mm 2.5mm; font-size: 10pt; vertical-align: top; }
table.grid thead th { background: #e2e8f0; font-weight: 700; }
table.grid td { height: 11mm; }
.rowhead { background: #f8fafc; text-align: left; font-weight: 600; }
table.check td { text-align: center; height: 8mm; }
table.check td:first-child { text-align: left; }
.fill { display: inline-block; border: none; border-bottom: 1px dotted #64748b; min-height: 6mm; background: transparent; font: inherit; color: inherit; }
input.fill { padding: 0 1mm; }
.lines .line { border-bottom: 1px dotted #94a3b8; height: 8mm; }
textarea.lines { width: 100%; border: 1px solid #cbd5e1; border-radius: 2mm; padding: 2mm; font: inherit; line-height: 8mm; background: repeating-linear-gradient(#fff 0 7mm, #e2e8f0 7mm 8mm); }
.sub { font-size: 10pt; margin-top: 2mm; }
.answer { font-size: 9.5pt; color: #b45309; margin-top: 2mm; }
footer.ws { margin-top: 8mm; border-top: 1px solid #cbd5e1; padding-top: 3mm; font-size: 8.5pt; color: #64748b; display: flex; justify-content: space-between; }
.toolbar { position: sticky; top: 0; background: #0f172a; color: #fff; padding: 3mm; display: flex; gap: 3mm; justify-content: center; }
.toolbar button { font: inherit; padding: 2mm 4mm; border-radius: 2mm; border: none; background: #fbbf24; color: #0f172a; font-weight: 700; cursor: pointer; }
@page { size: A4; margin: 12mm; }
@media print {
  body { background: #fff; }
  .sheet { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
  .toolbar { display: none; }
  textarea.lines, input.fill { border-color: #94a3b8; }
}
`;

/** 활동지 본문(헤더 + 문항) — 화면 미리보기와 인쇄, 다운로드에 모두 쓴다 */
export function renderWorksheetBody(items: WorksheetItem[], meta: WorksheetMeta, o: RenderOptions): string {
  const standards = meta.standards.length ? meta.standards.join(', ') : '';
  return `<div class="sheet">
  <header class="ws">
    <h1>${esc(meta.title)}</h1>
    <div class="meta">
      <span>연대 ${esc(formatYear(meta.yearRange[0]))} ~ ${esc(formatYear(meta.yearRange[1]))}</span>
      ${standards ? `<span>성취기준 ${esc(standards)}</span>` : ''}
      ${meta.className ? `<span>${esc(meta.className)}</span>` : ''}
      ${meta.schoolName ? `<span>${esc(meta.schoolName)}</span>` : ''}
    </div>
    <div class="who"><label>학년 반 번호 <span></span></label><label>이름 <span></span></label><label>날짜 <span></span></label></div>
  </header>
  ${items.map((it, i) => renderItem(it, i + 1, o)).join('\n')}
  <footer class="ws"><span>History Globe · 3D 지구본 세계사 탐색</span><span>${esc(meta.teacherName ?? '')}</span></footer>
</div>`;
}

/** 오프라인에서 열 수 있는 단일 HTML 파일 (학생 입력 폼 + 인쇄 버튼 포함) */
export function buildStandaloneHtml(items: WorksheetItem[], meta: WorksheetMeta, o: RenderOptions = { withInputs: true }): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(meta.title)} — 활동지</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<!-- 웹폰트는 화면을 막지 않게 비동기로 불러오고, 실패하면 시스템 한글 글꼴을 쓴다 -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap" media="print" onload="this.media='all'" />
<style>${WORKSHEET_CSS}</style>
</head>
<body>
<div class="toolbar">
  <button type="button" onclick="window.print()">🖨 인쇄 / PDF로 저장</button>
  <button type="button" onclick="save()">💾 입력 내용 저장</button>
  <button type="button" onclick="load()">↩ 저장한 내용 불러오기</button>
</div>
${renderWorksheetBody(items, meta, o)}
<script>
// 인터넷이 없어도 열리도록 웹폰트는 실패해도 무방하며, 입력 내용은 이 브라우저에 저장된다.
var KEY = 'history-globe-worksheet:' + ${JSON.stringify(meta.title)};
function fields() { return Array.prototype.slice.call(document.querySelectorAll('input.fill, textarea.lines')); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(fields().map(function (f) { return f.value; }))); alert('이 컴퓨터에 저장했습니다.'); } catch (e) { alert('저장할 수 없습니다: ' + e.message); } }
function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); fields().forEach(function (f, i) { if (v[i] != null) f.value = v[i]; }); } catch (e) {} }
load();
</script>
</body>
</html>`;
}
