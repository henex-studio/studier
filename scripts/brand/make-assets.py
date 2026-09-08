#!/usr/bin/env python3
"""Generates the browser, social and app icons from one set of numbers.

Every value below was measured off the portfolio cover for Studier,
projects/std/std-home.webp, rather than guessed, so the assets read as the
same thing rather than as something drawn nearby. Measured 8 September 2026:

    background   #3C54E7, 96% of the cover
    wordmark     #FFFFFF, cap height 12.9% of the image height
    tagline      #A6A6A6
    rule         11.9% of the width, 2.3% of the height, above the wordmark
    spacing      rule to wordmark 39px, wordmark to tagline 34px, at 774x482

Regenerate with:  python3 scripts/brand/make-assets.py
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

BLUE = (0x3C, 0x54, 0xE7)
WHITE = (0xFF, 0xFF, 0xFF)
GREY = (0xA6, 0xA6, 0xA6)

FONT = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
OUT = Path("public")

# Proportions from the cover, as fractions so they hold at any size.
RULE_W, RULE_H = 0.119, 0.023
CAP_H = 0.129
GAP_RULE = 0.081      # 39/482
GAP_TAG = 0.071       # 34/482


def fit(text, target_px, font_path=FONT):
    """Largest size whose cap height matches target_px."""
    size = target_px
    for _ in range(40):
        f = ImageFont.truetype(font_path, size)
        box = f.getbbox("S")
        cap = box[3] - box[1]
        if cap == 0:
            break
        size = max(1, round(size * target_px / cap))
        if abs(cap - target_px) <= 1:
            break
    return ImageFont.truetype(font_path, size)


def centred(draw, text, font, cx, top, fill):
    box = font.getbbox(text)
    draw.text((cx - (box[2] - box[0]) / 2 - box[0], top - box[1]), text, font=font, fill=fill)
    return box[3] - box[1]


def cover(w, h, tagline="Internal Testing Tool"):
    """The portfolio cover, rebuilt at any size. Used for the social image."""
    im = Image.new("RGB", (w, h), BLUE)
    d = ImageDraw.Draw(im)

    rule_w, rule_h = w * RULE_W, h * RULE_H
    cap = h * CAP_H
    font = fit("Studier", cap)
    tag_font = ImageFont.truetype(FONT, max(10, round(cap * 0.42)))
    tag_h = tag_font.getbbox(tagline)[3] - tag_font.getbbox(tagline)[1]

    block = rule_h + h * GAP_RULE + cap + h * GAP_TAG + tag_h
    y = (h - block) / 2
    cx = w / 2

    d.rounded_rectangle(
        [cx - rule_w / 2, y, cx + rule_w / 2, y + rule_h],
        radius=rule_h / 2, fill=WHITE,
    )
    y += rule_h + h * GAP_RULE
    y += centred(d, "Studier", font, cx, y, WHITE) + h * GAP_TAG
    centred(d, tagline, tag_font, cx, y, GREY)
    return im


def mark(size, padding=0.0):
    """The S with the rule above it. Square, for an app icon or a home screen.

    Cover proportions, which hold from 32 pixels upward. Below that the
    rule falls under one pixel and disappears into antialiasing, so small
    sizes are drawn by small_mark instead.
    """
    im = Image.new("RGB", (size, size), BLUE)
    d = ImageDraw.Draw(im)

    inner = size * (1 - 2 * padding)
    edge = size * padding

    cap = inner * 0.46
    rule_w = inner * 0.40
    rule_h = max(1, inner * 0.075)
    gap = inner * 0.13

    font = fit("S", cap)
    block = rule_h + gap + cap
    y = edge + (inner - block) / 2
    cx = size / 2

    d.rounded_rectangle(
        [cx - rule_w / 2, y, cx + rule_w / 2, y + rule_h],
        radius=rule_h / 2, fill=WHITE,
    )
    centred(d, "S", font, cx, y + rule_h + gap, WHITE)
    return im


def small_mark(size, rule_h, rule_w, gap, cap, supersample=8):
    """16 and 32 pixels, where the proportional version does not survive.

    The operator chose the S with the rule knowing it was the riskiest of
    the three options at this size, so this is the part that makes the
    choice work rather than quietly dropping the rule. Drawn at scale and
    reduced, which keeps the letter readable, then the rule is painted on
    afterwards at whole pixels. Painted proportionally it lands on about a
    pixel and a fifth, and antialiasing turns it into a pale smudge that
    reads as a smear above the letter rather than as a mark.

    Every argument is in final pixels, not fractions, because at this size
    a rounded fraction is the whole problem.
    """
    scale = size * supersample
    im = Image.new("RGB", (scale, scale), BLUE)
    d = ImageDraw.Draw(im)

    font = fit("S", cap * supersample)
    box = font.getbbox("S")
    top = round((size - (rule_h + gap + cap)) / 2)
    baseline = (top + rule_h + gap) * supersample

    d.text(
        (scale / 2 - (box[2] - box[0]) / 2 - box[0], baseline - box[1]),
        "S", font=font, fill=WHITE,
    )

    im = im.resize((size, size), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    x = round((size - rule_w) / 2)
    d.rectangle([x, top, x + rule_w - 1, top + rule_h - 1], fill=WHITE)
    return im


def main():
    OUT.mkdir(exist_ok=True)
    written = []

    def save(im, name):
        path = OUT / name
        im.save(path)
        written.append(f"{name}  {im.size[0]}x{im.size[1]}")

    # Social preview. 1200x630 is what every platform crops from.
    save(cover(1200, 630), "og-image.png")

    # Browser tab.
    save(small_mark(16, rule_h=2, rule_w=7, gap=1, cap=10), "favicon-16.png")
    save(small_mark(32, rule_h=4, rule_w=14, gap=2, cap=20), "favicon-32.png")

    # Home screen. Apple has no safe area, so no padding; the maskable one
    # is padded because Android crops it to whatever shape the launcher uses.
    save(mark(180), "apple-touch-icon.png")
    save(mark(192), "icon-192.png")
    save(mark(512), "icon-512.png")
    save(mark(512, padding=0.10), "icon-512-maskable.png")

    ico = mark(64).convert("RGB")
    ico.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    written.append("favicon.ico  16/32/48")

    print("\n".join(written))


if __name__ == "__main__":
    main()
