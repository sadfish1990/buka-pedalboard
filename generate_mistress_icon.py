from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (10, 10, 10)
BRIGHT_GREEN = (50, 255, 50)
WHITE = (240, 240, 240)

def create_mistress_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=WHITE, width=4)
    
    # Distinctive Green Text/Graphics
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 45)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
    
    draw.text((256, 100), "MistressFlanger", fill=BRIGHT_GREEN, anchor="mm", font=font)
    draw.text((256, 160), "FILTER MATRIX", fill=WHITE, anchor="mm", font=font_sm)
    
    # Knobs Layout: Rate, Range, Color
    # Triangle layout or line
    # Mistress usually has a big "Matrix" switch too? Or mode.
    
    knobs = ["RATE", "RANGE", "COLOR"]
    spacing = 130
    start_x = 126
    y = 300
    
    for i, lbl in enumerate(knobs):
        x = start_x + (i * spacing)
        # Knob
        draw.ellipse([x-40, y-40, x+40, y+40], fill=WHITE)
        draw.line([x, y, x, y-35], fill=BLACK, width=4)
        draw.text((x, y-60), lbl, fill=BRIGHT_GREEN, anchor="mm", font=font_sm)
        
    # Checkbox graphic for Filter Matrix
    draw.rectangle([200, 400, 312, 440], outline=BRIGHT_GREEN, width=2)
    draw.text((256, 420), "MATRIX", fill=BRIGHT_GREEN, anchor="mm", font=font_sm)

    img.save(path)
    print(f"MistressFlanger icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_mistress_icon(sys.argv[1])
