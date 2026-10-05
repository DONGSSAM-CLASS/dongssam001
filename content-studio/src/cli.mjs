#!/usr/bin/env node
// 사용법은 README.md 또는 `node src/cli.mjs --help` 참고.
import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRODUCT_TYPES } from './prompts.mjs';
import { renderKit, slugify } from './render.mjs';

const HELP = `콘텐츠 스튜디오 — 주제 하나로 판매용 자료 + 판매·홍보 문구 만들기

  npm run make -- --topic "임진왜란과 동아시아" [옵션]
  npm run demo                       API 키 없이 예시 결과물 만들기

옵션
  --topic <주제>          만들 자료의 주제 (필수, --topics-file 과 둘 중 하나)
  --topics-file <파일>    한 줄에 주제 하나씩 적은 텍스트 파일로 여러 개 한꺼번에
  --grade <대상>          기본값 "중학교 2학년"
  --type <유형>           ${Object.keys(PRODUCT_TYPES).join(' | ')} (기본값 lesson-pack)
  --questions <개수>      평가 문항 수 (기본값 10)
  --platforms <목록>      쉼표로 구분 (기본값 "크몽,자체 판매 페이지(블로그·스마트스토어)")
  --note <요청>           추가로 반영할 요청 사항
  --author <이름>         자료 하단 저작권 표시에 넣을 이름
  --out <폴더>            결과 폴더 (기본값 output)
  --model <모델>          기본값 claude-opus-5-5
  --effort <수준>         low | medium | high (기본값 high)
  --demo                  API 호출 없이 내장 예시로 결과물 생성
`;

function readOptions(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      topic: { type: 'string' },
      'topics-file': { type: 'string' },
      grade: { type: 'string', default: '중학교 2학년' },
      type: { type: 'string', default: 'lesson-pack' },
      questions: { type: 'string', default: '10' },
      platforms: { type: 'string', default: '크몽,자체 판매 페이지(블로그·스마트스토어)' },
      note: { type: 'string', default: '' },
      author: { type: 'string', default: '' },
      out: { type: 'string', default: 'output' },
      model: { type: 'string', default: 'claude-opus-5-5' },
      effort: { type: 'string', default: 'high' },
      demo: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (!PRODUCT_TYPES[values.type]) throw new Error(`--type 은 ${Object.keys(PRODUCT_TYPES).join(', ')} 중 하나여야 합니다.`);
  const questions = Number.parseInt(values.questions, 10);
  if (!(questions >= 3 && questions <= 30)) throw new Error('--questions 는 3~30 사이 숫자여야 합니다.');
  if (!['low', 'medium', 'high'].includes(values.effort)) throw new Error('--effort 는 low, medium, high 중 하나여야 합니다.');

  return {
    ...values,
    questions,
    platforms: values.platforms.split(',').map((s) => s.trim()).filter(Boolean),
  };
}

async function writeKit(kit, { out, author }, label) {
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = path.join(out, `${stamp}-${slugify(label)}`);
  await mkdir(dir, { recursive: true });
  const files = renderKit(kit, { author });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(dir, name), content, 'utf8');
  }
  return dir;
}

async function main() {
  const opts = readOptions(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }

  if (opts.demo) {
    const { SAMPLE_KIT } = await import('./sample.mjs');
    const dir = await writeKit(SAMPLE_KIT, opts, 'demo-임진왜란');
    console.log(`예시 결과물을 만들었습니다 → ${dir}\n먼저 CHECKLIST.md 와 product.html 을 열어 보세요.`);
    return;
  }

  let topics = [];
  if (opts['topics-file']) {
    const text = await readFile(opts['topics-file'], 'utf8');
    topics = text.split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  } else if (opts.topic) {
    topics = [opts.topic.trim()];
  }
  if (!topics.length) {
    console.log(HELP);
    process.exitCode = 1;
    return;
  }

  const { generateKit } = await import('./generate.mjs');
  let totalCost = 0;
  let failed = 0;
  for (const [i, topic] of topics.entries()) {
    console.log(`[${i + 1}/${topics.length}] ${topic}`);
    try {
      const kit = await generateKit({ ...opts, topic }, console.log);
      const dir = await writeKit(kit, opts, topic);
      if (kit.costUSD != null) totalCost += kit.costUSD;
      const cost = kit.costUSD != null ? ` (API 비용 약 $${kit.costUSD.toFixed(3)})` : '';
      console.log(`  완료 → ${dir}${cost}`);
    } catch (err) {
      failed += 1;
      console.error(`  실패: ${err.message}`);
    }
  }
  if (topics.length > 1) console.log(`\n${topics.length - failed}/${topics.length}개 완료, 총 API 비용 약 $${totalCost.toFixed(3)}`);
  console.log('판매 전에 각 폴더의 CHECKLIST.md 를 끝까지 확인하세요.');
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
