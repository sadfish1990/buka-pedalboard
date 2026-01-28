from PIL import Image, ImageDraw

WIDTH, HEIGHT = 512, 512
BG_COLOR = (192, 192, 192) # Silver
PANEL_COLOR = (180, 180, 180) # Slightly darker silver
TEXT_COLOR = (20, 20, 20)

def create_acid_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 1. Main Plastic Body (Silver)
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=BG_COLOR)
    
    # 2. Black Panel Area (Top)
    draw.rectangle([20, 20, WIDTH-20, 200], fill=(40, 40, 40))
    
    # 3. Big Knobs (Black)
    # 6 Knobs: Tuning, Cutoff, Res, Env, Decay, Accent
    knob_y = 110
    start_x = 60
    gap = 75
    
    for i in range(6):
        x = start_x + i * gap
        r = 30
        draw.ellipse([x-r, knob_y-r, x+r, knob_y+r], fill=(10, 10, 10), outline=(200, 200, 200), width=2)
        # Indicator (White line)
        draw.line([x, knob_y, x, knob_y-r+5], fill=(255, 255, 255), width=3)

    # 4. Waveform Switch
    sw_x = 60
    sw_y = 250
    draw.ellipse([sw_x, sw_y, sw_x+20, sw_y+20], fill=(10,10,10))
    draw.text((sw_x+30, sw_y), "WAVE", fill=TEXT_COLOR)

    # 5. Mini Keyboard (Buttons)
    key_y = 350
    key_w = 30
    key_h = 40
    start_k = 40
    
    for i in range(13): # Octave
        x = start_k + i * 35
        color = (240, 240, 240) if i not in [1,3,6,8,10] else (40, 40, 40)
        draw.rectangle([x, key_y, x+key_w, key_y+key_h], fill=color, outline=(0,0,0))

    # 6. Logo
    draw.text((400, 450), "TB-303", fill=(0, 0, 0), font=None) # Default font large if possible, else small

    img.save(path)
    print(f"Acid Icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_acid_icon(sys.argv[1])
