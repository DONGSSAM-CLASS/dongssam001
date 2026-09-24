import type { Letter } from '../types';
import { figures } from '../data/figures';
import { quests } from '../data/quests';
import { relics } from '../data/relics';
import { blueprint } from '../data/blueprint';
import { totalDonated } from '../engine/rules';
import { portraitDataUrl } from './portrait';
import { CinematicImage } from './CinematicImage';

/**
 * 감사 증서 — 여행의 끝.
 *
 * 학생이 무엇을 배웠고(설계도·기록), 누구에게 어떤 마음을 전했는지(기부·편지)를 한 장으로 모은다.
 * 「인쇄하기」를 누르면 이 증서만 종이에 찍힌다 (교실 게시·포트폴리오용).
 * 마지막에는 게임 밖에서 실제로 보훈을 실천할 수 있는 방법을 안내한다.
 */
export function Ending({
  nickname,
  completed,
  missed,
  relicIds,
  pointsEarned,
  donations,
  letters,
  onBack,
  onRestart,
}: {
  nickname: string;
  completed: Record<string, boolean>;
  missed: string[];
  relicIds: string[];
  pointsEarned: number;
  donations: Record<string, number>;
  letters: Letter[];
  onBack(): void;
  onRestart(): void;
}) {
  const solved = quests.filter((q) => completed[q.id]).length;
  const firstTry = quests.filter((q) => completed[q.id] && !missed.includes(q.id)).length;
  const pillars = new Set(quests.filter((q) => completed[q.id]).map((q) => q.blueprint)).size;
  const donated = totalDonated(donations);
  const today = new Date();
  const dateText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const who = nickname ? `견습 기록관 ${nickname}` : '견습 기록관';
  const donatedList = Object.entries(donations).filter(([, v]) => v > 0);

  return (
    <div className="ending">
      <div className="ending-inner">
        <div className="certificate" id="certificate">
          <div className="cert-border">
            <div className="cert-kicker">임시정부 : 새로운 나라를 향해</div>
            <h1 className="cert-title">감사 증서</h1>
            <p className="cert-lead">
              <strong>{who}</strong>은(는) 1919년 상하이 김신부로의 임시의정원에서 1948년 서울 경교장까지, 대한민국 임시정부가 새
              나라를 세우고 꾸려 간 길을 함께 걸으며 {solved}개의 기록을 남겼습니다. 그리고 그 길을 목숨 걸고 지킨 분들께 고마운
              마음을 전했기에 이 증서를 드립니다.
            </p>
            <div className="cert-stats">
              <div>
                <span>남긴 기록</span>
                <strong>
                  {solved} / {quests.length}
                </strong>
                <em>한 번에 맞힘 {firstTry}</em>
              </div>
              <div>
                <span>새 나라 설계도</span>
                <strong>
                  {pillars} / {blueprint.length}
                </strong>
                <em>세운 기둥</em>
              </div>
              <div>
                <span>기록 조각</span>
                <strong>
                  {relicIds.length} / {relics.length}
                </strong>
                <em>찾은 사료</em>
              </div>
              <div>
                <span>보훈 포인트</span>
                <strong>{pointsEarned.toLocaleString('ko-KR')}</strong>
                <em>그중 기부 {donated.toLocaleString('ko-KR')}</em>
              </div>
            </div>

            {donatedList.length > 0 && (
              <div className="cert-section">
                <h3>🌼 국화를 올린 분들</h3>
                <div className="cert-flowers">
                  {donatedList.map(([id, v]) => (
                    <div className="cert-flower" key={id}>
                      <img src={portraitDataUrl(figures[id])} alt="" />
                      <span>{figures[id]?.name}</span>
                      <em>{v.toLocaleString('ko-KR')}</em>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {letters.length > 0 && (
              <div className="cert-section">
                <h3>✉️ 올린 편지</h3>
                {letters.map((l) => (
                  <div className="cert-letter" key={l.figureId}>
                    <div className="cert-letter-to">{figures[l.figureId]?.name} 선생님께</div>
                    <p>{l.body}</p>
                    <div className="cert-letter-from">— {who} 올림</div>
                  </div>
                ))}
              </div>
            )}

            <div className="cert-foot">
              <span>{dateText}</span>
              <span>보훈의 전당</span>
            </div>
            <p className="cert-notice">
              ※ 게임 속 보훈 포인트와 기부는 실제 돈이 아닙니다. 등장하는 청사·방 배치는 학습용 재구성이며, 사료와 출처는 게임 안
              「사료로 확인」 화면에 밝혀 두었습니다.
            </p>
          </div>
        </div>

        <CinematicImage name="ending" alt="엔딩 삽화" className="ending-cinematic" caption="삽화 — 사료가 아닙니다" />

        <div className="ending-actions frame">
          <h3>게임 밖에서, 진짜 보훈을 실천하는 방법</h3>
          <ul>
            <li>
              <strong>공적조서 읽기</strong> — 국가보훈부{' '}
              <a href="https://e-gonghun.mpva.go.kr" target="_blank" rel="noopener noreferrer">
                공훈전자사료관
              </a>
              에서 편지를 쓴 분의 공적을 찾아 읽고, 편지에 훈장 이름을 더해 보세요.
            </li>
            <li>
              <strong>묘역·현충 시설 참배</strong> — 서울 효창공원에는 김구 선생의 묘와 이동녕·차리석 등 임시정부 요인의 묘역이 있어요.
              가까운 현충 시설은 국가보훈부 누리집에서 찾을 수 있어요.
            </li>
            <li>
              <strong>기념관 방문</strong> — 서울 서대문구의 국립대한민국임시정부기념관, 천안의 독립기념관, 서울 종로구의 경교장.
            </li>
            <li>
              <strong>편지 전하기</strong> — 인쇄한 편지를 학급에서 모아 기념관·현충 시설을 찾을 때 함께 전해 보세요. (선생님과 함께
              계획해요)
            </li>
            <li>
              <strong>진짜 기부</strong>를 하고 싶다면 반드시 보호자·선생님과 상의하고, 국가보훈부 등 공식 기관의 안내를 확인하세요.
            </li>
          </ul>
          <div className="dialogue-actions">
            <button className="btn primary" onClick={() => window.print()}>
              🖨️ 증서와 편지 인쇄하기
            </button>
            <button className="btn" onClick={onBack}>
              보훈의 전당으로 돌아가기
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                if (window.confirm('처음부터 다시 여행할까요? 지금까지의 기록과 편지가 모두 지워집니다. (먼저 인쇄해 두세요)')) onRestart();
              }}
            >
              처음부터 다시
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
