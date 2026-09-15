import { useState } from 'react';

const GUIDES = [
  {
    key: 'kr-db',
    title: '한국사데이터베이스 · 우리역사넷',
    site: 'db.history.go.kr · contents.history.go.kr',
    what: '국사편찬위원회가 운영한다. 「사료로 본 한국사」에는 교과서에 나오는 사건의 원사료가 번역과 함께 실려 있어, 중학생이 원문에 처음 다가가기에 가장 알맞다.',
    tips: [
      '검색창에 사건 이름을 그대로 넣기보다, 사료에 나올 법한 말로 넣어 보자. 예: "임진왜란" 대신 "왜적", "수군".',
      '검색 결과에서 「사료로 본 한국사」를 먼저 보자. 원문과 번역, 해설이 함께 있다.',
      '자료마다 붙은 levelId가 그 자료의 고유 주소다. 출처를 적을 때는 그 주소를 그대로 복사한다.',
      '한 사건에 대해 사료가 여러 건 나오면, 서로 다른 시기·다른 편에서 쓴 것을 골라 함께 읽자. 그것이 교차검증이다.',
    ],
    caution:
      '번역문은 읽기 쉽게 다듬은 것이다. 결정적인 단어(예: "친제", "자유민")는 원문을 함께 확인하는 것이 좋다.',
  },
  {
    key: 'sillok',
    title: '조선왕조실록',
    site: 'sillok.history.go.kr',
    what: '조선 왕조가 당대에 기록한 관찬 사서를 원문과 번역으로 모두 볼 수 있다. 날짜 단위로 그날 무슨 일이 있었는지 찾아볼 수 있다.',
    tips: [
      '왕 이름 → 재위 연도 → 월 → 일 순서로 좁혀 들어가면 그날의 기사를 통째로 볼 수 있다.',
      '주소 끝의 기호(예: kda_12512030_002)가 기사 하나하나의 고유 번호다. 앞의 세 글자는 어느 왕의 실록인지를 가리킨다.',
      '검색은 번역문에도 걸린다. 한자를 몰라도 우리말로 찾을 수 있다.',
      '한 기사만 보지 말고 앞뒤 며칠을 함께 읽으면 맥락이 잡힌다.',
    ],
    caution:
      '실록은 왕조의 공식 기록이다. 왕과 조정의 관점이 중심에 놓이고, 기록되지 않은 사람들의 삶은 잘 드러나지 않는다는 점을 늘 염두에 두자.',
  },
  {
    key: 'loc',
    title: 'Library of Congress (미국 의회도서관)',
    site: 'loc.gov',
    what: '세계 최대 규모의 도서관 가운데 하나로, 사진·지도·신문·음원을 온라인으로 공개한다. 세계사 자료, 특히 사진과 지도를 찾을 때 유용하다.',
    tips: [
      '검색 뒤 왼쪽 필터에서 "Available Online"을 켜면 바로 볼 수 있는 자료만 남는다.',
      '자료마다 있는 loc.gov/item/숫자 형태의 주소가 고유 주소(permalink)다. 출처에는 이 주소를 적는다.',
      '이미지 자료는 "About this item"에 촬영 시기·촬영자·출처가 적혀 있다. 출처 기재에 필요한 정보가 다 여기 있다.',
      '영어가 부담되면 자료 제목만 번역기에 넣어 보자. 제목만 읽어도 무슨 자료인지 대개 알 수 있다.',
    ],
    caution:
      '미국 기관이 수집한 자료 모음이라, 무엇이 많이 남아 있고 무엇이 적은지에 치우침이 있다. "자료가 없다"가 "그런 일이 없었다"를 뜻하지 않는다.',
  },
  {
    key: 'world-src',
    title: 'Avalon Project · Fordham Sourcebooks · Project Gutenberg',
    site: 'avalon.law.yale.edu · sourcebooks.fordham.edu · gutenberg.org',
    what: '세계사 원사료를 무료로 공개하는 대학·비영리 프로젝트다. 조약문·연설문·법전(Avalon), 시대별 사료 모음(Fordham), 저작권이 풀린 책 전문(Gutenberg)을 볼 수 있다.',
    tips: [
      'Avalon은 주제별 메뉴(Medieval, 20th Century 등)를 따라 들어가면 찾기 쉽다.',
      'Fordham Sourcebooks는 시대별·주제별 목록 페이지에서 원하는 문서를 고른다.',
      'Gutenberg에서 책을 찾을 때는 저자 페이지(ebooks/author/번호)로 들어가면 그 사람의 저작이 한눈에 보인다.',
      '자료집에서 무엇이 실려 있고 무엇이 빠져 있는지도 살펴보자. 자료집 자체가 하나의 관점이다.',
    ],
    caution:
      '이들 사이트의 번역은 대부분 오래된 영어 번역이다. 결정적인 단어는 다른 번역과 견주어 보는 것이 좋다.',
  },
];

