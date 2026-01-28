from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (10, 10, 10)
DARK_GREY = (30, 30, 30)
YELLOW = (255, 215, 0)
WHITE = (230, 230, 230)

def create_gt2_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Texture/Grain effect (simple noise)
    # Just a solid black box for GT2 look
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=DARK_GREY, width=8)
    
    # Logo area
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        font_tiny = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
    except:
        font_large = None
        font_small = None
        font_tiny = None
    
    draw.text((256, 80), "SANSAMP", fill=YELLOW, anchor="mm", font=font_large)
    draw.text((256, 120), "GT2", fill=WHITE, anchor="mm", font=font_large)
    
    # Switches area (center, 3 switches)
    switch_y = 200
    switch_w, switch_h = 30, 50
    switch_positions = [156, 256, 356]
    labels = ["MIC", "MOD", "AMP"]
    
    for i, x in enumerate(switch_positions):
        # Switch body
        draw.rectangle([x-switch_w, switch_y, x+switch_w, switch_y+switch_h], 
                       fill=DARK_GREY, outline=WHITE, width=2)
        # Handle (middle position)
        draw.rectangle([x-25, switch_y+20, x+25, switch_y+30], fill=BLACK)
        
        # Label
        if font_small:
            draw.text((x, switch_y - 20), labels[i], fill=WHITE, anchor="mm", font=font_small)

    # Knobs (4 knobs below)
    knob_y = 350
    knob_positions = [100, 204, 308, 412]
    knob_labels = ["LEVEL", "HIGH", "LOW", "DRIVE"]
    
    for i, x in enumerate(knob_positions):
        # Knob body
        draw.ellipse([x-30, knob_y-30, x+30, knob_y+30], 
                     fill=BLACK, outline=WHITE, width=2)
        # Indicator
        draw.line([x, knob_y-25, x, knob_y], fill=WHITE, width=3)
        
        if font_small:
            draw.text((x, knob_y + 45), knob_labels[i], fill=WHITE, anchor="mm", font=font_small)
            
    # No footswitch on the icon face usually, but let's add one to be consistent
    draw.ellipse([226, 450, 286, 510], fill=DARK_GREY, outline=WHITE, width=3)
    
    img.save(path)
    print(f"AmpBox icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_gt2_icon(sys.argv[1])
