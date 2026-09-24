import { useSettings } from '../store/settings';

/**
 * 효과음 — 파일 없이 Web Audio 로 짧게 만든다. (외부 에셋을 쓰지 않는 1탄 원칙)
 * 맞혔을 때·기록 조각·국화·시간의 문에서 짧은 소리로 「해냈다」는 느낌을 준다.
 * 설정에서 끌 수 있다.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!useSettings.getState().sound) return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  /** 맞힘 — 올라가는 세 음 */
  correct() {
    tone(523, 0, 0.18);
    tone(659, 0.1, 0.18);
    tone(784, 0.2, 0.35);
  },
  /** 틀림 — 낮고 부드럽게 (겁주지 않는다) */
  wrong() {
    tone(330, 0, 0.22, 'triangle', 0.08);
    tone(294, 0.14, 0.3, 'triangle', 0.08);
  },
  /** 기록 조각 — 반짝 */
  relic() {
    tone(988, 0, 0.12, 'sine', 0.08);
    tone(1319, 0.08, 0.25, 'sine', 0.08);
  },
  /** 국화·편지 — 종소리 */
  honor() {
    tone(392, 0, 0.9, 'sine', 0.1);
    tone(587, 0.02, 0.9, 'sine', 0.05);
  },
  /** 시간의 문 */
  portal() {
    for (let i = 0; i < 5; i += 1) tone(440 + i * 110, i * 0.07, 0.3, 'sine', 0.06);
  },
  click() {
    tone(660, 0, 0.05, 'square', 0.03);
  },
};
