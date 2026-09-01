"""Color-grade Karla's outdoor portrait to match the petrol/sand site.

Crops to 4:5, warms the grade, adds a soft petrol vignette. Does not cut
the subject out — a hard knockout looked artificial on the previous photo.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

SRC = Path(
    r"C:\Users\luiza\.cursor\projects\d-AURYX-CLOUD-apps-karlaneuropsi-karlapsi"
    r"\assets\c__Users_luiza_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"5701480a8b65be5e6b3822807359ddc8_images_WhatsApp_Image_2026-09-01_at_"
    r"18.16.54-6f1b7590-99b1-4111-84f3-7854c66d20ef.jpg"
)
DST = Path("public/images/karla-dias.jpg")
MAX_HEIGHT = 1600
SAND = (248, 242, 232)
PETROL = (22, 51, 45)


def crop_to_ratio(im: Image.Image, ratio: float) -> Image.Image:
    width, height = im.size
    # Cut the railing at the bottom and a sliver of sky so the face fills the frame.
    top = int(height * 0.02)
    bottom = int(height * 0.80)
    usable = im.crop((0, top, width, bottom))
    width, height = usable.size
    current = width / height
    if current > ratio:
        new_w = int(height * ratio)
        left = (width - new_w) // 2
        return usable.crop((left, 0, left + new_w, height))
    new_h = int(width / ratio)
    return usable.crop((0, 0, width, new_h))


def grade(im: Image.Image) -> Image.Image:
    red, green, blue = im.split()
    red = red.point(lambda x: min(255, int(x * 1.02 + 1)))
    green = green.point(lambda x: min(255, int(x * 1.04)))
    blue = blue.point(lambda x: min(255, int(x * 0.97 + 4)))
    im = Image.merge("RGB", (red, green, blue))
    im = ImageEnhance.Color(im).enhance(0.9)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    im = ImageEnhance.Brightness(im).enhance(1.02)
    im = ImageEnhance.Sharpness(im).enhance(1.06)
    sand = Image.new("RGB", im.size, SAND)
    warmed = Image.blend(im, sand, 0.05)
    petrol_cast = Image.new("RGB", im.size, PETROL)
    return Image.blend(warmed, petrol_cast, 0.06)


def vignette(im: Image.Image) -> Image.Image:
    mask = Image.new("L", im.size, 0)
    draw = ImageDraw.Draw(mask)
    mx, my = int(im.width * 0.06), int(im.height * 0.05)
    draw.ellipse((mx, my, im.width - mx, im.height - my), fill=255)
    blur = max(40, int(min(im.width, im.height) * 0.16))
    mask = mask.filter(ImageFilter.GaussianBlur(radius=blur))
    petrol = Image.new("RGB", im.size, PETROL)
    shaded = Image.blend(im, petrol, 0.18)
    return Image.composite(im, shaded, mask)


def main() -> None:
    if not SRC.exists():
        raise FileNotFoundError(SRC)

    im = Image.open(SRC).convert("RGB")
    im = crop_to_ratio(im, 4 / 5)
    if im.height > MAX_HEIGHT:
        scale = MAX_HEIGHT / im.height
        im = im.resize((int(im.width * scale), MAX_HEIGHT), Image.Resampling.LANCZOS)
    im = grade(im)
    im = vignette(im)
    DST.parent.mkdir(parents=True, exist_ok=True)
    im.save(DST, "JPEG", quality=90, optimize=True, progressive=True)
    print(f"wrote {DST} {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
