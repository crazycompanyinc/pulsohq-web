#!/usr/bin/env python3
"""Regenerate hero background with more visible neural network pattern"""
import os, math, random
from PIL import Image, ImageDraw, ImageFilter

OUTPUT = "/root/.hermes/workspace/pulsohq-web/assets/img"
os.makedirs(OUTPUT, exist_ok=True)

def create_hero_bg_v2():
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), (6, 10, 20))
    draw = ImageDraw.Draw(img)

    # Radial gradient background
    for y in range(h):
        for x in range(0, w, 3):  # step 3 for speed
            dx = x - w//2
            dy = y - h//2
            dist = math.sqrt(dx*dx + dy*dy)
            t = min(1.0, dist / 900)
            r = int(6 + 15 * (1-t))
            g = int(10 + 20 * (1-t))
            b = int(20 + 40 * (1-t))
            draw.point((x, y), fill=(r, g, b))

    # Neural network - more visible
    random.seed(42)
    nodes = []
    for _ in range(120):
        x = random.randint(50, w - 50)
        y = random.randint(50, h - 50)
        size = random.randint(2, 7)
        color = random.choice([
            (59, 130, 246), (34, 211, 238), (52, 211, 153), 
            (139, 92, 246), (99, 102, 241)
        ])
        nodes.append((x, y, size, color))

    # Draw connections first (glowing lines)
    for i, n1 in enumerate(nodes):
        for n2 in nodes[i+1:]:
            dist = math.sqrt((n1[0]-n2[0])**2 + (n1[1]-n2[1])**2)
            if dist < 200:
                alpha = max(15, int(60 * (1 - dist / 200)))
                color = n1[3]
                # Draw thick glowing line
                draw.line([(n1[0], n1[1]), (n2[0], n2[1])], 
                         fill=(*color, alpha), width=1)

    # Draw nodes with glow
    for x, y, size, color in nodes:
        # Outer glow
        for r in range(size + 15, size, -1):
            a = int(40 * (1 - (r - size) / 15))
            draw.ellipse([x-r, y-r, x+r, y+r], fill=(*color[:3],))
        # Core
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(*color[:3],))

    # Central focal point - bright glow
    cx, cy = w // 2, h // 2
    for r in range(350, 0, -1):
        t = r / 350
        a = int(30 * (1 - t))
        c = (int(59*(1-t*0.3)), int(130*(1-t*0.2)), int(246*(1-t*0.2)))
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)

    # Subtle grid
    for x in range(0, w, 100):
        draw.line([(x, 0), (x, h)], fill=(59, 130, 246, 15), width=1)
    for y in range(0, h, 100):
        draw.line([(0, y), (w, y)], fill=(59, 130, 246, 15), width=1)

    # Vignette edges
    for i in range(100):
        alpha = int(255 * (i / 100))
        # Top
        draw.rectangle([0, 0, w, i], fill=(6, 10, 20))
        # Bottom  
        draw.rectangle([0, h-i, w, h], fill=(6, 10, 20))
        # Left
        draw.rectangle([0, 0, i, h], fill=(6, 10, 20))
        # Right
        draw.rectangle([w-i, 0, w, h], fill=(6, 10, 20))

    img.save(f"{OUTPUT}/hero-bg.jpg", quality=92)
    print(f"✅ Hero BG v2: {OUTPUT}/hero-bg.jpg")

create_hero_bg_v2()

# Also regenerate og-image with better quality
def create_og_v2():
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), (6, 10, 20))
    draw = ImageDraw.Draw(img)

    # Gradient
    for y in range(h):
        t = y / h
        r = int(6 + 8 * t)
        g = int(10 + 12 * t)
        b = int(20 + 25 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Neural pattern
    random.seed(99)
    nodes = [(random.randint(50, w-50), random.randint(50, h-50), 
              random.randint(2, 5), random.choice([(59,130,246),(34,211,238),(52,211,153)])) 
             for _ in range(60)]
    
    for i, n1 in enumerate(nodes):
        for n2 in nodes[i+1:]:
            dist = math.sqrt((n1[0]-n2[0])**2 + (n1[1]-n2[1])**2)
            if dist < 180:
                draw.line([(n1[0],n1[1]),(n2[0],n2[1])], fill=(*n1[3],50), width=1)
    
    for x, y, size, color in nodes:
        for r in range(12, 0, -1):
            draw.ellipse([x-r, y-r, x+r, y+r], fill=(*color,))
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(*color,))

    # Left accent bar
    for x in range(0, 350):
        t = x / 350
        a = int(40 * (1 - t))
        draw.line([(x, 0), (x, h)], fill=(59, 130, 246))

    # Bottom fade
    for y in range(h-120, h):
        t = (y - (h-120)) / 120
        a = int(50 * t)
        draw.line([(0, y), (w, y)], fill=(6, 10, 20))

    try:
        font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 68)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26)
        font_xs = ImageFont/truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        font_lg = ImageFont.load_default()
        font_sm = font_lg
        font_xs = font_lg

    # Logo circle
    for r in range(55, 0, -1):
        t = r / 55
        c = (int(59*(1-t)+6*t), int(130*(1-t)+10*t), int(246*(1-t)+20*t))
        draw.ellipse([130-r, h//2-r-20, 130+r, h//2+r-20], fill=c)

    # Text
    draw.text((210, h//2 - 50), "PulsoHQ", fill=(255,255,255), font=font_lg)
    draw.text((210, h//2 + 25), "Automatiza todo · Agentes de IA", fill=(156, 163, 175), font=font_sm)
    draw.text((210, h//2 + 65), "Resultados en 48 horas", fill=(107, 114, 128), font=font_xs)

    # Gradient accent
    for x in range(210, 650):
        t = (x - 210) / 440
        r = int(59*(1-t) + 34*t)
        g = int(130*(1-t) + 211*t)
        b = int(246*(1-t) + 238*t)
        draw.line([(x, h//2 + 12), (x, h//2 + 16)], fill=(r,g,b))

    img.save(f"{OUTPUT}/og-image.png")
    print(f"✅ OG Image v2: {OUTPUT}/og-image.png")

from PIL import ImageFont
create_og_v2()

print("\n✅ All images regenerated!")
