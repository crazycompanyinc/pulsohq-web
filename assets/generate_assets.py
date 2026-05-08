#!/usr/bin/env python3
"""
PulsoHQ Professional Brand Assets Generator
Genera logo SVG, favicon, hero bg, OG image, y todos los assets visuales.
"""
import os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import struct, zlib

OUTPUT = "/root/.hermes/workspace/pulsohq-web/assets/img"
os.makedirs(OUTPUT, exist_ok=True)

# ============================================================
# 1. LOGO SVG — Neural network pulse mark
# ============================================================
LOGO_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="50%" style="stop-color:#22D3EE"/>
      <stop offset="100%" style="stop-color:#34D399"/>
    </linearGradient>
    <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#3B82F6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Outer ring -->
  <circle cx="256" cy="256" r="220" fill="none" stroke="url(#g1)" stroke-width="2" opacity="0.3"/>
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#g1)" stroke-width="1.5" opacity="0.2"/>
  <!-- Central nodes — neural network pattern -->
  <g filter="url(#glow)">
    <!-- Center hub -->
    <circle cx="256" cy="256" r="32" fill="url(#g1)" opacity="0.9"/>
    <circle cx="256" cy="256" r="18" fill="#0B0F19"/>
    <circle cx="256" cy="256" r="10" fill="url(#g1)"/>
    <!-- Orbiting nodes -->
    <circle cx="256" cy="140" r="18" fill="#3B82F6" opacity="0.85"/>
    <circle cx="356" cy="200" r="16" fill="#22D3EE" opacity="0.85"/>
    <circle cx="380" cy="310" r="14" fill="#34D399" opacity="0.85"/>
    <circle cx="310" cy="380" r="16" fill="#8B5CF6" opacity="0.85"/>
    <circle cx="200" cy="370" r="14" fill="#3B82F6" opacity="0.85"/>
    <circle cx="130" cy="300" r="16" fill="#22D3EE" opacity="0.85"/>
    <circle cx="140" cy="190" r="15" fill="#34D399" opacity="0.85"/>
    <!-- Connections -->
    <line x1="256" y1="224" x2="256" y2="158" stroke="#3B82F6" stroke-width="2.5" opacity="0.7"/>
    <line x1="284" y1="240" x2="345" y2="208" stroke="#22D3EE" stroke-width="2" opacity="0.6"/>
    <line x1="278" y1="278" x2="366" y2="310" stroke="#34D399" stroke-width="2" opacity="0.6"/>
    <line x1="256" y1="288" x2="305" y2="366" stroke="#8B5CF6" stroke-width="2" opacity="0.6"/>
    <line x1="228" y1="278" x2="200" y2="356" stroke="#3B82F6" stroke-width="2" opacity="0.6"/>
    <line x1="230" y1="245" x2="140" y2="200" stroke="#22D3EE" stroke-width="2" opacity="0.6"/>
    <line x1="240" y1="228" x2="148" y2="188" stroke="#34D399" stroke-width="1.5" opacity="0.5"/>
    <line x1="256" y1="158" x2="140" y2="190" stroke="#3B82F6" stroke-width="1.5" opacity="0.4"/>
    <line x1="256" y1="158" x2="356" y2="200" stroke="#22D3EE" stroke-width="1.5" opacity="0.4"/>
    <!-- Pulse line — ECG style across bottom -->
    <polyline points="80,420 140,420 170,420 190,380 210,460 230,400 250,430 300,430 320,430 360,430 400,430 430,420"
      fill="none" stroke="url(#g1)" stroke-width="3" opacity="0.6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>'''

with open(f"{OUTPUT}/logo.svg", "w") as f:
    f.write(LOGO_SVG)
print(f"✅ Logo SVG: {OUTPUT}/logo.svg")

