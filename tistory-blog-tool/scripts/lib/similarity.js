// 유사문서 감지 — 글자 n-gram(shingle) 자카드 유사도.
// 같은 템플릿에 지역명·숫자만 바꾼 "찍어낸 글"(구글 scaled content abuse / 애드센스 replicated content)을 잡는 게 목적.

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[0-9]+/g, '0') // 숫자만 바꾼 복제도 잡기
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function shingles(text, n = 5) {
  const s = normalize(text);
  const set = new Set();
  for (let i = 0; i + n <= s.length; i++) set.add(s.slice(i, i + n));
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const x of small) if (big.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// 제목 유사도 (짧은 텍스트라 2-gram)
function titleSimilarity(a, b) {
  return jaccard(shingles(a, 2), shingles(b, 2));
}

module.exports = { shingles, jaccard, titleSimilarity, normalize };
