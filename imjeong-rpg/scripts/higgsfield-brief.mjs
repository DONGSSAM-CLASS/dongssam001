#!/usr/bin/env node
/**
 * 힉스필드(Higgsfield) 이미지 주문서를 출력한다.
 *
 *   npm run assets:higgsfield            # 전체 목록
 *   npm run assets:higgsfield q-hongkou  # 특정 장면만
 *
 * 출력된 프롬프트를 힉스필드 MCP 가 연결된 Claude 대화창에 붙여 넣으면
 * 이미지를 만들어 줍니다. 만들어진 파일은 public/assets/higgsfield/ 에
 * 아래 「파일 이름」 그대로 저장하면 게임에 자동으로 붙습니다.
 *
 * ⚠ 프롬프트에 실존 인물의 이름을 넣지 않습니다.
 *   사진이 남지 않은 인물이 많고, 생성 이미지를 초상처럼 쓰면 역사 오인을 부릅니다.
 *   군중·실루엣·장소·사물 위주로 만들도록 작성했습니다.
 */

/** 모든 장면에 공통으로 붙이는 화풍 지시 */
const STYLE = [
  'cinematic historical illustration, painterly, muted earth palette,',
  'soft volumetric light, shallow depth of field, 1920s-1940s East Asia,',
  'documentary realism, no text, no watermark, no modern objects,',
  'faces turned away or in shadow, no recognizable portraits of real people',
].join(' ');

const SHOTS = [
  {
    file: 'cover',
    ratio: '16:9',
    title: '표지 — 임시정부 청사의 밤',
    prompt:
      'A narrow alley of the French Concession in Shanghai at dusk, 1919. A modest grey-brick shikumen row house with a stone door frame, a small Korean flag hanging by the entrance, lantern light spilling onto wet cobblestones, silhouettes of men in long white coats gathering inside.',
  },
  {
    file: 'quest-q-founding',
    ratio: '21:9',
    title: '제1막 — 임시헌장이 선포되는 회의장',
    prompt:
      'A cramped upstairs room in Shanghai, April 1919. Around twenty men in white durumagi coats and dark suits crowded around a plain table, a single oil lamp, a brush-written document on rice paper at the centre, tense hopeful atmosphere, seen from behind the crowd.',
  },
  {
    file: 'quest-q-paris-delegate',
    ratio: '21:9',
    title: '파리로 떠나는 배웅',
    prompt:
      'A steamship pier in Shanghai, winter 1919. A lone traveller with a suitcase walking up a gangway, a handful of people watching from the dock in long coats, cold grey harbour light, gulls, coal smoke.',
  },
  {
    file: 'quest-q-yeontongje',
    ratio: '21:9',
    title: '연통제 — 비밀 연락망',
    prompt:
      'A dimly lit back room of a trading office near the Yalu river, 1920. Hands sorting sealed letters and small cloth bundles of coins under a hanging lamp, a ledger, a map of Korea partly covered by a newspaper, secretive mood.',
  },
  {
    file: 'quest-q-unification',
    ratio: '21:9',
    title: '세 정부의 통합',
    prompt:
      'Three separate lantern-lit meeting rooms merging into one wide hall, symbolic composition, 1919 East Asia, men in traditional Korean coats and Western suits walking toward a single table, warm and cold light meeting in the middle.',
  },
  {
    file: 'quest-q-paris-outcome',
    ratio: '21:9',
    title: '닫힌 회의장 문',
    prompt:
      'The tall closed doors of a European conference palace, Paris 1919. A small figure in a dark overcoat standing alone outside with a leather document case, rain on marble steps, uniformed guards in the background, cold overcast light.',
  },
  {
    file: 'quest-q-bond',
    ratio: '21:9',
    title: '독립공채',
    prompt:
      'An ornate printed bond certificate on a wooden desk, Washington D.C. 1920, a fountain pen, a stack of envelopes, a brass lamp, hands of an elderly immigrant counting coins beside it, warm interior light.',
  },
  {
    file: 'quest-q-mandate-dispute',
    ratio: '21:9',
    title: '갈라진 회의장',
    prompt:
      'A heated argument in a small meeting room, Shanghai early 1920s. Two groups of men standing apart, one side gesturing at a document, overturned chair, lamp swinging, strong chiaroscuro, faces obscured.',
  },
  {
    file: 'quest-q-national-congress',
    ratio: '21:9',
    title: '국민대표회의',
    prompt:
      'A long hall packed with delegates, Shanghai 1923. Rows of men in mixed Korean and Western dress, cigarette smoke, a chairman standing at a podium, notebooks and teacups, exhausted late-session atmosphere.',
  },
  {
    file: 'quest-q-impeachment',
    ratio: '21:9',
    title: '탄핵의 날',
    prompt:
      'An empty presidential chair at the head of a meeting table, Shanghai 1925, a resolution document lying in front of it, assembly members standing in the background out of focus, grey morning light through shutters.',
  },
  {
    file: 'quest-q-aegukdan',
    ratio: '21:9',
    title: '한인애국단의 결성',
    prompt:
      'A small back room at night, Shanghai 1931. A hand-written oath on paper pinned to a wall, a single candle, three shadowed figures standing in silence, grave and resolute mood, no weapons visible.',
  },
  {
    file: 'quest-q-leebongchang',
    ratio: '21:9',
    title: '도쿄로 향하는 길',
    prompt:
      'A crowded Tokyo street in January 1932 seen from a distance, winter light, a ceremonial procession far down the avenue behind a line of police, anonymous crowd, tense stillness, no violence shown.',
  },
  {
    file: 'quest-q-hongkou',
    ratio: '21:9',
    title: '훙커우 공원의 아침',
    prompt:
      'A large park ceremony ground in Shanghai, morning of 29 April 1932. An empty raised platform draped in cloth, rows of folding chairs, cherry blossoms, military banners in the distance, seen from the back of the crowd, no violence shown.',
  },
  {
    file: 'quest-q-move-route',
    ratio: '21:9',
    title: '이동의 길',
    prompt:
      'A family of refugees pushing a handcart loaded with document boxes along a muddy Chinese country road, 1930s, mist, bare willow trees, a distant river town, exhausted but determined, seen from behind.',
  },
  {
    file: 'quest-q-luoyang',
    ratio: '21:9',
    title: '군관학교 연병장',
    prompt:
      'A dusty military academy parade ground in China, 1934. Young cadets in plain uniforms standing in formation at dawn, low brick barracks, a flagpole, long shadows, faces not visible.',
  },
  {
    file: 'quest-q-gwangbokgun',
    ratio: '21:9',
    title: '총사령부 성립 전례',
    prompt:
      'A formal ceremony in a hotel hall in Chongqing, 17 September 1940. A long table draped in white, a banner of Korean script on the wall, rows of seated guests in uniform and traditional coats, warm chandelier light, seen from the side.',
  },
  {
    file: 'quest-q-nine-rules',
    ratio: '21:9',
    title: '협정 문서',
    prompt:
      'Two sets of hands across a desk signing a military agreement, Chongqing 1941, brush pen and fountain pen, official seals, a folded map, one side in Chinese uniform and one in plain jacket, tense diplomatic mood.',
  },
  {
    file: 'quest-q-geonguk-gangnyeong',
    ratio: '21:9',
    title: '건국강령을 쓰는 밤',
    prompt:
      'A scholar writing on grid manuscript paper by lamplight in a Chongqing office, November 1941, stacks of books, a small stove, rain on the window, hands and paper in focus, face out of frame.',
  },
  {
    file: 'quest-q-declaration-war',
    ratio: '21:9',
    title: '대일 선전 성명서',
    prompt:
      'A typed and brush-annotated proclamation lying on a desk beside a radio receiver, Chongqing December 1941, a newspaper with war headlines, cigarette smoke, harsh desk lamp, cold night.',
  },
  {
    file: 'quest-q-left-right',
    ratio: '21:9',
    title: '좌우가 함께 서다',
    prompt:
      'Two columns of soldiers in different uniforms merging into one formation on a Chongqing hillside parade ground, 1942, morning mist, a single banner at the front, seen from above and behind.',
  },
  {
    file: 'quest-q-india-burma',
    ratio: '21:9',
    title: '인도·버마 전선',
    prompt:
      'A small group of interpreters with a loudspeaker and radio equipment in a Burmese jungle clearing, 1943, monsoon light, British army tents in the background, mud, mosquito nets, backs to the camera.',
  },
  {
    file: 'quest-q-cairo',
    ratio: '21:9',
    title: '카이로 선언',
    prompt:
      'A newspaper front page on a wooden table in Chongqing, December 1943, headline about a great-power declaration, a pair of reading glasses, a cup of tea gone cold, morning light through a shutter.',
  },
  {
    file: 'quest-q-oss',
    ratio: '21:9',
    title: '시안 두취의 훈련장',
    prompt:
      'A loess-plateau training ground near Xi an, summer 1945. Young men practising radio operation and parachute landing falls, canvas tents, a windsock, golden late-afternoon dust, seen from a distance.',
  },
  {
    file: 'quest-q-return',
    ratio: '21:9',
    title: '환국',
    prompt:
      'A military transport aircraft on a cold airfield, November 1945, a small group of elderly men in overcoats walking down the steps carrying suitcases, bare winter trees, grey sky, no crowd waiting.',
  },
];

