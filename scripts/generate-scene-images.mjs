/**
 * 『아직 오지 않은 광복』 시네마틱 배경 이미지 생성 스크립트 (GPT Image)
 *
 * 실제 역사적 사실에 근거한 1940~1945년 한국광복군 관련 장면을,
 * 블록버스터 느낌의 실사 시네마틱 이미지로 생성해 public/game/scenes/<sceneKey>.jpg 에 저장하고,
 * 생성된 씬 키 목록을 src/game/scenes/available.json 에 기록한다(그 씬만 실사 이미지로 표시됨).
 *
 * 사용법:
 *   OPENAI_API_KEY=sk-... node scripts/generate-scene-images.mjs            # 전체 7장
 *   OPENAI_API_KEY=sk-... node scripts/generate-scene-images.mjs ceremony   # 특정 씬만
 *
 * 환경 변수:
 *   OPENAI_API_KEY        (필수) OpenAI API 키
 *   OPENAI_IMAGE_MODEL    (선택) 기본 'gpt-image-1'. 최신 이미지 모델 id 로 바꿀 수 있음.
 *   OPENAI_IMAGE_SIZE     (선택) 기본 '1536x1024'(가로). '1024x1024' 등 지원.
 *   HTTPS_PROXY / https_proxy (선택) 프록시 환경이면 자동 사용(undici 있을 때).
 *
 * 주의: 인물은 특정 실존 인물의 얼굴을 재현하지 않도록(초상권·오인 방지) 군중·실루엣·상징 위주로 구성한다.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'game', 'scenes');
const MANIFEST = join(ROOT, 'src', 'game', 'scenes', 'available.json');

const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const SIZE = process.env.OPENAI_IMAGE_SIZE || '1536x1024';
const API_KEY = process.env.OPENAI_API_KEY;

const STYLE_SUFFIX =
  ' Consistent series look: photorealistic cinematic film still, 35mm anamorphic, fine film grain, ' +
  'warm desaturated teal-and-amber color grade, volumetric light, shallow depth of field, epic blockbuster mood. ' +
  'Historically accurate 1940s East Asia, wartime era. Solemn and respectful. ' +
  'IMPORTANT: no text, captions, letters, watermarks or logos; no modern objects (no cars, phones, plastic, modern clothing); ' +
  'do NOT depict any specific real identifiable person — use anonymous figures, crowds and silhouettes.';

/** 씬 키 → 역사 기반 시네마틱 프롬프트 (CinematicScene 의 SceneKey 와 일치) */
const PROMPTS = {
  'chongqing-night':
    'Wide cinematic establishing shot of Chongqing, China at night in 1940 — the wartime capital where the Korean Provisional Government settled. ' +
    'A terraced hillside city of stone-and-wood buildings above the confluence of the Yangtze and Jialing rivers, thick river fog rolling through, warm lantern-lit windows glowing, distant misty mountains, reflections on dark water. Moody blue night with amber lights.',
  ceremony:
    'Cinematic interior of a solemn military founding ceremony in a formal hall in Chongqing, China, dawn of 17 September 1940 — the inauguration of the Korean Liberation Army. ' +
    'A large Korean Taegukgi flag (white field, a red-over-blue circular taegeuk, four black trigrams in the corners) hangs on the wall lit by a dramatic shaft of warm light. Rows of dignitaries and uniformed officers in 1940s attire seen from behind and in silhouette, banners, dust motes drifting in the light beams.',
  recruit:
    'Cinematic 1940s wartime Chinese street in autumn: a weathered brick-and-plaster wall pasted with independence-army recruitment and propaganda posters (imagery only, no readable text). ' +
    'A few anonymous young people in 1940s clothing pause to read the posters, warm golden side light, drifting dust, documentary realism.',
  declaration:
    'Cinematic close interior at night, a government-in-exile office in 1941. A wooden desk in a warm pool of light from a single kerosene lamp: an official proclamation document bearing a red wax seal, an old fountain pen resting on it, and a period typewriter half in shadow. ' +
    'Deep surrounding darkness, tense and historic mood.',
  burma:
    'Cinematic night scene in the dense Burmese jungle, 1943 — a small Korean liberation-army unit attached to Allied forces conducting psychological-warfare broadcasting. ' +
    'A field loudspeaker/megaphone on a stand and radio equipment, a lone soldier silhouette operating it, faint haze suggesting sound over the treeline, moonlight, humid mist, fireflies, tropical foliage.',
  'oss-xian':
    'Cinematic dawn on the dusty loess plateau near Xi’an, China, 1945 — Korean liberation-army members training for a homeland-infiltration operation with American intelligence advisers. ' +
    'A figure descending under a round WWII parachute high in the sky, other anonymous soldiers in 1940s fatigues low-crawling and advancing with rifles across the distant ridges, golden dusty haze, long shadows.',
  'liberation-dawn':
    'Cinematic sunrise over East Asian mountains in August 1945 — liberation dawn. A large Korean Taegukgi flag on a pole catches the first golden light on a ridge, and a small crowd of anonymous people in 1940s clothing raise their arms in celebration, seen in silhouette against god-rays. ' +
    'Warm hopeful golden light, volumetric beams, a bittersweet solemn mood.',
};

async function installProxyIfAny() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (!proxy) return;
  try {
    const { ProxyAgent, setGlobalDispatcher } = await import('undici');
    setGlobalDispatcher(new ProxyAgent(proxy));
    console.log(`[proxy] using ${proxy}`);
  } catch {
    console.warn('[proxy] HTTPS_PROXY set but undici not available — continuing without explicit proxy');
  }
}

async function generateOne(scene) {
  const prompt = PROMPTS[scene] + STYLE_SUFFIX;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, n: 1, output_format: 'jpeg', quality: 'high' }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image data returned for ${scene}: ${JSON.stringify(json).slice(0, 300)}`);
  const buf = Buffer.from(b64, 'base64');
  await writeFile(join(OUT_DIR, `${scene}.jpg`), buf);
  console.log(`  ✓ ${scene}.jpg (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  if (!API_KEY) {
    console.error('환경 변수 OPENAI_API_KEY 가 필요합니다. 예: OPENAI_API_KEY=sk-... node scripts/generate-scene-images.mjs');
    process.exit(1);
  }
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const scenes = only.length ? only : Object.keys(PROMPTS);
  const invalid = scenes.filter((s) => !PROMPTS[s]);
  if (invalid.length) {
    console.error(`알 수 없는 씬: ${invalid.join(', ')}\n사용 가능: ${Object.keys(PROMPTS).join(', ')}`);
    process.exit(1);
  }

  await installProxyIfAny();
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`모델=${MODEL} 크기=${SIZE} · ${scenes.length}개 씬 생성`);

  const done = [];
  for (const scene of scenes) {
    try {
      await generateOne(scene);
      done.push(scene);
    } catch (e) {
      console.error(`  ✗ ${scene}: ${e.message}`);
    }
  }

  // available.json 갱신(기존 목록 + 이번에 생성한 것 합집합)
  let existing = [];
  try {
    existing = JSON.parse(await readFile(MANIFEST, 'utf-8'));
  } catch {
    /* 없으면 새로 */
  }
  const merged = [...new Set([...existing, ...done])];
  await writeFile(MANIFEST, JSON.stringify(merged, null, 2) + '\n');
  console.log(`\n완료: ${done.length}/${scenes.length}개 생성. available.json = ${JSON.stringify(merged)}`);
  console.log('이제 npm run build 후 배포하면 실사 이미지가 적용됩니다.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
