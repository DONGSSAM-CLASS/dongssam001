import { useState } from 'react';

/**
 * 다음 이야기 — 2탄 『임시정부 : 새로운 나라를 향해』로 이어 주는 카드.
 *
 * 1탄의 스물세 임무를 모두 마치면 오른쪽 아래에 뜬다.
 * 1탄이 「광복을 향해 싸운 이야기」였다면 2탄은 「그 싸움 속에서 나라를 세우고 꾸린 이야기」다.
 * 2탄 주소는 배포할 때 VITE_SEQUEL_URL 로 넣는다. 없으면 선생님께 주소를 받도록 안내한다.
 */
const SEQUEL_URL = import.meta.env.VITE_SEQUEL_URL as string | undefined;

export function SequelCard() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button className="btn small primary sequel-reopen" onClick={() => setOpen(true)}>
        📘 다음 이야기
      </button>
    );
  }
  return (
    <div className="sequel-card frame" role="dialog" aria-label="다음 이야기">
      <div className="sequel-kicker">스물세 개의 기록을 모두 마쳤습니다 · 다음 이야기</div>
      <div className="sequel-title">제2탄 『임시정부 : 새로운 나라를 향해』</div>
      <p className="sequel-body">
        지금까지 광복을 향한 <strong>외교와 군사의 선택</strong>을 따라왔어요. 그런데 그분들은 싸우기만 한 게 아니었어요. 나라 이름을
        짓고, 헌법을 쓰고, 세금과 신문과 외교로 <strong>정부를 꾸렸지요.</strong> 2탄에서는 1인칭으로 임시의정원 회의실과 청사를 직접
        걸으며 새 나라가 세워지는 순간을 기록하고, 마지막에 그분들께 감사 편지를 씁니다.
      </p>
      <p className="sequel-body">
        2탄을 시작할 때 「<strong>1탄을 해 봤어요</strong>」를 고르면 1탄 기억 퀴즈로 이어 갈 수 있어요.
      </p>
      <div className="dialogue-actions">
        {SEQUEL_URL ? (
          <a className="btn primary" href={SEQUEL_URL} target="_blank" rel="noopener noreferrer">
            📘 2탄 시작하기
          </a>
        ) : (
          <span className="tag">2탄 주소는 선생님께 받아 주세요</span>
        )}
        <button className="btn ghost" onClick={() => setOpen(false)}>
          접기
        </button>
      </div>
    </div>
  );
}
