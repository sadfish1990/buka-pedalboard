from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (20, 20, 20)
DARK_GREY = (40, 40, 40)
RED = (200, 0, 0)
WHITE = (240, 240, 240)

def create_rat_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Black enclosure
    draw.rectangle([20, 20, WIDTH-20, HEIGHT-20], fill=BLACK, outline=DARK_GREY, width=6)
    
    # Rat silhouette (simplified)
    # Body
    draw.ellipse([180, 200, 332, 280], fill=DARK_GREY)
    # Head
    draw.ellipse([200, 160, 280, 220], fill=DARK_GREY)
    # Ears
    draw.ellipse([210, 150, 230, 170], fill=DARK_GREY)
    draw.ellipse([250, 150, 270, 170], fill=DARK_GREY)
    # Tail
    points = [(320, 240), (380, 260), (420, 240)]
    draw.line(points, fill=DARK_GREY, width=8)
    
    # Red LED
    draw.ellipse([240, 120, 272, 152], fill=RED, outline=WHITE, width=2)
    draw.ellipse([248, 128, 264, 144], fill=(255, 100, 100))  # Glow
    
    # Three black knobs
    knob_y = 350
    knob_positions = [140, 256, 372]
    
    for x in knob_positions:
        # Knob body
        draw.ellipse([x-25, knob_y-25, x+25, knob_y+25], 
                     fill=DARK_GREY, outline=WHITE, width=2)
        # Indicator line
        draw.line([x, knob_y-18, x, knob_y], fill=WHITE, width=3)
    
    # Logo
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    except:
        font = None
    
    draw.text((256, 450), "RAT", fill=WHITE, anchor="mm", font=font)
    
    img.save(path)
    print(f"RatClone icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_rat_icon(sys.argv[1])
