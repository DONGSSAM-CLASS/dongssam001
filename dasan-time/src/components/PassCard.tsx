import { forwardRef } from 'react';
import { House, IdCard, PenLine, Clock, Sparkles } from 'lucide-react';
import { PASS_COLORS, type PassColorId } from '../content/lessons';
import type { ClassDoc, PassCardData } from '../lib/types';

function colorOf(id: PassColorId) {
  return PASS_COLORS.find((c) => c.id === id) ?? PASS_COLORS[0];
}

/**
 * 나만의 다산초당 출입증 카드.
 * PNG 저장·PDF 캡처에 그대로 쓰이므로 daisyUI 색 변수 대신 고정 색을 쓴다.
 * (캡처 라이브러리가 oklch 변수를 계산하지 못하는 경우를 피하기 위해서다.)
 */
const PassCard = forwardRef<
  HTMLDivElement,
  { card: PassCardData; ownerLabel: string; commonTime?: ClassDoc['commonTime'] }
>(function PassCard({ card, ownerLabel, commonTime }, ref) {
  const c = colorOf(card.color);

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-md rounded-2xl border-4 p-5"
      style={{ background: c.bg, borderColor: c.border, color: c.ink }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold tracking-wide">
          <IdCard className="h-5 w-5" aria-hidden />
          나만의 다산초당 출입증
        </p>
        <span className="text-2xl" aria-hidden>
          {card.sticker}
        </span>
      </div>

      <p className="mt-1 text-xs opacity-70">{ownerLabel}</p>

      <div className="mt-4 space-y-3 text-sm">
        <Row icon={<House className="h-4 w-4" aria-hidden />} label="유배 보낼 앱" value={card.app} />
        <Row icon={<Clock className="h-4 w-4" aria-hidden />} label="운영 시간" value={card.time} />
        <Row icon={<PenLine className="h-4 w-4" aria-hidden />} label="대안 활동" value={card.alt} />
      </div>

      <div
        className="mt-4 rounded-2xl p-3 text-center"
        style={{ background: 'rgba(255,255,255,0.65)' }}
      >
        <p className="flex items-center justify-center gap-1 text-xs font-bold opacity-70">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          나의 주도성 다짐
        </p>
        <p className="mt-1 text-base font-bold leading-snug">
          {card.pledge || '다짐을 적어 볼까요?'}
        </p>
      </div>

      {card.revised && (
        <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-xs">
          <span className="font-bold">수정됨 · </span>
          {card.revisedNote || '4주 실천 중에 규칙을 바꿨어요.'}
        </p>
      )}

      {commonTime && (
        <p className="mt-3 text-center text-xs font-semibold">
          우리 반 함께하는 시간: {commonTime.start}~{commonTime.end}, 이 시간엔 서로 알림 보내지
          않기!
        </p>
      )}
    </div>
  );
});

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="w-24 shrink-0 font-bold opacity-75">{label}</span>
      <span className="grow break-words">{value || '—'}</span>
    </div>
  );
}

export default PassCard;
