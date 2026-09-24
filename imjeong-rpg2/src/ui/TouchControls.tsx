import { useEffect, useRef, useState } from 'react';

/**
 * 태블릿용 조이스틱 — 화면 왼쪽 아래 동그라미를 밀면 그 방향으로 걷는다.
 * 학교에는 마우스 없는 태블릿이 많다. 터치 기기에서만 보인다.
 */
export function TouchControls({ onMove }: { onMove(x: number, z: number): void }) {
  const [touch, setTouch] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    setTouch(coarse || 'ontouchstart' in window);
  }, []);

  if (!touch) return null;

  const update = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const r = rect.width / 2;
    let dx = clientX - (rect.left + r);
    let dy = clientY - (rect.top + r);
    const len = Math.hypot(dx, dy);
    if (len > r) {
      dx = (dx / len) * r;
      dy = (dy / len) * r;
    }
    setKnob({ x: dx, y: dy });
    onMove(dx / r, -dy / r);
  };

  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      className="joystick"
      ref={baseRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        active.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="걷기 조이스틱"
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
