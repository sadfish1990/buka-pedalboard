from PIL import Image, ImageDraw, ImageFont
import sys
import random

def create_icon(path, text, color_theme="gray"):
    WIDTH, HEIGHT = 512, 512
    
    # Colors
    colors = {
        "red": ((100, 20, 20), (200, 50, 50)),
        "blue": ((20, 20, 100), (50, 50, 200)),
        "green": ((20, 100, 20), (50, 200, 50)),
        "orange": ((100, 60, 20), (200, 120, 50)),
        "purple": ((80, 20, 100), (160, 50, 200)),
        "gray": ((40, 40, 40), (120, 120, 120)),
        "black": ((10, 10, 10), (80, 80, 80)),
        "gold": ((120, 100, 20), (220, 200, 50))
    }
    
    base, highlight = colors.get(color_theme, colors["gray"])
    
    img = Image.new('RGB', (WIDTH, HEIGHT), base)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=highlight, width=10)
    
    # Inner Box
    draw.rectangle([40, 100, WIDTH-40, HEIGHT-100], fill=(20, 20, 20), outline=highlight, width=4)
    
    # Text
    try:
        # Try to fit text
        fontsize = 80
        if len(text) > 10: fontsize = 60
        if len(text) > 15: fontsize = 40
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", fontsize)
    except:
        font = None
        
    # Draw Text Centered
    # Pillow 9.x anchoring
    draw.text((WIDTH/2, HEIGHT/2), text, fill=highlight, font=font, anchor="mm", align="center")
    
    # Fake Knobs
    knob_y = 400
    for i in [-100, 0, 100]:
        x = WIDTH/2 + i
        r = 25
        draw.ellipse([x-r, knob_y-r, x+r, knob_y+r], fill=base, outline=(200,200,200), width=2)
        draw.line([x, knob_y, x, knob_y-r], fill=(255,255,255), width=2)

    img.save(path)
    print(f"Generated {path} with label '{text}'")

if __name__ == '__main__':
    # Usage: python3 generate_simple_icon.py path "Label" color
    path = sys.argv[1]
    label = sys.argv[2]
    color = sys.argv[3] if len(sys.argv) > 3 else "gray"
    create_icon(path, label, color)
