import { useMemo, useState } from 'react';
import type { Level, Letter } from '../types';
import { figures } from '../data/figures';
import { getHonoree } from '../data/honorees';
import { portraitDataUrl } from './portrait';
import { GlossaryText } from './GlossaryText';
import { LETTER_MAX, LETTER_MIN, POINTS, canDonate, letterChecks, letterLength, letterProblem } from '../engine/rules';

/**
 * 공훈 명패 — 보훈의 전당에서 명패 앞에 서면 열린다.
 *
 * 1) 이분이 누구이고 임시정부에서 무엇을 했는지 다시 읽는다.
 * 2) 모은 보훈 포인트를 (게임 속에서) 기부하면 명패 앞에 국화가 놓인다.
 * 3) 감사 편지를 쓴다 — 중1이 빈 칸 앞에서 막히지 않도록 「글머리」와 「떠올릴 거리」를 준다.
 *
 * ⚠ 기부는 게임 속 활동이다. 실제 결제·송금은 없다. 화면에 늘 밝힌다.
 */

const STARTERS_UNNAMED = [
  '이름을 남기지 못한 분들께, 저는 2026년의 대한민국에 사는 학생입니다.',
  '기록 조각을 주우며 알게 된 것은',
  '여러분의 이름은 모르지만',
  '오늘 우리가 누리는 것은',
  '저도 앞으로',
  '잊지 않겠습니다.',
];

const STARTERS = [
  '선생님, 저는 2026년의 대한민국에 사는 학생입니다.',
  '게임에서 선생님을 만났을 때 가장 기억에 남은 것은',
  '선생님 덕분에 오늘 우리가 누리는 것은',
  '제가 오늘 새로 알게 된 것은',
  '저도 앞으로',
  '감사합니다. 잊지 않겠습니다.',
];