const wanted = process.argv.slice(2);
const shots = wanted.length ? SHOTS.filter((s) => wanted.some((w) => s.file.includes(w))) : SHOTS;

if (shots.length === 0) {
  console.error(`찾는 장면이 없습니다: ${wanted.join(', ')}`);
  console.error(`가능한 이름: ${SHOTS.map((s) => s.file).join(', ')}`);
  process.exit(1);
}

console.log('═'.repeat(78));
console.log('  힉스필드 이미지 주문서 — 『임시정부 1919-1945』');
console.log('  아래 프롬프트를 힉스필드 MCP 가 연결된 Claude 대화창에 붙여 넣으세요.');
console.log('  만든 이미지는 public/assets/higgsfield/<파일 이름>.jpg 로 저장합니다.');
console.log('═'.repeat(78));

for (const shot of shots) {
  console.log('');
  console.log(`● ${shot.title}`);
  console.log(`  파일 이름 : ${shot.file}.jpg`);
  console.log(`  화면 비율 : ${shot.ratio}`);
  console.log('  프롬프트  :');
  console.log(`    ${shot.prompt} ${STYLE}`);
}

console.log('');
console.log('─'.repeat(78));
console.log(`총 ${shots.length}장. 저장 후 npm run build 하면 바로 반영됩니다.`);
console.log('⚠ 생성 이미지는 사료가 아니라 삽화입니다. 수업에서 그렇게 안내하세요.');
