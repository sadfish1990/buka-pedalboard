from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
GREEN = (34, 139, 34)
DARK_GREEN = (20, 80, 20)
BLACK = (20, 20, 20)
WHITE = (255, 255, 255)

def create_delay_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), GREEN)
    draw = ImageDraw.Draw(img)
    
    # Green gradient
    for y in range(HEIGHT):
        shade_g = int(139 - (y / HEIGHT) * 40)
        color = (34, shade_g, 34)
        draw.line([(0, y), (WIDTH, y)], fill=color)
    
    # Border
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=DARK_GREEN, width=8)
    
    # Logo area
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font_large = None
        font_small = None
    
    draw.text((256, 100), "ANALOG", fill=WHITE, anchor="mm", font=font_large)
    draw.text((256, 140), "DELAY", fill=WHITE, anchor="mm", font=font_large)
    
    # Four knobs
    knob_y = 280
    knob_positions = [100, 190, 322, 412]
    
    for x in knob_positions:
        # Knob body
        draw.ellipse([x-25, knob_y-25, x+25, knob_y+25], 
                     fill=BLACK, outline=WHITE, width=2)
        # Indicator
        draw.line([x, knob_y-18, x, knob_y], fill=WHITE, width=3)
    
    # Mod switch
    draw.rectangle([216, 380, 296, 410], fill=BLACK, outline=WHITE, width=2)
    
    # Footswitch
    draw.ellipse([226, 440, 286, 500], fill=BLACK, outline=DARK_GREEN, width=3)
    
    img.save(path)
    print(f"AnalogDelay icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_delay_icon(sys.argv[1])
