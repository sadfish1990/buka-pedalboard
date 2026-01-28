from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (20, 20, 20)
SILVER = (200, 200, 205)
DIAMOND_DARK = (50, 50, 55)
DIAMOND_LIGHT = (90, 90, 95)

def create_recto_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Diamond Plate Texture
    draw.rectangle([0, 0, WIDTH, 200], fill=SILVER)
    # Simple crosshatch pattern
    for i in range(0, WIDTH, 20):
        for j in range(0, 200, 20):
            # Diamond shape ish
            draw.line([i, j+10, i+10, j], fill=(150,150,150), width=2)
            draw.line([i+10, j, i+20, j+10], fill=(150,150,150), width=2)
            draw.line([i, j+10, i+10, j+20], fill=(220,220,220), width=2)
            draw.line([i+10, j+20, i+20, j+10], fill=(220,220,220), width=2)
            
    # Black Vent
    draw.rectangle([20, 220, WIDTH-20, HEIGHT-20], fill=BLACK)
    for i in range(30, WIDTH-30, 15):
        draw.line([i, 220, i, HEIGHT-20], fill=(40,40,40), width=3)
        
    # Logo Plate
    draw.rectangle([40, 40, 180, 80], fill=BLACK)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        
    draw.text((110, 60), "MESA", fill=SILVER, anchor="mm", font=font)
    
    # Knobs (Black DOMED)
    spacing = 65
    start_x = 90
    y = 150
    for i in range(6):
        x = start_x + (i * spacing)
        draw.ellipse([x-25, y-25, x+25, y+25], fill=BLACK)
        draw.line([x, y, x, y-20], fill=SILVER, width=3)

    img.save(path)
    print(f"RectoDual icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_recto_icon(sys.argv[1])
