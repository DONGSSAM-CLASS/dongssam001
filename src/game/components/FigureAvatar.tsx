import { figures } from '../figures';

/** 인물 초상 메달리온 (사진 대신 벡터, 인물별 상징색) */
export function FigureAvatar({ figureId, size = 48 }: { figureId: string; size?: number }) {
  const fig = figures[figureId];
  const accent = fig?.accent ?? '#c9a24b';
  const initial = fig?.name?.[0] ?? '?';
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full ring-2 ring-primary/40 shadow-inner"
      style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, ${accent}, #1a140b 130%)` }}
      aria-hidden="true"
    >
      <span className="font-bold text-base-100" style={{ fontSize: size * 0.42 }}>
        {initial}
      </span>
    </span>
  );
}
