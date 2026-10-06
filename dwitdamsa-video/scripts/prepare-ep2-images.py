"""2화 원본 그림(public/ep2/raw)을 영상용으로 가공한다.

- 장면 그림: 1920×1080(16:9)으로 맞춰 자르고 JPEG로 저장 → public/ep2/img/
- 스티커 시트: 초록 배경을 지우고 스티커 6개를 각각 PNG로 분리 → public/ep2/stickers/

사용법: python3 scripts/prepare-ep2-images.py
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "public" / "ep2"
RAW, IMG, STK = ROOT / "raw", ROOT / "img", ROOT / "stickers"
SCENES = ["g1_giza", "g2_merer", "g3_boat", "g4_meal", "g5_map", "g6_cave", "g7_graffiti"]
# 화면에서 중요한 부분이 위/아래 어디에 있는지(0=위, 0.5=가운데, 1=아래)
VERTICAL_FOCUS = {"g1_giza": 0.45, "g5_map": 0.5}
STICKER_NAMES = ["papyrus", "block", "bread", "beer", "merer", "worker"]


def find_raw(name: str) -> Path:
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        p = RAW / f"{name}{ext}"
        if p.exists():
            return p
    raise FileNotFoundError(name)


def to_16x9(im: Image.Image, focus: float) -> Image.Image:
    w, h = im.size
    scale = max(1920 / w, 1080 / h)
    im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    w, h = im.size
    left = (w - 1920) // 2
    top = round((h - 1080) * focus)
    return im.crop((left, top, left + 1920, top + 1080))


def scenes() -> None:
    IMG.mkdir(parents=True, exist_ok=True)
    for name in SCENES:
        im = Image.open(find_raw(name)).convert("RGB")
        out = to_16x9(im, VERTICAL_FOCUS.get(name, 0.5))
        out.save(IMG / f"{name}.jpg", quality=88, optimize=True)
        print(name, im.size, "->", out.size)


def flood_background(green: np.ndarray) -> np.ndarray:
    h, w = green.shape
    bg = np.zeros((h, w), bool)
    q: deque = deque()
    for x in range(w):
        for y in (0, h - 1):
            if green[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if green[y, x] and not bg[y, x]:
                bg[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
            if 0 <= ny < h and 0 <= nx < w and green[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True
                q.append((ny, nx))
    return bg


def components(mask: np.ndarray, min_px: int) -> list[tuple[int, int, int, int, int]]:
    h, w = mask.shape
    lab = np.zeros((h, w), int)
    found = []
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            if mask[y, x] and lab[y, x] == 0:
                cid = len(found) + 1
                q = deque([(y, x)])
                lab[y, x] = cid
                x0 = x1 = x
                y0 = y1 = y
                n = 0
                while q:
                    cy, cx = q.popleft()
                    n += 1
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and lab[ny, nx] == 0:
                            lab[ny, nx] = cid
                            q.append((ny, nx))
                found.append((n, x0, y0, x1, y1))
    return [c for c in found if c[0] >= min_px]


def stickers() -> None:
    STK.mkdir(parents=True, exist_ok=True)
    im = Image.open(find_raw("stickers")).convert("RGB")
    a = np.asarray(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > r + 20) & (g > b + 10)
    bg = flood_background(green)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    alpha = np.asarray(alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.0)))
    rgb = a.copy()
    lum = (r + g + b) / 3
    rgb[(lum > 150) & (g > r + 5)] = [246, 242, 232]  # 초록빛이 밴 흰 테두리 정리
    edge = (alpha > 0) & (alpha < 255)
    rgb[..., 1] = np.where(edge, np.minimum(rgb[..., 1], np.maximum(rgb[..., 0], rgb[..., 2])), rgb[..., 1])
    rgba = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), alpha])
    h, w = alpha.shape
    comps = components(alpha > 128, min_px=(h * w) // 200)
    comps.sort(key=lambda c: (round(c[2] / (h / 2)), c[1]))  # 위 줄 → 아래 줄, 왼쪽 → 오른쪽
    if len(comps) != len(STICKER_NAMES):
        print(f"주의: 스티커 {len(comps)}개를 찾음(기대값 {len(STICKER_NAMES)})")
    for name, (_, x0, y0, x1, y1) in zip(STICKER_NAMES, comps):
        Image.fromarray(rgba).crop((x0 - 6, y0 - 6, x1 + 7, y1 + 7)).save(STK / f"{name}.png", optimize=True)
        print("sticker", name, (x1 - x0, y1 - y0))


if __name__ == "__main__":
    scenes()
    stickers()