const TOOLS = [
  {
    title: '연표 활용법',
    body: [
      '연표는 외우는 표가 아니라 "이 일과 저 일 중 무엇이 먼저였나"를 확인하는 도구다.',
      '인용의 진위를 확인할 때 가장 먼저 쓰는 도구이기도 하다. 말한 사람이 그때 살아 있었는지, 그 자리에 있을 수 있었는지 연도만 맞춰 봐도 많은 것이 걸러진다.',
      '한 사건의 연표를 만들 때는 "자료가 만들어진 때"와 "사건이 일어난 때"를 다른 줄에 적어 보자. 둘 사이의 간격이 그 자료의 성격을 말해 준다.',
    ],
  },
  {
    title: '역사지도 활용법',
    body: [
      '지도는 "있는 그대로의 세계"가 아니라 "그때 그 사람들이 알고 있다고 믿은 세계"다.',
      '무엇이 그려졌는지만큼 무엇이 빠졌는지, 어디가 크게 그려졌는지, 중심에 무엇이 놓였는지를 보자.',
      '같은 지역을 그린 서로 다른 시기·다른 나라의 지도를 나란히 놓으면, 지도를 만든 쪽의 관심과 이해관계가 드러난다.',
    ],
  },
  {
    title: '사전·백과사전 활용법',
    body: [
      '사전은 출발점이지 근거가 아니다. 사전에서 사건의 얼개와 핵심 용어를 잡은 뒤, 사전이 인용한 원사료로 넘어가자.',
      '한국민족문화대백과사전처럼 집필자와 기관이 분명한 사전을 쓰고, 누구나 고칠 수 있는 사이트는 1차 근거로 쓰지 않는다.',
      '사전 항목 끝의 참고문헌 목록이 사실은 가장 값진 부분이다. 다음에 무엇을 읽어야 할지 알려 준다.',
    ],
  },
];

export default function ArchiveGuidePage() {
  const [openKey, setOpenKey] = useState(GUIDES[0].key);

  return (
    <div className="space-y-5">
      <header className="card-file">
        <h1 className="text-2xl font-bold">아카이브 사용법 가이드</h1>
        <p className="mt-2 leading-reading">
          검증은 자료를 찾는 데서 시작한다. 아래는 믿을 만한 자료가 모여 있는 곳과, 거기서
          원하는 것을 찾아내는 요령이다. 검색창에 무엇을 넣느냐가 실력의 절반이다.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          교육과정 근거: 성취기준 적용 시 고려 사항 (1) — 역사지도, 연표, 사전, 아카이브 등 도구
          활용법을 익히도록 지도한다.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xl font-bold">아카이브별 사용법</h2>
        <div className="space-y-2">
          {GUIDES.map((g) => {
            const open = openKey === g.key;
            return (
              <article key={g.key} className="card-file">
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : g.key)}
                  aria-expanded={open}
                  className="flex w-full items-baseline gap-2 text-left"
                >
                  <span className="text-lg font-bold">{g.title}</span>
                  <span className="ml-auto text-sm text-ink-soft">{open ? '접기 ▲' : '펼치기 ▼'}</span>
                </button>
                <p className="mt-1 break-all font-mono text-xs text-ink-soft">{g.site}</p>

                {open ? (
                  <div className="mt-3 space-y-3">
                    <p className="leading-reading">{g.what}</p>
                    <div>
                      <p className="text-sm font-bold">검색 요령</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-reading">
                        {g.tips.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="rounded-sm border border-alert/40 bg-alert/5 p-3 text-sm leading-reading">
                      <span className="font-bold">주의: </span>
                      {g.caution}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">연표 · 역사지도 · 사전 쓰는 법</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TOOLS.map((t) => (
            <article key={t.title} className="card-file">
              <h3 className="text-lg font-bold">{t.title}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-reading">
                {t.body.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card-file border-l-4 border-l-alert">
        <h2 className="text-xl font-bold">1차 근거로 쓰지 않는 것</h2>
        <p className="mt-2 leading-reading">
          개인 블로그, 누구나 고칠 수 있는 위키 형식 사이트, 커뮤니티 게시글, 언론사 칼럼은 근거로
          삼지 않는다. 사실이 아니어서가 아니라, <strong>누가 언제 무엇에 근거해 썼는지를 확인할
          수 없기 때문</strong>이다. 다만 &lsquo;신뢰도 낮은 자료가 어떻게 생겼는지&rsquo;를 살펴보는
          대조 자료로는 쓸 수 있다.
        </p>
        <p className="mt-2 leading-reading">
          이런 글에서 좋은 정보를 발견했다면, 그 글이 인용한 원자료를 찾아가 그것을 근거로 삼자.
          중간에 거쳐 온 글이 아니라 원자료를 인용하는 것이 원칙이다.
        </p>
      </section>
    </div>
  );
}
