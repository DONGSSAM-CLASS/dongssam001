#!/usr/bin/env node
/**
 * 힉스필드(Higgsfield) 이미지 주문서 — 『임시정부 : 새로운 나라를 향해』(제2탄)
 *
 *   npm run assets:higgsfield              # 전체 목록
 *   npm run assets:higgsfield q-name       # 파일 이름에 q-name 이 들어간 것만
 *   npm run assets:higgsfield -- --json    # 힉스필드 MCP 에 넘기기 좋은 JSON
 *
 * 출력된 프롬프트를 힉스필드 MCP 가 연결된 Claude 대화창에 붙여 넣으면 이미지를 만들어 준다.
 * 만든 파일을 public/assets/higgsfield/ 에 「파일 이름」 그대로 저장하면 게임에 자동으로 붙는다.
 * (파일이 없어도 게임은 그대로 돌아간다 — 코드로 그린 3D 화면이 기본이다.)
 *
 * 1탄과 같은 원칙
 *  - 프롬프트에 실존 인물의 이름을 넣지 않는다. 얼굴을 만들지 않는다.
 *  - 폭력 장면을 만들지 않는다.
 *  - 생성 이미지는 「삽화」이지 「사료」가 아니다. 게임 화면에도 그렇게 적는다.
 *
 * 2탄에서 더한 것
 *  - sky-<장소>.jpg : 1인칭 3D 화면의 하늘 파노라마(2:1 등장방형). 있으면 3D 배경으로 쓴다.
 *  - act-<막>.jpg   : 시대 전환 화면의 배경 삽화.
 *  - ending.jpg     : 감사 증서 화면의 삽화.
 */

/** 1탄과 같은 화풍 — 두 게임이 한 시리즈로 보이게 한다 */
const STYLE = [
  'cinematic historical illustration, painterly, muted earth palette of ink, brass and hemp tones,',
  'soft volumetric light, shallow depth of field, 1919-1948 East Asia,',
  'documentary realism, no text, no letters, no watermark, no modern objects,',
  'faces turned away or in shadow, no recognizable portraits of real people',
].join(' ');

/** 하늘 파노라마 — 사람·건물 없이 하늘과 먼 지평선만 */
const SKY_STYLE = [
  'seamless equirectangular 360 degree sky panorama, 2:1,',
  'only sky and very distant low horizon, no buildings in foreground, no people, no text,',
  'soft painterly clouds, historical atmosphere',
].join(' ');

