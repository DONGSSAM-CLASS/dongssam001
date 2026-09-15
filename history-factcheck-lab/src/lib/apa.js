/**
 * APA 7판 출처 기재 채점기.
 *
 * 채점 원칙 (100점 만점, 부분 점수제)
 *  - 저자·기관 20 / 연도 20 / 제목 20 / 사이트·DB명 20 / URL 20
 *  - 각 항목 안의 구두점(마침표·괄호) 오류는 5점 감점
 *  - "틀렸습니다"가 아니라 "무엇을 어떻게 고치면 되는지"를 돌려준다
 */

export const FIELD_ORDER = ['author', 'year', 'title', 'container', 'url'];

export const FIELD_META = {
  author: {
    label: '저자 또는 기관명',
    placeholder: '예: 국사편찬위원회.',
    help: '개인 저자가 없으면 만든 기관의 이름을 저자 자리에 쓴다. 뒤에 마침표를 찍는다.',
  },
  year: {
    label: '연도',
    placeholder: '예: (n.d.).',
    help: '괄호 안에 연도를 쓰고, 괄호 뒤에 마침표를 찍는다. 연도를 알 수 없으면 (n.d.)로 쓴다.',
  },
  title: {
    label: '자료 제목',
    placeholder: '예: 발해의 건국.',
    help: '자료 자체의 제목을 쓴다. 뒤에 마침표를 찍는다.',
  },
  container: {
    label: '사이트명 또는 데이터베이스명',
    placeholder: '예: 우리역사넷.',
    help: '그 자료가 실려 있는 사이트·DB의 이름이다. 뒤에 마침표를 찍는다.',
  },
  url: {
    label: 'URL',
    placeholder: '예: https://contents.history.go.kr/...',
    help: 'APA 7판에서는 URL 끝에 마침표를 찍지 않는다.',
  },
};

/** 표기 규칙 도움말 (한국어 자료) */
export const KOREAN_RULES = [
  '한국어 문헌의 저자는 이름을 그대로 쓰고 이니셜로 줄이지 않는다. (예: 홍길동 → 홍길동, 홍 G.가 아님)',
  '발행 연도를 알 수 없으면 (n.d.)로 쓴다. no date의 줄임말이다.',
  'URL 끝에는 마침표를 찍지 않는다. 마침표가 주소의 일부로 오해될 수 있기 때문이다.',
  '기관이 만든 자료는 기관명을 저자 자리에 쓴다.',
];

export const TEMPLATES = {
  webdoc: {
    label: '웹 문서 (개인 저자 없음)',
    pattern: '기관명. (연도 또는 n.d.). 문서 제목. 사이트명. URL',
  },
  archive: {
    label: '디지털 아카이브에 실린 사료',
    pattern: '기관명. (n.d.). 자료 제목 [자료 유형]. 데이터베이스명. URL',
  },
  article: {
    label: '학술 논문',
    pattern: '저자. (연도). 논문 제목. 학술지명, 권(호), 쪽수. DOI 또는 URL',
  },
  book: {
    label: '단행본',
    pattern: '저자. (연도). 『책 제목』. 출판사.',
  },
  news: {
    label: '신문 기사',
    pattern: '기자명. (연도, 월 일). 기사 제목. 신문사명. URL',
  },
  media: {
    label: '유물·사진 등 비문자 자료',
    pattern: '제작자(미상이면 Unknown). (연도). 자료 제목 [사진/유물/지도]. 소장기관. URL',
  },
};

/* ---------- 문자열 정규화 ---------- */

