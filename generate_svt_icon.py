from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
SILVER = (200, 200, 205)
BLACK = (20, 20, 20)
GRID = (40, 40, 40)

def create_svt_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Grille Cloth (Crosshatch noise)
    for i in range(0, WIDTH, 8):
        draw.line([i, 200, i, HEIGHT], fill=GRID, width=1)
    for i in range(200, HEIGHT, 8):
        draw.line([0, i, WIDTH, i], fill=GRID, width=1)
        
    # Faceplate (Top)
    draw.rectangle([0, 0, WIDTH, 200], fill=SILVER)
    draw.line([0, 200, WIDTH, 200], fill=(255,255,255), width=2) # Piping
    
    # Logo
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 70)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
        
    draw.text((256, 80), "SVT", fill=BLACK, anchor="mm", font=font)
    draw.text((256, 140), "CLASSIC BASS HEAD", fill=BLACK, anchor="mm", font=font_sm)
    
    # Knobs Mockup
    # Just draw 5 circles
    spacing = 80
    start_x = 96
    y = 250 # On the grille? No, usually knobs are on faceplate.
    # But for icon composition, let's put styling on top.
    
    # Let's draw floating knobs over the grille for visual impact
    for i in range(5):
        x = start_x + (i * spacing)
        # Knob Body
        draw.ellipse([x-30, 350-30, x+30, 350+30], fill=BLACK, outline=SILVER, width=2)
        # Cap
        draw.ellipse([x-25, 350-25, x+25, 350+25], fill=(50,50,50))
        # Line
        draw.line([x, 350, x, 325], fill=SILVER, width=3)

    img.save(path)
    print(f"SVT icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_svt_icon(sys.argv[1])
