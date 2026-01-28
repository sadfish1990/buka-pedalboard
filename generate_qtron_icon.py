from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
YELLOW = (255, 200, 0)
DARK_YELLOW = (200, 150, 0)
BLACK = (20, 20, 20)
WHITE = (255, 255, 255)

def create_qtron_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), YELLOW)
    draw = ImageDraw.Draw(img)
    
    # Yellow/orange gradient
    for y in range(HEIGHT):
        shade = int(255 - (y / HEIGHT) * 55)
        color = (shade, int(200 - (y / HEIGHT) * 50), 0)
        draw.line([(0, y), (WIDTH, y)], fill=color)
    
    # Border
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=DARK_YELLOW, width=8)
    
    # Logo
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        font_large = None
        font_small = None
    
    draw.text((256, 80), "MXR", fill=BLACK, anchor="mm", font=font_small)
    draw.text((256, 130), "Q-TRON", fill=BLACK, anchor="mm", font=font_large)
    draw.text((256, 170), "ENVELOPE FILTER", fill=BLACK, anchor="mm", font=font_small)
    
    # Four knobs
    knob_y = 280
    knob_positions = [100, 190, 322, 412]
    
    for x in knob_positions:
        draw.ellipse([x-25, knob_y-25, x+25, knob_y+25], 
                     fill=BLACK, outline=WHITE, width=2)
        draw.line([x, knob_y-18, x, knob_y], fill=YELLOW, width=3)
    
    # Mode switch
    draw.rectangle([216, 380, 296, 410], fill=BLACK, outline=WHITE, width=2)
    
    # Footswitch
    draw.ellipse([226, 440, 286, 500], fill=BLACK, outline=DARK_YELLOW, width=3)
    
    img.save(path)
    print(f"QTron icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_qtron_icon(sys.argv[1])
