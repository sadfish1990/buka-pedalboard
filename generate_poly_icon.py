from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
STEEL = (200, 205, 210)
GREEN = (50, 160, 100)
BLACK = (20, 20, 20)
PURPLE = (100, 50, 150)

def create_poly_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), STEEL)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=BLACK, width=4)
    
    # Green Graphic Block
    draw.polygon([(10, 100), (WIDTH-10, 20), (WIDTH-10, 250), (10, 350)], fill=GREEN)
    
    # Title
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 50)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
    
    draw.text((256, 150), "PolyChrome", fill=BLACK, anchor="mm", font=font)
    draw.text((256, 200), "ANALOG FLANGER", fill=BLACK, anchor="mm", font=font_sm)
    
    # Knobs Layout (4 knobs)
    # Width, Rate, Tune, Feedback
    knob_y = 380
    spacing = 110
    start_x = 90
    
    labels = ["WIDTH", "RATE", "TUNE", "FEEDBACK"]
    
    for i, lbl in enumerate(labels):
        x = start_x + (i * spacing)
        # Knob body
        draw.ellipse([x-40, knob_y-40, x+40, knob_y+40], fill=BLACK, outline=STEEL, width=2)
        # Pointer
        draw.line([x, knob_y, x, knob_y-35], fill=STEEL, width=4)
        # Label
        draw.text((x, knob_y-60), lbl, fill=BLACK, anchor="mm", font=font_sm)

    img.save(path)
    print(f"PolyChrome icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_poly_icon(sys.argv[1])
