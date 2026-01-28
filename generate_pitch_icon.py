from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
RED = (200, 20, 20)
BLACK = (10, 10, 10)
WHITE = (240, 240, 240)

def create_pitch_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), RED)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=BLACK, width=4)
    
    # Graphic: Pitch Curve
    draw.line([50, 400, 256, 100, 462, 400], fill=WHITE, width=5)
    draw.ellipse([236, 80, 276, 120], fill=BLACK) # Top point
    
    # Text
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 55)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
        
    draw.text((256, 450), "PITCH SHIFTER", fill=BLACK, anchor="mm", font=font_sm)
    draw.text((256, 60), "HARMONIZER", fill=WHITE, anchor="mm", font=font_sm)
    
    # Knobs
    # Pitch (Big Center), Mix (Small Side)
    
    # Big Pitch Knob
    cx, cy = 256, 250
    r = 90
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=BLACK, outline=WHITE, width=2)
    # Marks around
    for i in range(12):
        import math
        angle = i * (360/12)
        rad = math.radians(angle)
        x1 = cx + math.cos(rad) * (r + 10)
        y1 = cy + math.sin(rad) * (r + 10)
        x2 = cx + math.cos(rad) * (r + 25)
        y2 = cy + math.sin(rad) * (r + 25)
        draw.line([x1, y1, x2, y2], fill=BLACK, width=3)

    img.save(path)
    print(f"PitchShifter GUI saved to {path}")

if __name__ == '__main__':
    import sys
    create_pitch_icon(sys.argv[1])
