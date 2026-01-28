from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (20, 20, 20)
YELLOW = (255, 215, 0)
WHITE = (240, 240, 240)

def create_bd_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=YELLOW, width=6)
    
    # Title
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 55)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
    
    draw.text((256, 80), "BassDriver", fill=YELLOW, anchor="mm", font=font)
    draw.text((256, 130), "TUBE AMPLIFIER EMULATOR", fill=WHITE, anchor="mm", font=font_sm)
    
    # Knobs Layout: 2 rows of 3? Or 1 row of small, 1 row of big?
    # Standard BDDI has 4 or 6 knobs.
    # Level, Blend, Treble, Bass, Drive, Presence
    
    knobs = [
        ("LEVEL", 100, 250), ("BLEND", 256, 250), ("TREBLE", 412, 250),
        ("BASS", 100, 400), ("DRIVE", 256, 400), ("PRESENCE", 412, 400)
    ]
    
    for lbl, x, y in knobs:
        # Knob Body
        draw.ellipse([x-40, y-40, x+40, y+40], fill=BLACK, outline=YELLOW, width=3)
        # Pointer
        draw.line([x, y, x, y-35], fill=YELLOW, width=4)
        # Label
        draw.text((x, y-60), lbl, fill=YELLOW, anchor="mm", font=font_sm)

    img.save(path)
    print(f"BassDriver icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_bd_icon(sys.argv[1])