export function HonorPanel({
  figureId,
  level,
  points,
  donated,
  letter,
  nickname,
  locked,
  onDonate,
  onWrite,
  onClose,
}: {
  figureId: string;
  level: Level;
  points: number;
  donated: number;
  letter: Letter | undefined;
  nickname: string;
  /** 아직 여행을 마치지 않았으면 기부·편지를 잠근다 */
  locked: boolean;
  onDonate(amount: number): boolean;
  onWrite(body: string): void;
  onClose(): void;
}) {
  const figure = figures[figureId];
  const honoree = getHonoree(figureId);
  const [tab, setTab] = useState<'about' | 'donate' | 'letter'>(locked ? 'about' : 'donate');
  const [amount, setAmount] = useState(Math.min(points - (points % POINTS.donationStep), 200));
  const [draft, setDraft] = useState(letter?.body ?? '');
  const [saved, setSaved] = useState(false);
  const problem = useMemo(() => letterProblem(draft), [draft]);
  const checks = useMemo(() => letterChecks(draft, honoree?.keywords ?? []), [draft, honoree]);

  if (!figure || !honoree) return null;
  const unnamed = figureId === 'unnamed';
  const addressee = unnamed ? figure.name : `${figure.name} 선생님`;

  const step = POINTS.donationStep;
  const maxGive = points - (points % step);

  return (
    <div className="quest-overlay" role="dialog" aria-label={`${figure.name} 공훈 명패`}>
      <div className="quest-sheet honor-sheet">
        <div className="honor-head">
          <img className="honor-portrait" src={portraitDataUrl(figure)} alt={`${figure.name} 초상 (양식화한 그림)`} />
          <div style={{ flex: 1 }}>
            <div className="quest-meta">
              <span className="tag">{figureId === 'unnamed' ? '무명의 협력자' : '독립유공자'}</span>
              <span>{figure.life}</span>
            </div>
            <h2 className="quest-title" style={{ marginBottom: 0 }}>
              {figure.name}
              {figure.hanja ? <span className="honor-hanja"> {figure.hanja}</span> : null}
            </h2>
            {figureId !== 'unnamed' && <div className="dialogue-role">{figure.role}</div>}
            <div className="honor-headline">{honoree.headline}</div>
          </div>
          {donated > 0 && (
            <div className="honor-badge" title="이분께 기부한 보훈 포인트">
              🌼 {donated.toLocaleString('ko-KR')}
            </div>
          )}
        </div>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'about'} onClick={() => setTab('about')}>
            이분은
          </button>
          <button role="tab" aria-selected={tab === 'donate'} disabled={locked} onClick={() => setTab('donate')}>
            🌼 기부하기
          </button>
          <button role="tab" aria-selected={tab === 'letter'} disabled={locked} onClick={() => setTab('letter')}>
            ✉️ 감사 편지 {letter ? '✓' : ''}
          </button>
        </div>

        {locked && (
          <div className="caveat" style={{ marginTop: 10 }}>
            여행을 모두 마치면 기부와 편지를 드릴 수 있어요. 지금은 이분이 누구인지 먼저 알아 두세요.
          </div>
        )}

        {tab === 'about' && (
          <div className="honor-body">
            <p className="honor-memory">
              <strong>게임에서 만난 장면 · </strong>
              {honoree.memory[level]}
            </p>
            <p>
              <GlossaryText>{figure.bio[level]}</GlossaryText>
            </p>
            <div className="source-cite">근거 · {honoree.sourceNote}</div>
            {unnamed ? (
              <div className="honor-activity">
                <strong>🕯️ 이름을 남기지 못한 분들</strong>
                <p>
                  보훈은 이름이 알려진 분들만을 위한 것이 아니에요. 지금도 국가보훈부는 기록 속에 묻힌 독립운동가를 찾아 서훈하고 있어요.
                  우리 동네, 우리 집안에도 그런 분이 계셨는지 어른들께 여쭈어 보세요.
                </p>
              </div>
            ) : (
              <div className="honor-activity">
                <strong>🔎 스스로 찾아보기</strong>
                <p>
                  국가보훈부 <a href="https://e-gonghun.mpva.go.kr" target="_blank" rel="noopener noreferrer">공훈전자사료관</a>
                  에서 「{figure.name}」을 검색해 보세요. 이분이 어떤 공적으로 어떤 훈장을 받았는지, 공적조서를 직접 읽을 수 있어요.
                  (이 게임은 훈격을 적지 않았습니다 — 여러분이 찾아 편지에 써 보세요.)
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'donate' && !locked && (
          <div className="honor-body">
            <p>
              여행하며 모은 <strong>보훈 포인트</strong>를 {addressee}께 드립니다. 기부하면 명패 앞에 흰 국화가 놓여요.
            </p>
            <div className="donate-box">
              <div className="donate-have">
                남은 포인트 <strong>{points.toLocaleString('ko-KR')}</strong>
              </div>
              <div className="donate-stepper">
                <button className="btn small" disabled={amount <= step} onClick={() => setAmount((v) => Math.max(step, v - step))}>
                  −{step}
                </button>
                <div className="donate-amount" aria-live="polite">
                  {amount.toLocaleString('ko-KR')}
                </div>
                <button className="btn small" disabled={amount + step > maxGive} onClick={() => setAmount((v) => Math.min(maxGive, v + step))}>
                  +{step}
                </button>
                <button className="btn small ghost" disabled={maxGive <= 0} onClick={() => setAmount(maxGive)}>
                  모두
                </button>
              </div>
              <button
                className="btn primary"
                disabled={!canDonate(points, amount)}
                onClick={() => {
                  if (onDonate(amount)) setAmount(Math.min(points - amount - ((points - amount) % step), amount));
                }}
              >
                🌼 {amount.toLocaleString('ko-KR')} 포인트 기부하고 국화 올리기
              </button>
              {points < step && <div className="list-sub">남은 포인트가 없어요. 다른 분께 드린 마음도 모두 소중해요.</div>}
            </div>
            <p className="honor-notice">
              ⓘ 게임 속 포인트는 <strong>실제 돈이 아닙니다.</strong> 기부는 「고마운 마음을 표현하는 연습」이에요. 실제로 마음을 전하는 방법은
              여행을 마친 뒤 감사 증서 화면에서 안내해요.
            </p>
          </div>
        )}

        {tab === 'letter' && !locked && (
          <div className="honor-body">
            <div className="letter-hints">
              <strong>떠올릴 거리</strong>
              <ul>
                {honoree.letterHints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <strong>글머리 (누르면 편지에 붙어요)</strong>
              <div className="starter-row">
                {(unnamed ? STARTERS_UNNAMED : STARTERS).map((s) => (
                  <button
                    key={s}
                    className="starter"
                    onClick={() => {
                      setDraft((d) => (d.trim() ? `${d.trimEnd()}\n${s} ` : `${s} `));
                      setSaved(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <label className="letter-label" htmlFor="letter-body">
              {addressee}께
            </label>
            <textarea
              id="letter-body"
              className="letter-area"
              value={draft}
              maxLength={LETTER_MAX}
              placeholder={`${addressee}께 드리는 편지를 써 보세요. (공백 빼고 ${LETTER_MIN}자 이상)`}
              onChange={(e) => {
                setDraft(e.target.value);
                setSaved(false);
              }}
            />
            <div className="letter-foot">
              <span className={problem ? 'letter-count warn' : 'letter-count ok'}>
                {problem ?? `좋아요! (${letterLength(draft)}자)`}
              </span>
              <span className="letter-sign">— {nickname ? `견습 기록관 ${nickname}` : '견습 기록관'} 올림</span>
            </div>
            <div className="letter-checks" aria-label="편지 점검표">
              <span className="letter-checks-title">편지 점검표 (채점이 아니에요)</span>
              <span data-ok={checks.thanks}>{checks.thanks ? '✓' : '○'} 고마운 마음을 표현했나요?</span>
              <span data-ok={checks.fact}>{checks.fact ? '✓' : '○'} 이분이 하신 일을 구체적으로 적었나요? (떠올릴 거리 참고)</span>
              <span data-ok={checks.pledge}>{checks.pledge ? '✓' : '○'} 오늘의 나와 이어지는 다짐이 있나요?</span>
            </div>
            <div className="dialogue-actions">
              <button
                className="btn primary"
                disabled={Boolean(problem)}
                onClick={() => {
                  onWrite(draft);
                  setSaved(true);
                }}
              >
                ✉️ 편지를 명패 앞에 올리기
              </button>
              {saved && <span className="tag ok-tag">명패 앞에 편지를 올렸어요</span>}
            </div>
            <p className="honor-notice">ⓘ 편지는 이 기기 안에만 저장돼요. 감사 증서 화면에서 인쇄할 수 있어요.</p>
          </div>
        )}

        <div className="dialogue-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" onClick={onClose}>
            명패 앞에서 물러나기
          </button>
        </div>
      </div>
    </div>
  );
}
