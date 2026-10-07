"""뒷담사(史) 엔딩 음악을 직접 합성한다(저작권 걱정 없는 자체 제작 음원).

고대 메소포타미아·이집트의 리라(뜯는 현악기) 느낌을 내려고
- 카플러스-스트롱(Karplus-Strong) 방식으로 현을 뜯는 소리를 만들고
- 낮은 지속음(드론)과 부드러운 프레임 드럼을 깔고
- 간단한 잔향을 더했다.
D 도리안 선법, 80 BPM, 16초. 마지막은 D 화음을 길게 울리며 끝난다.

사용법: python3 scripts/make-ending-music.py  → public/audio/ending.mp3
"""

import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 80
BEAT = 60 / BPM
LENGTH = 16.0
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
rng = np.random.default_rng(7)


def hz(note: str) -> float:
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    n, octave = note[:-1], int(note[-1])
    semis = names[n[0]] + (1 if "#" in n else -1 if "b" in n[1:] else 0)
    return 440.0 * 2 ** ((semis + (octave - 4) * 12) / 12)


def pluck(freq: float, dur: float, bright: float = 0.5) -> np.ndarray:
    """카플러스-스트롱 현 뜯기."""
    n = int(SR * dur)
    period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period)
    # 처음 노이즈를 조금 다듬어 너무 거칠지 않게
    buf = np.convolve(buf, [bright, 1 - bright], mode="same")
    buf = np.convolve(buf, np.ones(3) / 3, mode="same")
    out = np.empty(n)
    decay = 0.996
    for i in range(n):
        out[i] = buf[i % period]
        nxt = buf[(i + 1) % period]
        buf[i % period] = decay * 0.5 * (buf[i % period] + nxt)
    env = np.minimum(1, np.arange(n) / (0.004 * SR))
    return out * env


def drum(dur: float = 0.9) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    pitch = 70 * np.exp(-t * 6) + 48
    body = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * np.exp(-t * 7)
    noise = rng.uniform(-1, 1, n) * np.exp(-t * 40) * 0.25
    noise = np.convolve(noise, np.ones(30) / 30, mode="same")
    return (body + noise) * 0.6


def drone(dur: float) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for f, a in ((hz("D2"), 1.0), (hz("A2"), 0.6), (hz("D3"), 0.25)):
        sig += a * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t))
    swell = np.minimum(1, t / 2.5) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * t))
    return sig * swell * 0.05


def reverb(x: np.ndarray, seconds: float = 2.2, mix: float = 0.28) -> np.ndarray:
    n = int(SR * seconds)
    ir = rng.uniform(-1, 1, n) * np.exp(-np.arange(n) / (SR * seconds / 6))
    ir = np.convolve(ir, np.ones(12) / 12, mode="same")  # 높은음 깎기
    ir /= np.sqrt(np.sum(ir**2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return (1 - mix) * x + mix * wet


def lowpass(x: np.ndarray, cutoff: float = 4200.0) -> np.ndarray:
    """고음역의 '쉬' 소리를 줄이는 부드러운 저역 통과(주파수 영역에서 완만하게 깎음)."""
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= 1 / np.sqrt(1 + (f / cutoff) ** 6)
    return np.fft.irfft(spec, len(x))


def place(track: np.ndarray, clip: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    j = min(len(track), i + len(clip))
    track[i:j] += clip[: j - i] * gain


def main() -> None:
    n = int(SR * LENGTH)
    left = np.zeros(n)
    right = np.zeros(n)

    # 화음 진행(마디당 4박): Dm – C – G/B – Dm, 한 번 더 Dm – C – Dm(끝)
    bars = [
        ("D3", "A3", "D4", "F4"),
        ("C3", "G3", "C4", "E4"),
        ("B2", "G3", "B3", "D4"),
        ("D3", "A3", "D4", "F4"),
    ]
    pattern = [0, 1, 2, 1, 3, 1, 2, 1]  # 8분음표 아르페지오
    t0 = 0.0
    for b in range(int(LENGTH / (4 * BEAT)) + 1):
        chord = bars[b % len(bars)]
        for k, idx in enumerate(pattern):
            at = t0 + b * 4 * BEAT + k * BEAT / 2
            if at > LENGTH - 3.2:
                break
            p = pluck(hz(chord[idx]), 1.6, bright=0.55 if k % 2 else 0.45)
            g = 0.32 if k % 2 == 0 else 0.22
            place(left if k % 2 == 0 else right, p, at, g)
            place(right if k % 2 == 0 else left, p, at + 0.012, g * 0.5)

    # 위에서 흐르는 짧은 선율
    phrase = [("A4", 0), ("G4", 1.5), ("F4", 2), ("E4", 3), ("D4", 4),
              ("F4", 5.5), ("E4", 6), ("C4", 7), ("D4", 8), ("A4", 9.5), ("G4", 10)]
    melody = phrase + [(n, b + 12) for n, b in phrase[:5]]
    for note, beat in melody:
        at = beat * BEAT + 0.05
        if at < LENGTH - 3.2:
            mp = pluck(hz(note), 2.2, bright=0.35)
            place(left, mp, at, 0.26)
            place(right, mp, at, 0.26)

    # 마지막 D 화음을 위에서 아래로 쓸어 내리듯
    end_at = LENGTH - 3.1
    for k, note in enumerate(("D4", "A3", "F3", "D3", "A2", "D2")):
        c = pluck(hz(note), 3.0, bright=0.4)
        place(left, c, end_at + k * 0.045, 0.3)
        place(right, c, end_at + k * 0.045 + 0.01, 0.3)

    # 프레임 드럼: 1·3박
    beat_n = int((LENGTH - 3.2) / BEAT)
    for k in range(beat_n):
        if k % 4 in (0, 2):
            d = drum()
            place(left, d, k * BEAT, 0.28 if k % 4 == 0 else 0.18)
            place(right, d, k * BEAT, 0.28 if k % 4 == 0 else 0.18)
    place(left, drum(1.4), end_at, 0.32)
    place(right, drum(1.4), end_at, 0.32)

    dr = drone(LENGTH)
    left += dr
    right += dr

    left, right = reverb(left), reverb(right)
    left, right = lowpass(left), lowpass(right)
    t = np.arange(n) / SR
    fade = np.minimum(1, t / 0.6) * np.clip((LENGTH - t) / 2.0, 0, 1)
    stereo = np.stack([left * fade, right * fade], axis=1)
    stereo /= np.max(np.abs(stereo)) * 1.12

    OUT.mkdir(parents=True, exist_ok=True)
    wav = OUT / "ending.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype("<i2").tobytes())
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9",
         "-ar", "44100", "-b:a", "192k", str(OUT / "ending.mp3")],
        check=True,
    )
    wav.unlink()
    print("saved", OUT / "ending.mp3")


if __name__ == "__main__":
    main()
