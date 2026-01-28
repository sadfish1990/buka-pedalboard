from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
GOLD = (210, 180, 100)
BLACK = (20, 20, 20)
WHITE = (240, 240, 240)

def create_brit_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Gold Faceplate
    draw.rectangle([0, 0, WIDTH, 200], fill=GOLD)
    
    # White Piping
    draw.line([0, 205, WIDTH, 205], fill=WHITE, width=4)
    
    # Logo (White Script)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf", 90)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
        
    draw.text((256, 90), "Marshall", fill=WHITE, anchor="mm", font=font)
    draw.text((256, 160), "JCM 800 LEAD SERIES", fill=BLACK, anchor="mm", font=font_sm)
    
    # Knobs (Black with Gold Cap)
    spacing = 70
    start_x = 80
    y = 350
    
    for i in range(6):
        x = start_x + (i * spacing)
        # Knob
        draw.ellipse([x-30, y-30, x+30, y+30], fill=BLACK)
        # Gold Cap
        draw.ellipse([x-20, y-20, x+20, y+20], fill=GOLD)
        # Line
        draw.line([x, y-20, x, y-30], fill=BLACK, width=2)

    img.save(path)
    print(f"Brit800 icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_brit_icon(sys.argv[1])
