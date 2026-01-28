from PIL import Image, ImageDraw, ImageFont
import sys
import random

def create_fancy_icon(path, text, color_theme="gray"):
    WIDTH, HEIGHT = 512, 512
    
    # Theme Colors (Base, Highlight, Accent)
    themes = {
        "red": ((40, 0, 0), (200, 50, 50), (255, 0, 0)),
        "blue": ((0, 0, 40), (50, 50, 200), (0, 100, 255)),
        "green": ((0, 40, 0), (50, 200, 50), (0, 255, 0)),
        "orange": ((60, 30, 0), (200, 100, 0), (255, 165, 0)),
        "black": ((10, 10, 10), (60, 60, 60), (200, 200, 200)),
        "white": ((200, 200, 200), (240, 240, 240), (20, 20, 20)),
        "gold": ((100, 80, 20), (220, 180, 50), (255, 215, 0)),
    }
    
    base_col, body_col, accent_col = themes.get(color_theme, themes["black"])
    
    img = Image.new('RGB', (WIDTH, HEIGHT), (20, 20, 20))
    draw = ImageDraw.Draw(img)
    
    # 1. Body (Rounded with border)
    margin = 20
    draw.rounded_rectangle([margin, margin, WIDTH-margin, HEIGHT-margin], radius=30, fill=body_col, outline=(100,100,100), width=4)
    
    # 2. Rivets (Corners)
    rivet_offset = 40
    for x in [rivet_offset+margin, WIDTH-rivet_offset-margin]:
        for y in [rivet_offset+margin, HEIGHT-rivet_offset-margin]:
            draw.ellipse([x-10, y-10, x+10, y+10], fill=(180,180,180), outline=(50,50,50), width=2)

    # 3. Label Plate
    plate_y = 100
    draw.rectangle([60, plate_y, WIDTH-60, plate_y+100], fill=(10,10,10), outline=(50,50,50), width=3)
    
    # Text
    try:
        font_size = 60 if len(text) < 10 else 40
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = None
        
    draw.text((WIDTH/2, plate_y+50), text, fill=accent_col, font=font, anchor="mm")

    # 4. Knobs (Abstract 3 knobs)
    knob_y = 350
    for i, offset in enumerate([-120, 0, 120]):
        cx = WIDTH/2 + offset
        r = 40
        # Shadow
        draw.ellipse([cx-r+5, knob_y-r+5, cx+r+5, knob_y+r+5], fill=(0,0,0,100))
        # Knob Body
        draw.ellipse([cx-r, knob_y-r, cx+r, knob_y+r], fill=(30,30,30), outline=(200,200,200), width=2)
        # Indicator
        angle = random.randint(-135, 135)
        import math
        ex = cx + math.sin(math.radians(angle)) * r
        ey = knob_y - math.cos(math.radians(angle)) * r
        draw.line([cx, knob_y, ex, ey], fill=accent_col, width=4)

    # 5. Footswitch
    switch_y = 450
    draw.ellipse([WIDTH/2-20, switch_y-20, WIDTH/2+20, switch_y+20], fill=(150,150,150), outline=(50,50,50), width=4)

    img.save(path)
    print(f"Saved fancy icon to {path}")

if __name__ == '__main__':
    create_fancy_icon(sys.argv[1], sys.argv[2], sys.argv[3])