# ============================================================
# 2. FAVICON — PNG 512x512 from the SVG concept
# ============================================================
def create_favicon():
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    def draw_glow_circle(d, x, y, r, color, glow_r=None):
        if glow_r:
            for i in range(glow_r, 0, -1):
                alpha = int(30 * (1 - i / glow_r))
                d.ellipse([x-r-i, y-r-i, x+r+i, y+r+i], fill=(*color, alpha))
        d.ellipse([x-r, y-r, x+r, y+r], fill=(*color, 255))

    def draw_gradient_circle(d, x, y, r1, r2, c1, c2):
        """Draw a circle with gradient from c1 to c2"""
        for i in range(r1, 0, -1):
            t = i / r1
            r = int(c1[0] * t + c2[0] * (1-t))
            g = int(c1[1] * t + c2[1] * (1-t))
            b = int(c1[2] * t + c2[2] * (1-t))
            d.ellipse([x-i, y-i, x+i, y+i], fill=(r, g, b, 255))

    # Outer ring
    draw.ellipse([cx-220, cy-220, cx+220, cy+220], outline=(59, 130, 246, 80), width=3)
    draw.ellipse([cx-180, cy-180, cx+180, cy+180], outline=(34, 211, 238, 60), width=2)

    # Neural connections
    nodes = [
        (cx, cy - 116, 18, (59, 130, 246)),
        (cx + 100, cy - 56, 16, (34, 211, 238)),
        (cx + 124, cy + 54, 14, (52, 211, 153)),
        (cx + 54, cy + 124, 16, (139, 92, 246)),
        (cx - 56, cy + 114, 14, (59, 130, 246)),
        (cx - 126, cy + 44, 16, (34, 211, 238)),
        (cx - 116, cy - 66, 15, (52, 211, 153)),
    ]

    # Draw connections first
    hub = (cx, cy)
    for nx, ny, nr, nc in nodes:
        draw.line([hub, (nx, ny)], fill=(*nc, 100), width=2)

    # Cross connections
    for i in range(len(nodes)):
        n1 = nodes[i]
        n2 = nodes[(i+1) % len(nodes)]
        draw.line([(n1[0], n1[1]), (n2[0], n2[1])], fill=(59, 130, 246, 40), width=1)

    # Draw nodes
    for nx, ny, nr, nc in nodes:
        draw_glow_circle(draw, nx, ny, nr + 8, nc, glow_r=12)
        draw.ellipse([nx-nr, ny-nr, nx+nr, ny+nr], fill=(*nc, 230))

    # Center hub
    draw_glow_circle(draw, cx, cy, 40, (59, 130, 246), glow_r=18)
    draw.ellipse([cx-32, cy-32, cx+32, cy+32], fill=(11, 15, 25, 255))
    draw.ellipse([cx-22, cy-22, cx+22, cy+22], fill=(59, 130, 246, 200))
    draw.ellipse([cx-10, cy-10, cx+10, cy+10], fill=(34, 211, 238, 255))

    # ECG pulse line at bottom
    pulse_y = cy + 165
    pulse_points = []
    x_start = cx - 170
    for i in range(35):
        x = x_start + i * 10
        if i in [7, 8]:
            y = pulse_y - 40
        elif i == 9:
            y = pulse_y + 80
        elif i in [10, 11]:
            y = pulse_y - 20
        elif i == 12:
            y = pulse_y + 10
        else:
            y = pulse_y
        pulse_points.append((x, y))

    for i in range(len(pulse_points) - 1):
        draw.line([pulse_points[i], pulse_points[i+1]], fill=(52, 211, 153, 150), width=3)

    img.save(f"{OUTPUT}/favicon.png")
    print(f"✅ Favicon: {OUTPUT}/favicon.png")

create_favicon()

