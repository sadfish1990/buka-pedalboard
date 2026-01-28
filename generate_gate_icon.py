from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (20, 20, 20)
DARK_GREY = (40, 40, 40)
RED = (200, 0, 0)
WHITE = (240, 240, 240)

def create_gate_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Black enclosure
    draw.rectangle([20, 20, WIDTH-20, HEIGHT-20], fill=BLACK, outline=DARK_GREY, width=6)
    
    # ISP logo area
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        font_large = None
        font_small = None
    
    draw.text((256, 100), "ISP", fill=WHITE, anchor="mm", font=font_large)
    draw.text((256, 150), "DECIMATOR", fill=RED, anchor="mm", font=font_large)
    
    # Single large knob
    knob_x, knob_y = 256, 280
    draw.ellipse([knob_x-40, knob_y-40, knob_x+40, knob_y+40], 
                 fill=DARK_GREY, outline=WHITE, width=3)
    # Indicator
    draw.line([knob_x, knob_y-30, knob_x, knob_y], fill=RED, width=4)
    
    # Label
    draw.text((256, 350), "THRESHOLD", fill=WHITE, anchor="mm", font=font_small)
    
    # Red LED
    draw.ellipse([240, 400, 272, 432], fill=RED, outline=WHITE, width=2)
    
    # Footswitch
    draw.ellipse([226, 450, 286, 510], fill=DARK_GREY, outline=WHITE, width=3)
    
    img.save(path)
    print(f"NoiseKiller icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_gate_icon(sys.argv[1])
