"""One-off: remove the studio gray backdrop from Karla's portrait.

Does not touch original files under site_kaka. Output is a PNG with alpha.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path("d:/AURYX/08 SITES/kaka/site_kaka/karla.jpg")
DST = Path("public/images/karla-dias.png")
PETROL = (26, 61, 53, 255)


def is_studio_gray(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn > 22:
        return False
    lum = (r + g + b) / 3
    # Gray paper is ~119–185; white shirt is brighter; hair is darker.
    return 105 <= lum <= 215


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    width, height = im.size
    pix = im.load()
    if pix is None:
        raise RuntimeError("could not load pixels")

    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        if 0 <= x < width and 0 <= y < height and not seen[y * width + x]:
            seen[y * width + x] = 1
            queue.append((x, y))

    for x in range(width):
        push(x, 0)
        r, g, b, _a = pix[x, height - 1]
        if is_studio_gray(r, g, b):
            push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)

    removed = 0
    while queue:
        x, y = queue.popleft()
        r, g, b, _a = pix[x, y]
        if not is_studio_gray(r, g, b):
            continue
        pix[x, y] = (r, g, b, 0)
        removed += 1
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)

    # Choke: eat a 2px fringe of leftover gray so the petrol frame
    # does not show a light halo around hair and shoulders.
    fringe_count = 0
    for _ in range(2):
        fringe: list[tuple[int, int]] = []
        for y in range(height):
            for x in range(width):
                if pix[x, y][3] == 0:
                    continue
                edge = False
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height and pix[nx, ny][3] == 0:
                        edge = True
                        break
                if not edge:
                    continue
                r, g, b, _a = pix[x, y]
                mx, mn = max(r, g, b), min(r, g, b)
                lum = (r + g + b) / 3
                if mx - mn <= 40 and lum >= 90:
                    fringe.append((x, y))
        for x, y in fringe:
            pix[x, y] = (pix[x, y][0], pix[x, y][1], pix[x, y][2], 0)
            fringe_count += 1
            removed += 1

    petrol = Image.new("RGBA", im.size, PETROL)
    petrol.alpha_composite(im)
    petrol.convert("RGB").save(DST, "PNG", optimize=True)
    print(f"saved {DST} transparent_px={removed} fringe={fringe_count} bytes={DST.stat().st_size}")


if __name__ == "__main__":
    main()
