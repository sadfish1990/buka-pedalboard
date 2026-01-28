from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BRASS = (180, 140, 60)
DARK_BRASS = (100, 70, 20)
COPPER = (184, 115, 51)
BLACK = (20, 20, 20)
GLOW_ORANGE = (255, 140, 40)
GLASS_GREY = (50, 50, 60)

def create_tube_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Background texture (Industrial Mesh mostly black)
    for i in range(0, WIDTH, 20):
        draw.line([(i, 0), (i, HEIGHT)], fill=(40, 40, 40), width=1)
    for i in range(0, HEIGHT, 20):
        draw.line([(0, i), (WIDTH, i)], fill=(40, 40, 40), width=1)
        
    # Main Chassis (Brass Plate)
    margin = 40
    draw.rectangle([margin, margin, WIDTH-margin, HEIGHT-margin], fill=BRASS, outline=COPPER, width=10)
    
    # Screws
    screw_offset = 60
    for x in [screw_offset, WIDTH-screw_offset]:
        for y in [screw_offset, HEIGHT-screw_offset]:
            draw.ellipse([x-10, y-10, x+10, y+10], fill=COPPER, outline=BLACK, width=2)
            draw.line([x-6, y, x+6, y], fill=BLACK, width=2)
            
    # Tube Window (Center Feature)
    center_x, center_y = 256, 180
    radius = 100
    draw.ellipse([center_x-radius, center_y-radius, center_x+radius, center_y+radius], fill=GLASS_GREY, outline=COPPER, width=8)
    
    # Glowing Filament
    draw.line([center_x, center_y-60, center_x, center_y+60], fill=GLOW_ORANGE, width=6)
    draw.line([center_x-20, center_y+60, center_x+20, center_y+60], fill=GLOW_ORANGE, width=6)
    
    # Title
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    except:
        font = None
        
    draw.text((256, 330), "TubeWarmth", fill=BLACK, anchor="mm", font=font)
    
    # Knobs (Bottom)
    knob_y = 420
    # Gain, Bias, Vol
    for i, x in enumerate([140, 256, 372]):
        draw.ellipse([x-35, knob_y-35, x+35, knob_y+35], fill=BLACK, outline=COPPER, width=3)
        draw.line([x, knob_y, x, knob_y-30], fill=BRASS, width=4)

    img.save(path)
    print(f"TubeWarmth icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_tube_icon(sys.argv[1])
