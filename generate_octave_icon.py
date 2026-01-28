from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLUE = (30, 60, 120)
DARK_BLUE = (15, 30, 60)
SILVER = (200, 200, 210)
BLACK = (20, 20, 20)
WHITE = (240, 240, 240)

def create_octave_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLUE)
    draw = ImageDraw.Draw(img)
    
    # Metallic texture effect (simple gradient)
    for y in range(HEIGHT):
        alpha = int(255 * (1 - (y/HEIGHT) * 0.3))
        draw.line([(0, y), (WIDTH, y)], fill=(30, 60, 120, alpha))
        
    # Border
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=SILVER, width=10)
    
    # Title
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        font_large = None
        font_small = None
        
    draw.text((256, 80), "OctaveGen", fill=WHITE, anchor="mm", font=font_large)
    if font_small:
        draw.text((256, 120), "POLYPHONIC GENERATOR", fill=SILVER, anchor="mm", font=font_small)
        
    # Knobs layout (3 knobs in triangle)
    # OCT -1, OCT +1, DRY
    knob_y = 300
    positions = [128, 256, 384]
    labels = ["OCT -1", "DRY", "OCT +1"]
    
    for i, x in enumerate(positions):
        # Knob Body
        draw.ellipse([x-40, knob_y-40, x+40, knob_y+40], fill=BLACK, outline=SILVER, width=4)
        # Indicator (Octagon shape for "Octave" hint)
        draw.polygon([
            (x-10, knob_y-30), (x+10, knob_y-30),
            (x+30, knob_y-10), (x+30, knob_y+10),
            (x+10, knob_y+30), (x-10, knob_y+30),
            (x-30, knob_y+10), (x-30, knob_y-10)
        ], fill=DARK_BLUE)
        # Line
        draw.line([x, knob_y, x, knob_y-35], fill=WHITE, width=4)
        
        if font_small:
            draw.text((x, knob_y + 60), labels[i], fill=WHITE, anchor="mm", font=font_small)

    # Footswitch area
    draw.ellipse([226, 430, 286, 490], fill=SILVER, outline=BLACK, width=2)
    
    img.save(path)
    print(f"OctaveGen icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_octave_icon(sys.argv[1])
