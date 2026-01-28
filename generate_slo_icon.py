from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
PURPLE = (100, 40, 140)
BLACK = (10, 10, 10)
WHITE = (240, 240, 240)

def create_slo_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Chassis (Purple Tolex Texture)
    # Simple noise or pattern
    draw.rectangle([0, 0, WIDTH, 220], fill=PURPLE)
    for i in range(0, WIDTH, 4):
        draw.line([i, 0, i, 220], fill=(110, 50, 150) if i%8==0 else (90, 30, 130))
        
    # Faceplate (Metal/Black Grille)
    draw.rectangle([0, 220, WIDTH, HEIGHT], fill=(20, 20, 25))
    # Grille pattern
    for i in range(220, HEIGHT, 10):
        draw.line([0, i, WIDTH, i], fill=(40, 40, 45))
        
    # Logo
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 70)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
    except:
        font = None
        font_sm = None
        
    # White Script Logo style
    draw.text((256, 100), "Soldano", fill=WHITE, anchor="mm", font=font)
    draw.text((256, 160), "SUPER LEAD 100", fill=WHITE, anchor="mm", font=font_sm)
    
    # Knobs (White)
    spacing = 70
    start_x = 50
    y = 350
    
    for i in range(7): # Plenty of knobs
        x = start_x + (i * spacing)
        # Knob Body
        draw.ellipse([x-25, y-25, x+25, y+25], fill=WHITE)
        # Indicator
        draw.line([x, y, x, y-20], fill=BLACK, width=3)

    img.save(path)
    print(f"SuperLead icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_slo_icon(sys.argv[1])