# ============================================================
# 3. HERO BACKGROUND — 1920x1080 Futuristic neural network
# ============================================================
def create_hero_bg():
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), (11, 15, 25))
    draw = ImageDraw.Draw(img)

    # Subtle gradient background
    for y in range(h):
        t = y / h
        r = int(11 + t * 8)
        g = int(15 + t * 12)
        b = int(25 + t * 20)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Neural network nodes
    random.seed(42)
    nodes = []
    for _ in range(80):
        x = random.randint(100, w - 100)
        y = random.randint(100, h - 100)
        size = random.randint(2, 6)
        color = random.choice([(59, 130, 246), (34, 211, 238), (52, 211, 153), (139, 92, 246)])
        alpha = random.randint(40, 120)
        nodes.append((x, y, size, color, alpha))

    # Draw connections
    for i, n1 in enumerate(nodes):
        for n2 in nodes[i+1:]:
            dist = math.sqrt((n1[0]-n2[0])**2 + (n1[1]-n2[1])**2)
            if dist < 250:
                alpha = max(10, int(80 * (1 - dist / 250)))
                color = n1[3]
                mid_x = (n1[0] + n2[0]) // 2
                mid_y = (n1[1] + n2[1]) // 2
                draw.line([(n1[0], n1[1]), (mid_x, mid_y)], fill=(*color, alpha), width=1)

    # Draw nodes with glow
    for x, y, size, color, alpha in nodes:
        # Glow
        for i in range(12, 0, -1):
            a = int(alpha * 0.1 * (1 - i/12))
            draw.ellipse([x-size-i*2, y-size-i*2, x+size+i*2, y+size+i*2], fill=color)
        # Core
        draw.ellipse([x-size, y-size, x+size, y+size], fill=color)

    # Central focal glow
    for r in range(300, 0, -1):
        t = r / 300
        a = int(15 * (1 - t))
        draw.ellipse([w//2-r, h//2-r, w//2+r, h//2+r], fill=(59, 130, 246))

    # Subtle grid overlay
    for x in range(0, w, 80):
        draw.line([(x, 0), (x, h)], fill=(59, 130, 246, 8), width=1)
    for y in range(0, h, 80):
        draw.line([(0, y), (w, y)], fill=(59, 130, 246, 8), width=1)

    img.save(f"{OUTPUT}/hero-bg.jpg", quality=90)
    print(f"✅ Hero BG: {OUTPUT}/hero-bg.jpg")

create_hero_bg()

# ============================================================
# 4. OG IMAGE — 1200x630 Social preview
# ============================================================
def create_og_image():
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), (11, 15, 25))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(h):
        t = y / h
        r = int(11 + t * 5)
        g = int(15 + t * 8)
        b = int(25 + t * 15)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Subtle neural network pattern
    random.seed(123)
    for _ in range(40):
        x = random.randint(50, w - 50)
        y = random.randint(50, h - 50)
        size = random.randint(2, 5)
        color = random.choice([(59, 130, 246), (34, 211, 238), (52, 211, 153)])
        draw.ellipse([x-size, y-size, x+size, y+size], fill=color)
        if random.random() > 0.5:
            x2 = x + random.randint(-200, 200)
            y2 = y + random.randint(-150, 150)
            draw.line([(x, y), (x2, y2)], fill=(*color, 60), width=1)

    # Left area accent
    for x in range(0, 400):
        t = x / 400
        a = int(20 * (1 - t))
        draw.line([(x, 0), (x, h)], fill=(59, 130, 246))

    # Bottom gradient
    for y in range(h - 150, h):
        t = (y - (h - 150)) / 150
        a = int(30 * t)
        draw.line([(0, y), (w, y)], fill=(11, 15, 25))

    # Try to use a font
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    except:
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Bold.ttf", 72)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Regular.ttf", 28)
        except:
            font_large = ImageFont.load_default()
            font_small = font_large

    # Logo circle (simplified)
    for r in range(60, 0, -1):
        t = r / 60
        color = (int(59*t + 11*(1-t)), int(130*t + 15*(1-t)), int(246*t + 25*(1-t)))
        draw.ellipse([130-r, h//2-r, 130+r, h//2+r], fill=color)

    # Text
    draw.text((220, h//2 - 55), "PulsoHQ", fill=(255, 255, 255), font=font_large)
    draw.text((220, h//2 + 30), "Automatiza todo · Agentes de IA", fill=(156, 163, 175), font=font_small)
    draw.text((220, h//2 + 70), "pulsohq-web.vercel.app", fill=(107, 114, 128), font=font_small)

    # Gradient accent line
    for x in range(220, 700):
        t = (x - 220) / 480
        r = int(59 * (1 - t) + 34 * t)
        g = int(130 * (1 - t) + 211 * t)
        b = int(246 * (1 - t) + 238 * t)
        draw.line([(x, h//2 + 15), (x, h//2 + 18)], fill=(r, g, b))

    img.save(f"{OUTPUT}/og-image.png")
    print(f"✅ OG Image: {OUTPUT}/og-image.png")

create_og_image()

# ============================================================
# 5. AI AGENTS IMAGE — 1200x800 Conceptual visualization
# ============================================================
def create_ai_agents_img():
    w, h = 1200, 800
    img = Image.new("RGB", (w, h), (17, 24, 39))
    draw = ImageDraw.Draw(img)

    # Background gradient
    for y in range(h):
        t = y / h
        r = int(17 + t * 5)
        g = int(24 + t * 8)
        b = int(39 + t * 12)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Central processing hub
    cx, cy = w // 2, h // 2

    # Create agent nodes in hexagonal pattern
    agents = [
        (cx, cy - 180, "Datos", (59, 130, 246)),
        (cx + 156, cy - 90, "Comunicación", (34, 211, 238)),
        (cx + 156, cy + 90, "Análisis", (52, 211, 153)),
        (cx, cy + 180, "Contenido", (139, 92, 246)),
        (cx - 156, cy + 90, "Soporte", (249, 115, 22)),
        (cx - 156, cy - 90, "Ventas", (59, 130, 246)),
    ]

    # Draw hub glow
    for r in range(200, 0, -1):
        t = r / 200
        a = int(25 * (1 - t))
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(59, 130, 246))

    # Draw connections from hub to agents
    for ax, ay, name, color in agents:
        # Glow line
        dist = math.sqrt((ax-cx)**2 + (ay-cy)**2)
        steps = int(dist / 5)
        for i in range(steps):
            t = i / steps
            x = int(cx + (ax - cx) * t)
            y = int(cy + (ay - cy) * t)
            a = int(200 * math.sin(t * math.pi))
            r = int(color[0] * 0.4 + 30)
            g = int(color[1] * 0.4 + 30)
            b = int(color[2] * 0.4 + 30)
            if 0 <= x < w and 0 <= y < h:
                draw.ellipse([x-4, y-4, x+4, y+4], fill=(r, g, b))
        # Main line
        draw.line([(cx, cy), (ax, ay)], fill=(*color, 80), width=2)

    # Draw agent nodes
    for ax, ay, name, color in agents:
        # Outer glow
        for r in range(45, 0, -1):
            t = r / 45
            a = int(30 * (1 - t))
            draw.ellipse([ax-r, ay-r, ax+r, ay+r], fill=color)
        # Node
        draw.ellipse([ax-30, ay-30, ax+30, ay+30], fill=(*color, 200))
        draw.ellipse([ax-20, ay-20, ax+20, ay+20], fill=(17, 24, 39))
        draw.ellipse([ax-10, ay-10, ax+10, ay+10], fill=(*color, 255))

    # Center hub glow
    for r in range(60, 0, -1):
        t = r / 60
        a = int(100 * (1 - t))
        c = (int(59*(1-t) + 34*t), int(130*(1-t) + 211*t), int(246*(1-t) + 238*t))
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)

    draw.ellipse([cx-40, cy-40, cx+40, cy+40], fill=(17, 24, 39))
    draw.ellipse([cx-25, cy-25, cx+25, cy+25], fill=(59, 130, 246))
    draw.ellipse([cx-12, cy-12, cx+12, cy+12], fill=(34, 211, 238))

    img.save(f"{OUTPUT}/ai-agents.jpg", quality=90)
    print(f"✅ AI Agents: {OUTPUT}/ai-agents.jpg")

create_ai_agents_img()

# ============================================================
# 6. RESULTS IMAGE — 1200x600 Metrics visualization
# ============================================================
def create_results_img():
    w, h = 1200, 600
    img = Image.new("RGB", (w, h), (11, 15, 25))
    draw = ImageDraw.Draw(img)

    # Background
    for y in range(h):
        t = y / h
        r = int(11 + t * 4)
        g = int(15 + t * 6)
        b = int(25 + t * 10)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Abstract chart — rising curve
    points = []
    for x in range(200, 1000, 5):
        t = (x - 200) / 800
        # Exponential growth curve
        y_val = 450 - 300 * (1 - math.exp(-3 * t))
        y_val += 20 * math.sin(t * 8)  # slight oscillation
        points.append((x, int(y_val)))

    # Draw area under curve
    area_points = [(200, 480)] + points + [(1000, 480)]
    for i in range(len(area_points) - 1):
        x1, y1 = area_points[i]
        x2, y2 = area_points[i+1]
        t = i / len(area_points)
        color = (int(59*(1-t*0.5)), int(130 + 81*t), int(246 - 70*t))
        draw.rectangle([x1, y1, x2+1, 480], fill=(*color, 40))

    # Draw curve line
    for i in range(len(points) - 1):
        t = i / len(points)
        color = (int(59*(1-t*0.3) + 34*t*0.3), int(130*(1-t) + 211*t), int(246*(1-t) + 238*t))
        draw.line([points[i], points[i+1]], fill=color, width=4)

    # Glow dots at key points
    for idx in [0, len(points)//3, 2*len(points)//3, len(points)-1]:
        x, y = points[idx]
        for r in range(15, 0, -1):
            a = int(150 * (1 - r/15))
            draw.ellipse([x-r, y-r, x+r, y+r], fill=(52, 211, 153, a))

    # Metric boxes
    metrics = [
        ("+340%", "E-commerce", (52, 211, 153)),
        ("-72%", "tiempo manual", (34, 211, 238)),
        ("+200%", "capacidad", (139, 92, 246)),
    ]

    for i, (val, label, color) in enumerate(metrics):
        x = 250 + i * 280
        y = 520
        for r in range(35, 0, -1):
            a = int(20 * (1 - r/35))
            draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
        draw.ellipse([x-25, y-25, x+25, y+25], fill=(*color, 180))

    img.save(f"{OUTPUT}/results.jpg", quality=90)
    print(f"✅ Results: {OUTPUT}/results.jpg")

create_results_img()

# ============================================================
# 7. LOGO SVG FULL (with text) — For nav/header
# ============================================================
LOGO_FULL_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 48">
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="50%" style="stop-color:#22D3EE"/>
      <stop offset="100%" style="stop-color:#34D399"/>
    </linearGradient>
  </defs>
  <!-- Logo mark -->
  <circle cx="24" cy="24" r="20" fill="none" stroke="url(#lg)" stroke-width="1.5" opacity="0.4"/>
  <circle cx="24" cy="14" r="4" fill="#3B82F6" opacity="0.9"/>
  <circle cx="32" cy="20" r="3.5" fill="#22D3EE" opacity="0.9"/>
  <circle cx="34" cy="30" r="3" fill="#34D399" opacity="0.9"/>
  <circle cx="24" cy="34" r="3.5" fill="#8B5CF6" opacity="0.9"/>
  <circle cx="16" cy="30" r="3" fill="#22D3EE" opacity="0.9"/>
  <circle cx="14" cy="20" r="3" fill="#34D399" opacity="0.9"/>
  <circle cx="24" cy="24" r="5" fill="url(#lg)"/>
  <circle cx="24" cy="24" r="2.5" fill="#0B0F19"/>
  <!-- Connections -->
  <line x1="24" y1="19.5" x2="24" y2="10" stroke="#3B82F6" stroke-width="1.5" opacity="0.7"/>
  <line x1="27" y1="22" x2="30" y2="18" stroke="#22D3EE" stroke-width="1.2" opacity="0.6"/>
  <line x1="26" y1="26" x2="32" y2="29" stroke="#34D399" stroke-width="1.2" opacity="0.6"/>
  <line x1="24" y1="29" x2="24" y2="31" stroke="#8B5CF6" stroke-width="1.2" opacity="0.6"/>
  <line x1="21" y1="26" x2="16" y2="29" stroke="#22D3EE" stroke-width="1.2" opacity="0.6"/>
  <line x1="21" y1="22" x2="14" y2="20" stroke="#34D399" stroke-width="1" opacity="0.5"/>
  <!-- Text -->
  <text x="56" y="30" font-family="Inter, -apple-system, sans-serif" font-size="20" font-weight="800" fill="url(#lg)">PulsoHQ</text>
</svg>'''

with open(f"{OUTPUT}/logo-full.svg", "w") as f:
    f.write(LOGO_FULL_SVG)
print(f"✅ Logo Full SVG: {OUTPUT}/logo-full.svg")

# ============================================================
# 8. LOGO DARK / LIGHT variants PNG
# ============================================================
def create_logo_pngs():
    """Create PNG versions of the logo for different backgrounds"""
    # Dark background logo (white/light colors)
    for bg_name, bg_color in [("dark", (11, 15, 25)), ("light", (255, 255, 255)), ("blue", (15, 23, 42))]:
        size = 512
        img = Image.new("RGBA", (size, size), (*bg_color, 255))
        draw = ImageDraw.Draw(img)
        cx, cy = size // 2, size // 2

        R = bg_color[0]
        G = bg_color[1]
        B = bg_color[2]
        L = 0.299*R + 0.587*G + 0.114*B
        is_dark = L < 128
        primary = (59, 130, 246) if is_dark else (29, 78, 216)
        secondary = (34, 211, 238) if is_dark else (6, 148, 162)
        accent = (52, 211, 153) if is_dark else (5, 150, 105)
        violet = (139, 92, 246) if is_dark else (109, 40, 217)

        draw.ellipse([cx-200, cy-200, cx+200, cy+200], outline=(*primary, 60), width=3)
        draw.ellipse([cx-160, cy-160, cx+160, cy+160], outline=(*secondary, 40), width=2)

        nodes = [
            (cx, cy-110, 18, primary), (cx+96, cy-52, 16, secondary),
            (cx+118, cy+54, 14, accent), (cx+52, cy+120, 16, violet),
            (cx-54, cy+112, 14, primary), (cx-122, cy+42, 16, secondary),
            (cx-112, cy-64, 15, accent),
        ]

        for nx, ny, nr, nc in nodes:
            draw.line([(cx, cy), (nx, ny)], fill=(*nc, 80), width=2)

        for nx, ny, nr, nc in nodes:
            for i in range(10, 0, -1):
                a = int(25 * (1 - i/10))
                draw.ellipse([nx-nr-i*2, ny-nr-i*2, nx+nr+i*2, ny+nr+i*2], fill=(*[int(c*0.3) for c in nc], a))
            draw.ellipse([nx-nr, ny-nr, nx+nr, ny+nr], fill=(*nc, 230))

        for i in range(35, 0, -1):
            t = i / 35
            c = (int(59*(1-t*0.5) + 34*t*0.5), int(130*(1-t*0.5) + 211*t*0.5), int(246*(1-t*0.5) + 238*t*0.5))
            draw.ellipse([cx-i, cy-i, cx+i, cy+i], fill=(*c, int(200*(1-t*t))))
        draw.ellipse([cx-28, cy-28, cx+28, cy+28], fill=(*bg_color, 255))
        draw.ellipse([cx-18, cy-18, cx+18, cy+18], fill=(*primary, 220))
        draw.ellipse([cx-8, cy-8, cx+8, cy+8], fill=(*secondary, 255))

        # Save as PNG
        img_rgb = img.convert("RGB")
        img_rgb.save(f"{OUTPUT}/logo-{bg_name}.png")
        print(f"✅ Logo {bg_name}: {OUTPUT}/logo-{bg_name}.png")

create_logo_pngs()

# ============================================================
# Summary
# ============================================================
print("\n" + "="*50)
print("ALL ASSETS GENERATED")
print("="*50)
import glob
for f in sorted(glob.glob(f"{OUTPUT}/*")):
    sz = os.path.getsize(f)
    print(f"  {os.path.basename(f):30s} {sz//1024:>6} KB")
