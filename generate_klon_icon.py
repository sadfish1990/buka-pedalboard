from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
GOLD = (218, 165, 32)
DARK_GOLD = (184, 134, 11)
WHITE = (255, 255, 255)
BLACK = (20, 20, 20)

def create_klon_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), GOLD)
    draw = ImageDraw.Draw(img)
    
    # Gold enclosure with gradient effect
    for y in range(HEIGHT):
        shade = int(GOLD[0] - (y / HEIGHT) * 30)
        color = (shade, int(GOLD[1] - (y / HEIGHT) * 20), GOLD[2])
        draw.line([(0, y), (WIDTH, y)], fill=color)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=DARK_GOLD, width=8)
    
    # Horse head silhouette (simplified)
    horse_points = [
        (256, 150),  # Top of head
        (280, 180),  # Ear
        (290, 220),  # Back of head
        (280, 260),  # Neck
        (250, 280),  # Throat
        (220, 260),  # Jaw
        (210, 220),  # Nose
        (230, 180),  # Forehead
    ]
    draw.polygon(horse_points, fill=DARK_GOLD, outline=BLACK)
    
    # Three white knobs
    knob_y = 350
    knob_positions = [140, 256, 372]
    
    for x in knob_positions:
        # Knob body
        draw.ellipse([x-30, knob_y-30, x+30, knob_y+30], fill=WHITE, outline=BLACK, width=2)
        # Indicator line
        draw.line([x, knob_y-20, x, knob_y], fill=BLACK, width=4)
    
    # Labels
    try:
        # Try to use a font, fallback to default
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except:
        font = None
    
    draw.text((256, 450), "CENTAUR", fill=BLACK, anchor="mm", font=font)
    
    img.save(path)
    print(f"GoldenHorse icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_klon_icon(sys.argv[1])
