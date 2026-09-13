# สร้าง public/og-image.png (1200x630) สำหรับ Open Graph / Twitter Card
# ใช้: python scripts/generate-og-image.py  (ต้องมี Pillow: pip install pillow)
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (243, 245, 240)
INK = (51, 50, 63)
INK_SOFT = (110, 109, 126)
PRIMARY = (111, 121, 184)
FONT_BOLD = r"C:\Windows\Fonts\leelawdb.ttf"
FONT_REG = r"C:\Windows\Fonts\leelawad.ttf"

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# พื้นหลังไล่เฉดอ่อน ๆ จากมุมบนขวา (ฟ้า) และบนซ้าย (เนย)
for y in range(H):
    t = y / H
    for x_step in range(1):
        pass
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.ellipse([W - 620, -320, W + 320, 360], fill=(127, 169, 210, 34))
od.ellipse([-360, -260, 420, 320], fill=(224, 168, 120, 26))
img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
d = ImageDraw.Draw(img)

# การ์ดตกแต่ง 3 ใบด้านขวา (โทนพาสเทลเหมือนแอป)
cards = [
    (835, 175, 28, (223, 239, 230), (127, 185, 143)),  # มินต์
    (905, 145, 8, (251, 229, 211), (224, 168, 120)),   # พีช
    (975, 195, -14, (220, 235, 246), (127, 169, 210)), # ฟ้า
]
for x, y, rot, soft, edge in cards:
    card = Image.new("RGBA", (190, 250), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([0, 0, 189, 249], 22, fill=soft + (255,))
    cd.rounded_rectangle([0, 0, 189, 249], 22, outline=edge + (255,), width=5)
    cd.rounded_rectangle([0, 0, 189, 52], 22, fill=edge + (255,))
    cd.rectangle([0, 30, 189, 52], fill=edge + (255,))
    cd.rounded_rectangle([24, 84, 165, 96], 6, fill=edge + (150,))
    cd.rounded_rectangle([24, 116, 130, 128], 6, fill=edge + (110,))
    card = card.rotate(rot, expand=True, resample=Image.BICUBIC)
    img.paste(card, (x, y), card)
d = ImageDraw.Draw(img)

# ตัวอักษร
f_title = ImageFont.truetype(FONT_BOLD, 96)
f_sub = ImageFont.truetype(FONT_REG, 44)
f_small = ImageFont.truetype(FONT_REG, 30)

d.text((90, 205), "บัตรมาตรา", font=f_title, fill=INK)
d.text((94, 330), "แฟลชการ์ดทบทวนกฎหมาย ป.แพ่ง ป.อาญา", font=f_sub, fill=INK_SOFT)
d.text((94, 405), "สร้างกลุ่มการ์ดเอง · นำเข้ามาตราจากตัวบทโดยตรง · มินิเกมจับคู่", font=f_small, fill=INK_SOFT)

# แถบสีพาสเทลใต้ชื่อ (สันหนังสือ)
palette = [(127, 185, 143), (224, 168, 120), (155, 147, 214), (127, 169, 210), (205, 177, 105), (210, 147, 160)]
x = 94
for c in palette:
    d.rounded_rectangle([x, 505, x + 46, 517], 6, fill=c)
    x += 58
d.text((94, 545), "ใช้ฟรี ไม่ต้องสมัครสมาชิก", font=f_small, fill=INK_SOFT)

img.save("public/og-image.png", optimize=True)
print("saved public/og-image.png", img.size)
