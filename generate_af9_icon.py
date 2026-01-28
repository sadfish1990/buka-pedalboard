from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
PURPLE = (128, 0, 128)
DARK_PURPLE = (80, 0, 80)
BLACK = (20, 20, 20)
WHITE = (230, 230, 230)
GREY = (100, 100, 100)

def create_af9_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), PURPLE)
    draw = ImageDraw.Draw(img)
    
    # Purple Gradient
    for y in range(HEIGHT):
        shade_r = int(128 - (y / HEIGHT) * 40)
        shade_b = int(128 - (y / HEIGHT) * 40)
        color = (shade_r, 0, shade_b)
        draw.line([(0, y), (WIDTH, y)], fill=color)
    
    # Border
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=DARK_PURPLE, width=8)
    
    # Logo
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        font_large = None
        font_small = None
    
    draw.text((256, 80), "MAXON", fill=WHITE, anchor="mm", font=font_small)
    draw.text((256, 120), "Auto Filter", fill=WHITE, anchor="mm", font=font_large)
    
    # Sliders Area (The signature feature)
    # 2 Vertical Sliders
    slider_y_start = 200
    slider_h = 180
    slider_w = 40
    
    # Slider 1: Sens
    x1 = 180
    draw.rectangle([x1-5, slider_y_start, x1+5, slider_y_start+slider_h], fill=BLACK) # Track
    draw.rectangle([x1-20, slider_y_start+80, x1+20, slider_y_start+100], fill=WHITE, outline=BLACK) # Cap
    draw.text((x1, slider_y_start + slider_h + 30), "SENS", fill=WHITE, anchor="mm", font=font_small)

    # Slider 2: Peak
    x2 = 332
    draw.rectangle([x2-5, slider_y_start, x2+5, slider_y_start+slider_h], fill=BLACK) # Track
    draw.rectangle([x2-20, slider_y_start+40, x2+20, slider_y_start+60], fill=WHITE, outline=BLACK) # Cap
    draw.text((x2, slider_y_start + slider_h + 30), "PEAK", fill=WHITE, anchor="mm", font=font_small)
    
    # Footswitch
    draw.ellipse([226, 450, 286, 510], fill=BLACK, outline=GREY, width=3)
    
    img.save(path)
    print(f"AutoFunk icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_af9_icon(sys.argv[1])
