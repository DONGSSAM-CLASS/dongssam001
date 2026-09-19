import { useState } from 'react';
import type { Level } from '../types';
import { CinematicImage } from './CinematicImage';

/** 시작 화면 — 난이도를 고르고 게임에 들어간다. */
export function Intro({
  hasSave,
  onStart,
  onContinue,
}: {
  hasSave: boolean;
  onStart(level: Level): void;
  onContinue(): void;
}) {
  const [level, setLevel] = useState<Level>('middle');
  return (
    <div className="intro">
      <div className="intro-card">
        <div className="intro-kicker">대한민국 임시정부 1919 — 1945</div>
        <h1 className="intro-title">임시정부, 스물일곱 해</h1>
        <p className="intro-sub">외교와 군사 — 나라 없는 정부가 내린 선택들</p>

        {/* public/assets/higgsfield/cover.jpg 를 넣으면 표지 그림이 뜬다 (없어도 괜찮다) */}
        <CinematicImage name="cover" alt="임시정부 표지 그림" className="intro-cover" />

        <p className="intro-lead">
          당신은 상하이 프랑스 조계의 임시정부 청사에 갓 들어온 <strong>서기</strong>입니다.
          회의록을 적고, 사람을 만나고, 문서를 나릅니다. 1919년 4월부터 1945년 광복까지
          임시정부가 실제로 마주한 선택 앞에 스물세 번 서게 됩니다.
          <br />
          <br />
          바닥을 누르면 걸어가고, 머리 위에 <strong style={{ color: '#ffd24a' }}>노란 느낌표</strong>가
          뜬 사람에게 말을 걸면 임무가 시작됩니다. 정답은 모두 <strong>진짜 역사 자료</strong> 안에 있어요.
        </p>

        <div className="level-picker">
          <button
            className="level-card"
            aria-pressed={level === 'middle'}
            onClick={() => setLevel('middle')}
          >
            <h3>중학생용 · 기본</h3>
            <p>
              쉬운 말로 풀어 설명하고, 어려운 낱말에는 점선 밑줄이 붙어 누르면 뜻이 나옵니다.
              처음이라면 이쪽을 고르세요.
            </p>
          </button>
          <button
            className="level-card"
            aria-pressed={level === 'high'}
            onClick={() => setLevel('high')}
          >
            <h3>고등학생용 · 심화</h3>
            <p>사건의 배경과 쟁점을 더 깊이 다룹니다. 다루는 사건과 사료는 같고, 설명의 깊이만 다릅니다.</p>
          </button>
        </div>

        <div className="dialogue-actions" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => onStart(level)}>
            새로 시작
          </button>
          {hasSave && (
            <button className="btn" onClick={onContinue}>
              이어서 하기
            </button>
          )}
        </div>

        <div className="intro-notice">
          <strong>역사 자료 안내</strong>
          <br />
          연대·인물·사건·사료는 국사편찬위원회 『대한민국임시정부자료집』, 국가보훈부 공훈전자사료관,
          우리역사넷 등에 실린 내용을 근거로 했습니다. 판본이나 일자에 이설이 있는 항목은 화면에
          「확인할 점」으로 함께 표시합니다. 플레이어인 서기는 가상 인물이고, 지도와 건물 배치는
          학습용 재구성입니다. 수업에서 사료 원문을 그대로 인용할 때는 각 카드의 출처에서
          판본·표기를 최종 확인해 주세요.
        </div>

        <div className="intro-credit">만든이 · 동쌤(김동은 선생님)</div>
      </div>
    </div>
  );
}
