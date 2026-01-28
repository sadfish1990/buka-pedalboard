from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
GREY = (60, 60, 60)
DARK_GREY = (30, 30, 30)
ORANGE = (255, 100, 0)
BLACK = (20, 20, 20)
WHITE = (230, 230, 230)

def create_mt2_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), GREY)
    draw = ImageDraw.Draw(img)
    
    # Grey Metallic Gradient
    for y in range(HEIGHT):
        shade = int(60 - (y / HEIGHT) * 20)
        color = (shade, shade, shade)
        draw.line([(0, y), (WIDTH, y)], fill=color)
    
    # Border
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=DARK_GREY, width=8)
    
    # BOSS logo area
    draw.rectangle([180, 70, 332, 130], fill=BLACK)
    
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        font_tiny = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except:
        font_large = None
        font_small = None
        font_tiny = None
    
    # BOSS text
    draw.text((256, 100), "BOSS", fill=WHITE, anchor="mm", font=font_large)
    
    # MT-2 Label
    draw.text((256, 160), "MT-2", fill=BLACK, anchor="mm", font=font_large)
    draw.text((256, 190), "Metal Zone", fill=ORANGE, anchor="mm", font=font_small)
    
    # Knobs (4 positions, dual concentric simulation)
    # MT-2 has 4 knob positions, 3 of them are dual concentric. We'll simplify to 4 visuals.
    knob_y = 300
    knob_positions = [80, 190, 322, 432]
    
    labels = ["LEVEL", "EQ H/L", "EQ MID", "DIST"]
    
    for i, x in enumerate(knob_positions):
        # Knob body
        draw.ellipse([x-25, knob_y-25, x+25, knob_y+25], 
                     fill=BLACK, outline=GREY, width=2)
        # Top cap (simulate concentric inner knob)
        draw.ellipse([x-15, knob_y-15, x+15, knob_y+15], 
                     fill=DARK_GREY, outline=GREY, width=1)
        # Indicator
        draw.line([x, knob_y-12, x, knob_y], fill=ORANGE, width=2)
        
        # Label
        if font_tiny:
            draw.text((x, 340), labels[i], fill=BLACK, anchor="mm", font=font_tiny)
    
    # Footswitch
    draw.ellipse([226, 420, 286, 480], fill=BLACK, outline=DARK_GREY, width=3)
    
    img.save(path)
    print(f"MetalZone icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_mt2_icon(sys.argv[1])
