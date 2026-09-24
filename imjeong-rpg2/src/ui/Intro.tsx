import { useState } from 'react';
import type { Level } from '../types';
import { CinematicImage } from './CinematicImage';
import { PREQUEL_TITLE, PREQUEL_URL } from '../data/prequel';

/** 시작 화면 — 1탄과 같은 모양. 난이도와 (선택) 부름말을 정하고 들어간다. */
export function Intro({
  hasSave,
  onStart,
  onContinue,
  onRestore,
}: {
  hasSave: boolean;
  onStart(level: Level, nickname: string, prequelPlayed: 'yes' | 'no' | null): void;
  onContinue(): void;
  onRestore(code: string, nickname: string): boolean;
}) {
  const [level, setLevel] = useState<Level>('middle');
  const [nickname, setNickname] = useState('');
  const [played, setPlayed] = useState<'yes' | 'no' | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  return (
    <div className="intro">
      <div className="intro-card">
        <div className="intro-kicker">대한민국 임시정부 1919 — 1948 · 제2탄</div>
        <h1 className="intro-title">
          임시정부 <span className="intro-colon">:</span> 새로운 나라를 향해
        </h1>
        <p className="intro-sub">나라 이름부터 헌법까지 — 내 눈으로 걸어 보는 새 나라의 탄생</p>

        {/* public/assets/higgsfield/cover.jpg 를 넣으면 표지 그림이 뜬다 (없어도 괜찮다) */}
        <CinematicImage name="cover" alt="표지 삽화" className="intro-cover" />

        <p className="intro-lead">
          1탄에서 우리는 <strong>광복을 향한 독립운동의 길</strong>을 걸었어요. 2탄에서는 그 사람들이
          <strong> 어떤 나라를 세우려 했는지</strong>, 그리고 그 나라를 어떻게 꾸려 갔는지 따라갑니다.
          <br />
          <br />
          보훈의 전당에서 낡은 기록 수첩을 펼친 순간, 여러분은 1919년 상하이의 <strong>견습 기록관</strong>이 됩니다.
          <strong> 1인칭 3D</strong>로 임시의정원 회의실과 청사 복도를 직접 걸으며 나라 이름·헌법·삼권분립·재정·외교·개헌·건국강령이
          정해지는 순간을 기록하세요. 모은 <strong style={{ color: '#ffd24a' }}>보훈 포인트</strong>로 마지막에 임시정부를 지킨 국가유공자께
          기부하고 감사 편지를 씁니다.
        </p>

        <div className="level-picker">
          <button className="level-card" aria-pressed={level === 'middle'} onClick={() => setLevel('middle')}>
            <h3>중학생용 · 기본</h3>
            <p>쉬운 말로 풀어 설명하고, 어려운 낱말에는 점선 밑줄이 붙어 누르면 뜻이 나옵니다.</p>
          </button>
          <button className="level-card" aria-pressed={level === 'high'} onClick={() => setLevel('high')}>
            <h3>고등학생용 · 심화</h3>
            <p>같은 사건과 사료를 헌법 조문과 쟁점 중심으로 더 깊이 다룹니다.</p>
          </button>
        </div>

        <div className="prequel-pick">
          <span>
            1탄 『
            <a href={PREQUEL_URL} target="_blank" rel="noopener noreferrer">
              {PREQUEL_TITLE}
            </a>
            』을 해 보았나요?
          </span>
          <div className="prequel-buttons">
            <button className="level-card small" aria-pressed={played === 'yes'} onClick={() => setPlayed('yes')}>
              🙋 해 봤어요 — 기억 퀴즈로 이어 갈래요
            </button>
            <button className="level-card small" aria-pressed={played === 'no'} onClick={() => setPlayed('no')}>
              🌱 처음이에요 — 1탄 줄거리부터 볼래요
            </button>
          </div>
        </div>

        <label className="nickname-field">
          <span>편지 끝에 적을 부름말 (선택 · 12자 이내)</span>
          <input
            value={nickname}
            maxLength={12}
            placeholder="예: 3반 별빛"
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="off"
          />
          <em>실명은 쓰지 마세요. 이 기기 안에만 저장되고 어디에도 보내지 않습니다.</em>
        </label>

        <div className="dialogue-actions" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => onStart(level, nickname, played)}>
            새로 시작
          </button>
          {hasSave && (
            <button className="btn" onClick={onContinue}>
              이어서 하기
            </button>
          )}
        </div>

        <details className="code-restore">
          <summary>🔑 진행 코드로 이어하기 (다른 컴퓨터에서 하던 것)</summary>
          <div className="code-restore-row">
            <input
              value={code}
              placeholder="예: 1A2B-3C4D-…"
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError(false);
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className="btn"
              disabled={code.replace(/[^0-9A-Za-z]/g, '').length < 6}
              onClick={() => {
                if (!onRestore(code, nickname)) setCodeError(true);
              }}
            >
              이어하기
            </button>
          </div>
          {codeError && <em className="code-error">코드가 맞지 않아요. 한 글자씩 다시 확인해 주세요.</em>}
        </details>

        <div className="intro-notice">
          <strong>역사 자료 안내</strong>
          <br />
          연대·인물·사건·사료는 국사편찬위원회 『대한민국임시정부자료집』, 국가보훈부 공훈전자사료관, 국가법령정보센터 등에 실린
          내용을 근거로 했습니다. 일자·표현에 이설이 있는 항목은 「확인할 점」으로 함께 표시합니다. 플레이어와 해설사는 가상 인물이고,
          청사의 방 배치는 학습용 재구성입니다. 인물의 얼굴은 재현하지 않고 사진으로 확인되는 차림새만 옮겼습니다.
          <br />
          <br />
          <strong>보훈 포인트는 게임 속 점수이며 실제 돈이 아닙니다.</strong> 이름·이메일 등 개인정보를 받지 않습니다.
        </div>

        <div className="intro-credit">만든이 · 동쌤(김동은 선생님) · 1탄 『임시정부 1919-1945』에 이어</div>
      </div>
    </div>
  );
}
