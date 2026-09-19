import { useState } from 'react';

/**
 * 첫 안내.
 *
 * 중학교 1학년이 처음 화면을 봤을 때 무엇을 눌러야 할지 모르면 거기서 끝난다.
 * 세 장으로 조작과 목표만 짧게 알려 주고 바로 게임으로 보낸다.
 */
const STEPS = [
  {
    icon: '🖱️',
    title: '바닥을 누르면 걸어갑니다',
    body: '화면의 땅을 누르면 내 캐릭터(금색 동그라미가 있는 사람)가 그곳까지 걸어갑니다. 마우스 휠을 굴리면 화면이 커지고 작아져요.',
  },
  {
    icon: '❗',
    title: '노란 느낌표가 있는 사람에게 가세요',
    body: '머리 위에 노란 느낌표가 떠 있는 사람이 오늘의 임무를 줍니다. 그 사람을 누르면 이야기가 시작돼요. 오른쪽 위 상황판에도 누구에게 가야 하는지 적혀 있습니다.',
  },
  {
    icon: '📜',
    title: '사료를 읽고 판단하세요',
    body: '임무는 「그때 무슨 일이 있었는지」를 묻습니다. 틀려도 괜찮아요. 답을 확인하면 진짜 역사 자료(사료)와 해설이 나오고, 다시 풀 수도 있습니다.',
  },
];

export function Tutorial({ onClose }: { onClose(): void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card frame">
        <div className="tutorial-icon" aria-hidden>
          {current.icon}
        </div>
        <div className="tutorial-step">
          {step + 1} / {STEPS.length}
        </div>
        <h2 className="tutorial-title">{current.title}</h2>
        <p className="tutorial-body">{current.body}</p>
        <div className="tutorial-dots" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.title} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <div className="dialogue-actions" style={{ justifyContent: 'center' }}>
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep((v) => v - 1)}>
              이전
            </button>
          )}
          <button className="btn primary" onClick={() => (last ? onClose() : setStep((v) => v + 1))}>
            {last ? '시작하기' : '다음'}
          </button>
          {!last && (
            <button className="btn ghost" onClick={onClose}>
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
