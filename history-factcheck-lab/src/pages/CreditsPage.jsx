import { ALL_CASES } from '../lib/cases.js';

const ARCHIVES = [
  { name: '국사편찬위원회 한국사데이터베이스 · 우리역사넷', site: 'db.history.go.kr · contents.history.go.kr' },
  { name: '조선왕조실록', site: 'sillok.history.go.kr' },
  { name: '한국고전종합DB (한국고전번역원)', site: 'db.itkc.or.kr' },
  { name: '한국민족문화대백과사전 (한국학중앙연구원)', site: 'encykorea.aks.ac.kr' },
  { name: '국가기록원', site: 'archives.go.kr' },
  { name: '동북아역사재단 · 동북아역사넷', site: 'nahf.or.kr · contents.nahf.or.kr' },
  { name: '국가유산청 (현충사관리소)', site: 'khs.go.kr' },
  { name: 'Library of Congress', site: 'loc.gov' },
  { name: 'The Avalon Project, Yale Law School', site: 'avalon.law.yale.edu' },
  { name: 'Internet History Sourcebooks Project, Fordham University', site: 'sourcebooks.fordham.edu' },
  { name: 'Project Gutenberg', site: 'gutenberg.org' },
];

export default function CreditsPage() {
  const sources = ALL_CASES.flatMap((c) => c.sources);
  const real = sources.filter((s) => !s.synthetic);
  const synthetic = sources.filter((s) => s.synthetic);
  const verified = real.filter((s) => s.urlVerified);

  return (
    <div className="space-y-5">
      <header className="card-file">
        <h1 className="text-2xl font-bold">출처 고지 · 이용 안내</h1>
        <p className="mt-2 leading-reading">
          이 앱은 2022 개정 교육과정 중학교 「역사」 수업용으로 만들어진 비영리 교육 자료입니다.
          자료의 출처를 밝히는 법을 가르치는 앱이므로, 이 앱 자체도 출처를 밝힙니다.
        </p>
      </header>

      <section className="card-file">
        <h2 className="text-xl font-bold">사료의 출처</h2>
        <p className="mt-2 leading-reading">
          이 앱에 실린 사료는 아래 공공·학술 아카이브에서 가져왔습니다. 앱은 자료를 소장하거나
          소유하지 않으며, 각 자료의 권리는 해당 기관에 있습니다. 학습을 위해 인용문을 중학생이
          읽을 수 있게 다듬은 경우 원문을 함께 싣고, 요약한 경우에는 &lsquo;자료 내용 요약&rsquo;이라고
          표시했습니다.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {ARCHIVES.map((a) => (
            <li key={a.name}>
              <span className="font-bold">{a.name}</span>
              <span className="block break-all font-mono text-xs text-ink-soft">{a.site}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-reading text-ink-soft">
          각 자료를 실제로 이용·재배포하려면 해당 기관의 이용 조건을 따로 확인해 주세요. 기관마다
          조건이 다릅니다.
        </p>
      </section>

      <section className="card-file border-l-4 border-l-alert">
        <h2 className="text-xl font-bold">꼭 알아 두어야 할 두 가지</h2>

        <div className="mt-3">
          <h3 className="font-bold">1. 앱 속 &lsquo;AI 답변&rsquo;은 실제 AI의 답이 아닙니다</h3>
          <p className="mt-1 leading-reading">
            학습 루프 1단계에 나오는 답변은 실시간 생성 결과가 아니라, 교사가 검수할 수 있도록 미리
            작성해 둔 스크립트입니다. 검증 훈련이 성립하도록 <strong>오류를 의도적으로 심어 두었습니다</strong>.
            타이핑 효과는 화면 연출일 뿐이며, 몇 번을 눌러도 같은 답변이 나옵니다.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold">2. 일부 자료는 실재하지 않는 수업용 가상 예시입니다</h3>
          <p className="mt-1 leading-reading">
            각 케이스에는 &lsquo;신뢰도 낮은 자료를 알아보는&rsquo; 훈련을 위한 대조 자료가 한 건씩
            들어 있습니다. 이 자료들은 <strong>실재하는 게시글이나 사이트가 아니라</strong>, 인터넷에서
            흔히 보이는 서술 방식을 수업용으로 재구성한 것입니다. 실재하지 않는 글에 실재하는
            주소를 붙이지 않기 위해 이들 자료에는 URL을 두지 않았고, 화면에도 붉은 배지로
            표시했습니다. 현재 {synthetic.length}건이 여기에 해당합니다.
          </p>
        </div>
      </section>

      <section className="card-file">
        <h2 className="text-xl font-bold">링크 확인 상태</h2>
        <p className="mt-2 leading-reading">
          사료 링크는 전체 {real.length}건이며, 이 가운데 자동 점검으로 확인된 것은 현재{' '}
          <strong>{verified.length}건</strong>입니다.
        </p>
        {verified.length < real.length ? (
          <p className="mt-2 rounded-sm border border-alert/40 bg-alert/5 p-3 text-sm leading-reading">
            아직 확인되지 않은 링크가 있습니다. 링크가 끊어졌다는 뜻이 아니라, 자동 점검을 돌릴 수
            있는 네트워크 환경에서 아직 확인하지 못했다는 뜻입니다. 각 자료 카드에는{' '}
            <strong>&lsquo;링크 미확인&rsquo;</strong> 표시가 붙습니다. 수업 전에{' '}
            <code>npm run verify-links</code>를 한 번 돌려 확인해 주세요.
          </p>
        ) : null}
      </section>

      <section className="card-file">
        <h2 className="text-xl font-bold">개인정보</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 leading-reading">
          <li>로그인이 없습니다. 계정을 만들지 않습니다.</li>
          <li>
            학습 기록은 이 기기의 브라우저 저장소(localStorage)에만 저장되며, 어떤 서버로도 전송되지
            않습니다.
          </li>
          <li>이름 입력은 선택 사항이며, 리포트에 표시하는 용도로만 쓰입니다.</li>
          <li>외부 API를 호출하지 않고, 접속 기록을 수집하는 코드를 넣지 않았습니다.</li>
          <li>홈 화면의 &lsquo;모두 지우기&rsquo; 버튼으로 기기에 저장된 기록을 언제든 지울 수 있습니다.</li>
        </ul>
      </section>

      <section className="card-file">
        <h2 className="text-xl font-bold">이 앱의 이용</h2>
        <p className="mt-2 leading-reading">
          앱의 코드와 학습 설계는 학교 수업에서 자유롭게 쓰고 고쳐 쓸 수 있습니다. 다만 인용된
          사료의 권리는 각 소장 기관에 있으므로, 사료를 다른 곳에 옮겨 쓸 때는 해당 기관의 조건을
          따로 확인해 주세요.
        </p>
        <p className="mt-2 leading-reading">
          역사적 사실에 대한 오류를 발견하셨다면 알려 주세요. 이 앱에서 가장 심각한 오류는 코드의
          버그가 아니라 잘못된 역사 정보입니다.
        </p>
      </section>
    </div>
  );
}
