// 웹 화면을 claude.ai 아티팩트로 올릴 수 있는 HTML 한 파일로 묶는다.
// web/page.html(마크업·스타일) + web/app.mjs(로직, src/ 모듈과 zod 포함) → web/dist/content-studio.html
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'web/dist/content-studio.html');

const result = await build({
  entryPoints: [path.join(root, 'web/app.mjs')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2022',
  write: false,
  legalComments: 'none',
});
const code = result.outputFiles[0].text.replaceAll('</script', '<\\/script');
const page = await readFile(path.join(root, 'web/page.html'), 'utf8');
if (!page.includes('<!-- APP_SCRIPT -->')) throw new Error('web/page.html 에 <!-- APP_SCRIPT --> 자리가 없습니다.');
const html = page.replace('<!-- APP_SCRIPT -->', () => `<script>\n${code}</script>`);

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, html, 'utf8');
console.log(`만들었습니다 → ${path.relative(root, out)} (${(html.length / 1024).toFixed(0)} KB)`);