const SHOTS = [
  /* ── 표지·엔딩 ── */
  {
    file: 'cover',
    ratio: '16:9',
    title: '표지 — 기록 수첩과 시간의 문',
    prompt:
      'An old leather-bound notebook lying open on a marble floor of a quiet memorial hall, a warm golden light pouring out of its pages toward a tall stone doorway, beyond the doorway a faint glimpse of a 1919 Shanghai alley with a small Korean flag, dust motes in the air.',
  },
  {
    file: 'ending',
    ratio: '21:9',
    title: '엔딩 — 명패 앞의 흰 국화',
    prompt:
      'A row of simple stone memorial plaques in a bright, calm hall, white chrysanthemums and handwritten letters in envelopes placed in front of them, morning light from tall windows, a student seen from behind standing quietly, hopeful and respectful mood.',
  },

  /* ── 시대 전환 ── */
  {
    file: 'act-1',
    ratio: '21:9',
    title: '제1막 — 1919년 4월, 김신부로의 밤',
    prompt:
      'A lamplit upstairs meeting room in the French Concession of Shanghai at night, April 1919, a long table covered with papers and ink brushes, silhouettes of men in white Korean durumagi coats and dark suits seen from behind, one standing at a small podium, cherry blossoms outside the window.',
  },
  {
    file: 'act-2',
    ratio: '21:9',
    title: '제2막 — 부서를 나눈 청사',
    prompt:
      'A narrow corridor of a modest government office in Shanghai, 1919, doors opening onto small rooms with desks, a wall map, a steel safe and a hand-operated printing press across the street, clerks in suits carrying folders, warm afternoon light, seen from behind.',
  },
  {
    file: 'act-3',
    ratio: '21:9',
    title: '제3막 — 마당로의 좁은 골목',
    prompt:
      'A narrow shikumen lane in Shanghai in the late 1920s under a grey sky, laundry hanging between stone-framed doorways, a single lit window on the ground floor where a few people sit around a small table, quiet perseverance, muted colours.',
  },
  {
    file: 'act-4',
    ratio: '21:9',
    title: '제4막 — 안개의 도시 충칭',
    prompt:
      'Misty hillside city of Chongqing in the early 1940s, stone stairways and wooden houses on terraces, a modest compound with a Korean flag on a pole, uniformed figures standing in formation in a small courtyard seen from far behind, river fog.',
  },
  {
    file: 'act-5',
    ratio: '21:9',
    title: '제5막 — 1945년 겨울, 서울',
    prompt:
      'A two-storey Western-style residence with a pine-tree garden in Seoul in late November 1945, cold clear blue sky, a small group of travellers in overcoats walking up the stone path with suitcases, seen from behind, quiet emotion of homecoming.',
  },
  {
    file: 'act-6',
    ratio: '21:9',
    title: '에필로그 — 오늘로',
    prompt:
      'A tall stone doorway glowing with golden light opening from a 1948 street scene into a bright modern memorial hall, a student stepping through seen from behind, symbolic passage of time, calm and luminous.',
  },

  /* ── 퀘스트 삽화 (제1막) ── */
  { file: 'quest-q-name', ratio: '21:9', title: '새 나라의 이름', prompt: 'A brush writing the characters of a new country name on rice paper under a single oil lamp, hands only, crowd of silhouettes around the table, Shanghai 1919.' },
  { file: 'quest-q-republic', ratio: '21:9', title: '임시헌장 제1조', prompt: 'A handwritten charter of ten short articles laid on a green felt meeting table, a pen and ink stone, men standing and applauding in soft focus behind, dawn light through the window, 1919.' },
  { file: 'quest-q-rights', ratio: '21:9', title: '국민에게 약속한 것', prompt: 'Symbolic scene of ordinary people of 1919 Korea — a farmer, a woman in hanbok, a student, a merchant — standing side by side seen from behind, looking toward a sunrise, equality and hope.' },
  { file: 'quest-q-assembly', ratio: '21:9', title: '의정원이라는 자리', prompt: 'Rows of wooden benches facing a raised speaker platform with two Korean flags on stands, an empty gavel on the desk, early morning light, small meeting hall, 1919 Shanghai.' },
  /* 제2막 */
  { file: 'quest-q-unify-order', ratio: '21:9', title: '세 정부, 한 정부', prompt: 'Three bundles of documents tied with different coloured cords being placed together on one table, hands only, a map of East Asia beneath, 1919.' },
  { file: 'quest-q-provisional-constitution', ratio: '21:9', title: '세 갈래로 나눈 권력', prompt: 'Three separate rooms seen through open doors along one corridor — an assembly hall, an office with desks, a small courtroom — symbolic separation of powers, 1919 East Asian interior.' },
  { file: 'quest-q-yeontong', ratio: '21:9', title: '국내로 이어지는 핏줄', prompt: 'A wall map of the Korean peninsula with red pins connected by thread, a lamp, sealed letters and cloth money pouches on a desk, secretive atmosphere, 1919.' },
  { file: 'quest-q-news', ratio: '21:9', title: '독립신문', prompt: 'A hand-operated letterpress printing machine in a small ink-stained room, freshly printed newspapers stacked beside it with illegible text, a worker seen from behind, Shanghai 1919.' },
  { file: 'quest-q-revenue', ratio: '21:9', title: '나라 살림의 곳간', prompt: 'A steel safe and an open ledger book on a wooden desk, small envelopes of donations from overseas communities, a fountain pen, warm lamp light, 1920.' },
  { file: 'quest-q-bond', ratio: '21:9', title: '독립공채의 약속', prompt: 'An ornate printed bond certificate with decorative border and no readable text, lying on a desk beside coins, an elderly hand placing it carefully in an envelope, 1920.' },
  { file: 'quest-q-diplomacy', ratio: '21:9', title: '세계로 낸 창', prompt: 'A world map on an office wall with ribbons linking Shanghai, Paris and Washington, a typewriter and diplomatic letters on the desk, a figure in a suit seen from behind, 1919.' },
  /* 제3막 */
  { file: 'quest-q-household', ratio: '21:9', title: '정부의 안살림', prompt: 'A small kitchen in a Shanghai row house, a woman in a modest hanbok seen from behind cooking rice in an iron pot, a travel bundle and train ticket on the table, late 1920s.' },
  { file: 'quest-q-congress', ratio: '21:9', title: '국민대표회의', prompt: 'A crowded meeting hall split into two groups standing apart, papers on the floor, tense but non-violent argument, silhouettes, Shanghai 1923.' },
  { file: 'quest-q-impeach', ratio: '21:9', title: '대통령도 헌법 아래에', prompt: 'A formal resolution document being signed at a wooden table, a gavel, the constitution book open beside it, solemn assembly members seen from behind, 1925.' },
  { file: 'quest-q-collective', ratio: '21:9', title: '한 사람이 아니라 여럿이', prompt: 'Several hands placed together on a single document on a round table, lamp light, small room, 1927, symbolic collective leadership.' },
  { file: 'quest-q-party', ratio: '21:9', title: '정부를 떠받칠 정당', prompt: 'A handwritten party manifesto with a simple emblem of three equal circles, pens and tea cups on a table, Shanghai 1930.' },
  /* 제4막 */
  { file: 'quest-q-chairman', ratio: '21:9', title: '전쟁 속의 정부', prompt: 'A chairman\'s office in a wartime hillside building, a desk with maps and telegrams, a Korean flag on a stand, air-raid shelter entrance visible through the window, Chongqing 1940, figure seen from behind.' },
  { file: 'quest-q-army', ratio: '21:9', title: '정부의 군대', prompt: 'A founding ceremony of a small army unit in a courtyard, soldiers in simple uniforms standing in rows seen from behind, Korean flags on poles, misty Chongqing morning, 1940, no weapons raised.' },
  { file: 'quest-q-samgyun', ratio: '21:9', title: '광복 뒤의 설계도', prompt: 'An architect-style blueprint of an imagined future country laid on a desk — a school, a ballot box, a farm field drawn in fine lines — beside a thick handwritten manuscript, 1941.' },
  { file: 'quest-q-women', ratio: '21:9', title: '의정원의 여성 의원', prompt: 'A woman in a 1940s hanbok jacket standing at an assembly table among men, seen from behind, papers in hand, other women in uniforms at the doorway, Chongqing.' },
  { file: 'quest-q-coalition', ratio: '21:9', title: '왼손과 오른손', prompt: 'Two hands from different sleeves — a Western suit and a military uniform — joining over a constitution document, warm light, 1944.' },
  { file: 'quest-q-constitution-order', ratio: '21:9', title: '다섯 번 고친 헌법', prompt: 'Six old constitution booklets of different sizes lined up in chronological order on a shelf, the oldest yellowed, archivist hands arranging them, 1944.' },
  /* 제5막 */
  { file: 'quest-q-return', ratio: '21:9', title: '개인 자격으로', prompt: 'A small propeller aircraft on a cold airfield in November 1945, a handful of travellers in overcoats walking down the steps seen from behind, bare trees, pale winter sun.' },
  { file: 'quest-q-1948', ratio: '21:9', title: '제헌헌법이 이어받은 것', prompt: 'A newly printed constitution booklet placed on a podium in a large assembly hall in 1948, rows of empty seats, Korean flag, bright solemn light.' },
  /* 에필로그 */
  { file: 'quest-q-legitimacy', ratio: '21:9', title: '오늘의 헌법이 말하는 것', prompt: 'A modern classroom desk with an open constitution booklet and an old notebook side by side, sunlight, a student\'s hand resting on the page, continuity between past and present.' },

  /* ── 하늘 파노라마 (1인칭 3D 배경) ── */
  { file: 'sky-memorial', ratio: '2:1', title: '하늘 · 보훈의 전당', sky: true, prompt: 'Clear bright midday sky with thin high clouds.' },
  { file: 'sky-assembly', ratio: '2:1', title: '하늘 · 1919년 4월 상하이', sky: true, prompt: 'Hazy spring sky over a flat river city, soft pale blue with light haze, a few drifting cherry petals.' },
  { file: 'sky-hafei', ratio: '2:1', title: '하늘 · 1919년 가을 상하이', sky: true, prompt: 'Clear autumn afternoon sky with scattered cumulus clouds, warm light.' },
  { file: 'sky-madang', ratio: '2:1', title: '하늘 · 1920년대 상하이', sky: true, prompt: 'Heavy overcast grey sky, low layered clouds, muted light.' },
  { file: 'sky-chongqing', ratio: '2:1', title: '하늘 · 충칭', sky: true, prompt: 'Thick river fog and pale grey sky over distant hills, very soft diffused light.' },
  { file: 'sky-seoul', ratio: '2:1', title: '하늘 · 1945년 11월 서울', sky: true, prompt: 'Crisp cold early-winter sky, deep clear blue, low sun, distant mountain silhouettes on the horizon.' },
];

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const filter = args.find((a) => !a.startsWith('--'));
const list = filter ? SHOTS.filter((s) => s.file.includes(filter)) : SHOTS;

const fullPrompt = (shot) => (shot.sky ? `${shot.prompt} ${SKY_STYLE}` : `${shot.prompt} ${STYLE}`);

if (asJson) {
  console.log(
    JSON.stringify(
      list.map((s) => ({ file: `public/assets/higgsfield/${s.file}.jpg`, aspect_ratio: s.ratio, title: s.title, prompt: fullPrompt(s) })),
      null,
      2,
    ),
  );
} else {
  console.log(`힉스필드 주문서 — ${list.length}장\n저장 위치: public/assets/higgsfield/<파일 이름>.jpg (webp·png 도 됩니다)\n`);
  for (const shot of list) {
    console.log('─'.repeat(72));
    console.log(`■ ${shot.title}`);
    console.log(`  파일 이름 : ${shot.file}.jpg`);
    console.log(`  화면 비율 : ${shot.ratio}`);
    console.log(`  프롬프트  : ${fullPrompt(shot)}`);
  }
  console.log('─'.repeat(72));
  console.log('\n⚠ 실존 인물의 얼굴이 또렷하게 나오거나 시대에 없는 물건이 보이면 다시 만드세요.');
}