function normalizeContent(value) {
  return (value ?? '')
    .toString()
    .replace(/[.,()[\]『』「」<>《》]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

function similarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const longest = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / longest;
}

/* ---------- 항목별 채점 ---------- */

function gradeContent(fieldKey, input, expected) {
  const got = normalizeContent(input);
  const want = normalizeContent(expected);

  if (!got) {
    return { points: 0, state: 'empty', message: `${FIELD_META[fieldKey].label} 칸이 비어 있어요.` };
  }
  if (got === want) return { points: 20, state: 'exact', message: '정확합니다.' };

  if (fieldKey === 'url') {
    // URL은 오타 한 글자로도 못 쓰는 주소가 되므로 도메인 일치까지만 부분 점수를 준다.
    const gotHost = got.replace(/^https?:\/\//, '').split('/')[0];
    const wantHost = want.replace(/^https?:\/\//, '').split('/')[0];
    if (gotHost && gotHost === wantHost) {
      return {
        points: 10,
        state: 'partial',
        message: '사이트 주소는 맞았지만 뒷부분이 자료의 실제 주소와 다릅니다. 주소창의 주소를 그대로 복사해 보세요.',
      };
    }
    return {
      points: 0,
      state: 'wrong',
      message: '자료의 실제 주소와 다릅니다. 자료 카드에 적힌 주소를 그대로 옮겨 적어 보세요.',
    };
  }

  const ratio = similarity(got, want);
  if (ratio >= 0.85) {
    return {
      points: 16,
      state: 'close',
      message: '거의 맞았습니다. 글자 하나하나를 자료 카드와 대조해 보세요.',
    };
  }
  if (got.includes(want) || want.includes(got)) {
    return {
      points: 12,
      state: 'partial',
      message:
        got.length > want.length
          ? '필요한 내용에 다른 말이 덧붙어 있습니다. 이 칸에는 해당 항목만 적습니다.'
          : '내용이 일부만 적혀 있습니다. 자료 카드의 해당 항목을 끝까지 옮겨 적어 보세요.',
    };
  }
  if (ratio >= 0.5) {
    return { points: 8, state: 'partial', message: '비슷하지만 다릅니다. 자료 카드를 다시 확인해 보세요.' };
  }
  return { points: 0, state: 'wrong', message: '자료 카드의 해당 항목과 다릅니다.' };
}

function gradePunctuation(fieldKey, input) {
  const raw = (input ?? '').toString().trim();
  if (!raw) return { penalty: 0, message: null };

  if (fieldKey === 'year') {
    const hasParens = /\(.+\)/.test(raw);
    const endsWithPeriod = /\)\s*\.$/.test(raw);
    if (!hasParens) {
      return {
        penalty: 5,
        message: '연도 자리에 괄호가 빠졌어요. APA에서는 (2024)처럼 씁니다.',
        focus: 'parens',
      };
    }
    if (!endsWithPeriod) {
      return {
        penalty: 5,
        message: '괄호 뒤에 마침표가 필요해요. (n.d.). 처럼 닫는 괄호 다음에 마침표를 찍습니다.',
        focus: 'period',
      };
    }
    return { penalty: 0, message: null };
  }

  if (fieldKey === 'url') {
    if (/[.。]$/.test(raw)) {
      return {
        penalty: 5,
        message: 'URL 끝의 마침표를 지워 주세요. APA 7판에서는 주소 뒤에 마침표를 찍지 않습니다.',
        focus: 'period',
      };
    }
    if (!/^https?:\/\//i.test(raw)) {
      return {
        penalty: 5,
        message: '주소는 https:// 로 시작하게 적어 주세요.',
        focus: 'scheme',
      };
    }
    return { penalty: 0, message: null };
  }

  if (!/\.$/.test(raw)) {
    return {
      penalty: 5,
      message: `${FIELD_META[fieldKey].label} 뒤에 마침표가 필요해요. 항목과 항목 사이를 마침표로 끊어 줍니다.`,
      focus: 'period',
    };
  }
  if (/\.\.$/.test(raw)) {
    return { penalty: 5, message: '마침표가 두 번 찍혔어요.', focus: 'period' };
  }
  return { penalty: 0, message: null };
}

/**
 * 전체 채점.
 * @param {object} fields 학생 입력 { author, year, title, container, url }
 * @param {object} target 정답 components
 * @returns {{ total:number, perField:object, composed:string, allExact:boolean }}
 */
export function gradeCitation(fields, target) {
  const perField = {};
  let total = 0;

  FIELD_ORDER.forEach((key) => {
    const expected = key === 'year' ? target.year : target[key];
    const content = gradeContent(key, fields[key], expected);
    const punctuation = gradePunctuation(key, fields[key]);
    const points = Math.max(0, content.points - punctuation.penalty);
    total += points;
    perField[key] = {
      points,
      maxPoints: 20,
      content,
      punctuation,
      ok: content.state === 'exact' && punctuation.penalty === 0,
    };
  });

  return {
    total,
    perField,
    composed: composeFromFields(fields),
    allExact: FIELD_ORDER.every((k) => perField[k].ok),
  };
}

/** 학생이 적은 그대로를 이어 붙여 보여 준다(앱이 구두점을 대신 채워 주지 않는다). */
export function composeFromFields(fields) {
  return FIELD_ORDER.map((key) => (fields[key] ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/** 정답 예시 문자열을 항목 단위로 쪼개 보여 주기 위한 헬퍼 */
export function composeFromTarget(target) {
  const year = /^\(.*\)$/.test(target.year) ? target.year : `(${target.year})`;
  return [`${target.author}.`, `${year}.`, `${target.title}.`, `${target.container}.`, target.url]
    .filter(Boolean)
    .join(' ');
}
