from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "v2")

ITEMS = [
    ("01-home.jpg", "01 - HOME", "Dashboard overview"),
    ("02-fitness-ai.jpg", "02 - FITNESS AI", "Chat coach + plans"),
    ("03-progress.jpg", "03 - PROGRESS", "Body scan, calories, strength"),
    ("04-workout.jpg", "04 - WORKOUT", "Sets, reps, history"),
    ("05-cardio.jpg", "05 - CARDIO", "Run / swim / cycle"),
    ("06-autopilot-reference.webp", "06 - AUTOPILOT AI", "Daily mission control"),
    ("07-diet.jpg", "07 - DIET", "Food scan + history"),
]

W, H = 1240, 1754  # A4 @150dpi
BG = (5, 7, 12)
FG = (233, 238, 248)
MUTED = (135, 148, 169)
TEAL = (45, 212, 191)


def font(size, bold=True):
    names = ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]
    for n in names:
        p = os.path.join("C:/Windows/Fonts", n)
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


f_title = font(52)
f_sub = font(30, bold=False)
f_foot = font(22, bold=False)

pages = []
for fname, title, sub in ITEMS:
    p = os.path.join(SRC, fname)
    if not os.path.exists(p):
        continue
    img = Image.open(p).convert("RGB")
    page = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(page)

    d.text((80, 70), title, font=f_title, fill=FG)
    d.text((80, 140), sub, font=f_sub, fill=MUTED)
    d.line([(80, 200), (W - 80, 200)], fill=(26, 35, 51), width=2)
    d.line([(80, 200), (80 + 130, 200)], fill=TEAL, width=3)

    top, bottom = 250, H - 110
    max_w, max_h = W - 160, bottom - top
    r = min(max_w / img.width, max_h / img.height)
    nw, nh = int(img.width * r), int(img.height * r)
    img = img.resize((nw, nh), Image.LANCZOS)
    x = (W - nw) // 2
    y = top + (max_h - nh) // 2
    d.rectangle([x - 2, y - 2, x + nw + 2, y + nh + 2], outline=(26, 35, 51), width=2)
    page.paste(img, (x, y))

    foot = "DreamPhysic AI  -  Frontend Design Reference  -  Dark theme #05070c / teal #2dd4bf / purple #a855f7 / gold #fbbf24"
    d.text((80, H - 70), foot, font=f_foot, fill=(102, 116, 138))
    pages.append(page)

out = os.path.join(HERE, "DreamPhysic-AI-designs.pdf")
pages[0].save(out, "PDF", save_all=True, append_images=pages[1:], resolution=150.0)
print("pages:", len(pages))
print("saved:", out, os.path.getsize(out), "bytes")
