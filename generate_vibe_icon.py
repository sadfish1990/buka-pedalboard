from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
METALLIC_GREY = (80, 80, 85)
DARK_GREY = (40, 40, 45)
BLACK = (10, 10, 10)
WHITE = (240, 240, 240)
RED_INK = (180, 30, 30)

def create_vibe_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), METALLIC_GREY)
    draw = ImageDraw.Draw(img)
    
    # Texture (Noise)
    import random
    for i in range(5000):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        color = random.randint(70, 90)
        draw.point((x,y), fill=(color, color, color))
        
    # Bezel
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=WHITE, width=4)
    
    # Title "Uni-Vibe" style
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 55)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except:
        font_large = None
        font_small = None
        
    draw.text((256, 80), "VibeMachine", fill=BLACK, anchor="mm", font=font_large)
    
    # The Huge Speed Knob (Centerpiece)
    cx, cy = 256, 250
    r = 110
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=BLACK, outline=WHITE, width=2)
    # Knob skirt
    draw.ellipse([cx-r+10, cy-r+10, cx+r-10, cy+r-10], fill=DARK_GREY)
    
    # Intensity and Vol knobs (Smaller, above)
    knob_y = 160
    # Actually UniVibe has Speed and Volume big? 
    # Usually: Volume, Intensity (small) and Speed (big/pedal).
    # Let's do 2 small top, 1 big bottom.
    
    # Indicators
    draw.text((100, 380), "CHORUS", fill=RED_INK, anchor="mm", font=font_small)
    draw.text((412, 380), "VIBRATO", fill=RED_INK, anchor="mm", font=font_small)
    
    # Switch
    sw_x = 256
    sw_y = 420
    draw.rectangle([sw_x-40, sw_y, sw_x+40, sw_y+40], fill=BLACK, outline=WHITE, width=2)
    draw.rectangle([sw_x-30, sw_y+10, sw_x-10, sw_y+30], fill=METALLIC_GREY) # Left pos

    img.save(path)
    print(f"VibeMachine icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_vibe_icon(sys.argv[1])
