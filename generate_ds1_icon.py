from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
ORANGE = (255, 140, 0)
DARK_ORANGE = (200, 100, 0)
BLACK = (20, 20, 20)
WHITE = (255, 255, 255)

def create_ds1_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), ORANGE)
    draw = ImageDraw.Draw(img)
    
    # Orange gradient
    for y in range(HEIGHT):
        shade = int(255 - (y / HEIGHT) * 50)
        color = (shade, int(140 - (y / HEIGHT) * 30), 0)
        draw.line([(0, y), (WIDTH, y)], fill=color)
    
    # Border
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=DARK_ORANGE, width=8)
    
    # BOSS logo area (black rectangle)
    draw.rectangle([180, 80, 332, 140], fill=BLACK)
    
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font_large = None
        font_small = None
    
    # BOSS text
    draw.text((256, 110), "BOSS", fill=WHITE, anchor="mm", font=font_large)
    
    # DS-1 label
    draw.text((256, 180), "DS-1", fill=BLACK, anchor="mm", font=font_large)
    draw.text((256, 210), "DISTORTION", fill=BLACK, anchor="mm", font=font_small)
    
    # Three black knobs
    knob_y = 320
    knob_positions = [140, 256, 372]
    
    for x in knob_positions:
        # Knob body
        draw.ellipse([x-30, knob_y-30, x+30, knob_y+30], 
                     fill=BLACK, outline=DARK_ORANGE, width=3)
        # Indicator line
        draw.line([x, knob_y-22, x, knob_y], fill=ORANGE, width=4)
    
    # Footswitch area
    draw.ellipse([226, 420, 286, 480], fill=BLACK, outline=DARK_ORANGE, width=3)
    
    img.save(path)
    print(f"OrangeDistortion icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_ds1_icon(sys.argv[1])
