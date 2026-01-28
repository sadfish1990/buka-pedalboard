from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
SILVER = (200, 200, 200)
BLACK = (20, 20, 20)
BLUE = (50, 100, 200)
WHITE = (255, 255, 255)

def create_synth_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), SILVER)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=BLACK, width=5)
    
    # Title Block
    draw.rectangle([10, 400, WIDTH-10, 500], fill=BLACK)
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 55)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
        
    draw.text((256, 450), "BassSynth", fill=WHITE, anchor="mm", font=font)
    
    # Sliders Graphics (10 Sliders typically, simplify to 8 or 7)
    # Voices: Sub, Gtr, Oct, Sqr (4)
    # Filter: Res, Start, Stop, Rate (4)
    
    spacing = 45
    start_x = 70
    start_y = 50
    track_h = 250
    
    # Colors for caps
    voice_color = BLACK
    filter_color = BLUE
    
    for i in range(8):
        x = start_x + (i * spacing)
        # Track
        draw.line([x, start_y, x, start_y+track_h], fill=BLACK, width=4)
        
        # Cap
        import random
        val = random.random()
        cap_y = start_y + track_h - (val * track_h)
        
        color = voice_color if i < 4 else filter_color
        draw.rectangle([x-15, cap_y-10, x+15, cap_y+10], fill=color)
        draw.line([x-15, cap_y, x+15, cap_y], fill=WHITE, width=2)

    img.save(path)
    print(f"BassSynth icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_synth_icon(sys.argv[1])
