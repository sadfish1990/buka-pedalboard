from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (20, 20, 20)
SILVER = (220, 220, 225)
GRILL_SILVER = (180, 180, 190)
GRILL_BLUE = (100, 100, 150)

def create_bp_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Grill Cloth (Silver with Blue/Turquoise threads)
    draw.rectangle([0, 180, WIDTH, HEIGHT], fill=GRILL_SILVER)
    # Texture
    for i in range(0, WIDTH, 6):
        draw.line([i, 180, i, HEIGHT], fill=(150, 150, 160), width=1)
    
    # Faceplate (Black Top)
    draw.rectangle([0, 0, WIDTH, 180], fill=BLACK)
    draw.line([0, 180, WIDTH, 180], fill=SILVER, width=4) # Trim
    
    # Logo
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_script = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf", 40)
    except:
        font = None
        font_script = None
        
    draw.text((40, 40), "Fender", fill=SILVER, anchor="lt", font=font_script)
    draw.text((256, 100), "TWIN REVERB", fill=SILVER, anchor="mm", font=font)
    
    # Knobs (Skirted style - approximated)
    # Draw 4 knobs
    spacing = 100
    start_x = 106
    y = 300
    
    # We'll draw them over the grill for visibility in icon
    for i in range(4):
        x = start_x + (i * spacing)
        # Knob Skirt
        draw.ellipse([x-40, y-40, x+40, y+40], fill=BLACK)
        # Numbers on skirt (white dots)
        for j in range(0, 360, 45):
            import math
            angle = math.radians(j)
            dx = math.cos(angle) * 35
            dy = math.sin(angle) * 35
            draw.ellipse([x+dx-2, y+dy-2, x+dx+2, y+dy+2], fill=SILVER)
            
        # Knob Body
        draw.ellipse([x-25, y-25, x+25, y+25], fill=BLACK)
        # Chrome Top
        draw.ellipse([x-15, y-15, x+15, y+15], fill=SILVER)

    img.save(path)
    print(f"BlackPanel icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_bp_icon(sys.argv[1])
