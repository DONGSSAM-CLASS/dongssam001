import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProductSchema, MarketingSchema } from '../src/schemas.mjs';
import { escapeHtml, slugify, renderKit, renderProductHtml } from '../src/render.mjs';
import { productPrompt } from '../src/prompts.mjs';
import { estimateCostUSD } from '../src/generate.mjs';
import { SAMPLE_KIT } from '../src/sample.mjs';

test('예시 데이터가 스키마를 통과한다', () => {
  ProductSchema.parse(SAMPLE_KIT.product);
  MarketingSchema.parse(SAMPLE_KIT.marketing);
});

test('HTML 특수문자를 이스케이프한다', () => {
  assert.equal(escapeHtml('<b>"A" & \'B\'</b>'), '&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;');
});

test('폴더 이름에 쓸 수 없는 문자를 지운다', () => {
  assert.equal(slugify('임진왜란: 동아시아/질서?'), '임진왜란-동아시아질서');
  assert.equal(slugify('   '), 'kit');
});

test('모델 출력에 섞인 태그가 그대로 실행되지 않는다', () => {
  const product = structuredClone(SAMPLE_KIT.product);
  product.title = '<script>alert(1)</script>';
  const html = renderProductHtml(product);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('키트 파일을 모두 만들고 활동지·정답·체크리스트가 들어간다', () => {
  const files = renderKit(SAMPLE_KIT, { author: '동쌤' });
  assert.deepEqual(Object.keys(files).sort(), ['CHECKLIST.md', 'blog.md', 'kit.json', 'listing.md', 'product.html', 'sns.md']);
  assert.match(files['product.html'], /활동지/);
  assert.match(files['product.html'], /정답과 해설/);
  assert.match(files['product.html'], /© 동쌤/);
  assert.match(files['listing.md'], /5,900원/);
  for (const f of SAMPLE_KIT.product.factCheck) assert.ok(files['CHECKLIST.md'].includes(f.claim));
});

test('추가 요청은 있을 때만 프롬프트에 넣는다', () => {
  const base = { topic: 'T', grade: 'G', type: 'lesson-pack', questions: 5 };
  assert.ok(!productPrompt({ ...base, note: '' }).includes('추가 요청'));
  assert.ok(productPrompt({ ...base, note: '사료 포함' }).includes('추가 요청: 사료 포함'));
});

test('비용 추정은 알려진 모델만 계산한다', () => {
  assert.equal(estimateCostUSD('claude-opus-5-5', { input_tokens: 1_000_000, output_tokens: 0 }), 4);
  assert.equal(estimateCostUSD('unknown-model', { input_tokens: 1 }), null);
});
