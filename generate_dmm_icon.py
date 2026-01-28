from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
SILVER = (220, 220, 225)
BLUE = (0, 50, 150)
RED = (200, 40, 40)
BLACK = (20, 20, 20)

def create_dmm_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), SILVER)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=BLACK, width=4)
    
    # Graphics (Blue/Red stripes usually)
    draw.polygon([(20, 450), (150, 200), (250, 450)], fill=BLUE)
    draw.polygon([(260, 450), (360, 200), (460, 450)], fill=RED)
    
    # Title
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
    
    draw.text((256, 80), "MemoryBrigade", fill=BLACK, anchor="mm", font=font)
    draw.text((256, 130), "ECHO CHORUS VIBRATO", fill=BLACK, anchor="mm", font=font_sm)
    
    # 5 Knobs Layout: Level, Blend, Fdbk, Delay, Depth
    knobs = ["LEVEL", "BLEND", "F.BACK", "DELAY", "DEPTH"]
    y = 350
    spacing = 85
    start_x = 85
    
    for i, label in enumerate(knobs):
        x = start_x + (i * spacing)
        # Knob
        draw.ellipse([x-35, y-35, x+35, y+35], fill=BLACK)
        # Pointer (White)
        draw.line([x, y, x, y-30], fill=(255,255,255), width=3)
        # Label
        draw.text((x, y-55), label, fill=BLACK, anchor="mm", font=font_sm)

    img.save(path)
    print(f"MemoryBrigade icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_dmm_icon(sys.argv[1])
