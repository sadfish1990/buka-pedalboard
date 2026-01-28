from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
DARK_GREY = (40, 40, 45)
BLACK = (10, 10, 10)
BLUE_LED = (0, 200, 255)
WHITE = (220, 220, 220)

def create_modern_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), DARK_GREY)
    draw = ImageDraw.Draw(img)
    
    # Faceplate Details (Brushed Metal look simulated by noise lines?)
    for i in range(0, HEIGHT, 4):
        color = (45, 45, 50) if i % 8 == 0 else (35, 35, 40)
        draw.line([0, i, WIDTH, i], fill=color)
        
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=BLACK, width=10)
    
    # Logo
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
        
    draw.text((256, 120), "MODERN", fill=WHITE, anchor="mm", font=font)
    draw.text((256, 180), "BASS SYSTEMS", fill=BLUE_LED, anchor="mm", font=font_sm)
    
    # EQ Sliders / Knobs Graphic
    # Let's draw 4 illuminated circles (EQ bands)
    
    y_knobs = 350
    spacing = 100
    start_x = 106
    
    for i in range(4):
        x = start_x + (i * spacing)
        # Ring Light
        draw.ellipse([x-35, y_knobs-35, x+35, y_knobs+35], outline=BLUE_LED, width=3)
        # Knob Body
        draw.ellipse([x-30, y_knobs-30, x+30, y_knobs+30], fill=BLACK)
        # Line
        draw.line([x, y_knobs, x, y_knobs-25], fill=WHITE, width=4)

    img.save(path)
    print(f"ModernBass icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_modern_icon(sys.argv[1])
