from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
WHITE = (245, 245, 240)
BLACK = (20, 20, 20)
RED = (200, 30, 30)
BLUE = (30, 60, 200)
GREY = (180, 180, 180)

def create_ocd_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), WHITE)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=GREY, width=2)
    
    # "FullDrive" Text (OCD Style font is comic sans-ish or hand written)
    try:
        # Using a standard font but simulating the look
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        font_large = None
        font_small = None
        
    draw.text((256, 120), "FullDrive", fill=BLACK, anchor="mm", font=font_large)
    
    # 3 Knobs Layout: Volume, Drive, Tone
    knob_y = 280
    positions = [120, 256, 392]
    labels = ["VOL", "DRIVE", "TONE"]
    
    for i, x in enumerate(positions):
        # Cream/Black knob
        draw.ellipse([x-45, knob_y-45, x+45, knob_y+45], fill=BLACK, outline=GREY, width=2)
        # Pointer
        draw.line([x, knob_y, x, knob_y-40], fill=WHITE, width=4)
        
        if font_small:
            draw.text((x, knob_y + 60), labels[i], fill=BLACK, anchor="mm", font=font_small)

    # HP/LP Switch (Mini toggle between Drive and Tone usually)
    switch_x = 256
    switch_y = 180
    draw.rectangle([switch_x-10, switch_y, switch_x+10, switch_y+30], fill=GREY, outline=BLACK)
    draw.line([switch_x, switch_y+15, switch_x+15, switch_y+5], fill=BLACK, width=2) # Random toggle position
    draw.text((switch_x+30, switch_y+5), "HP", fill=RED, font=font_small)
    draw.text((switch_x+30, switch_y+25), "LP", fill=BLUE, font=font_small)

    # Footswitch
    draw.ellipse([226, 430, 286, 490], fill=GREY, outline=BLACK, width=4)
    
    img.save(path)
    print(f"FullDrive icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_ocd_icon(sys.argv[1])
