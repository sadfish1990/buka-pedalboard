from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BLACK = (20, 20, 20)
RED = (180, 40, 40)
GOLD = (200, 170, 50)
CLOTH_BASE = (60, 20, 20) 

def create_vox_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BLACK)
    draw = ImageDraw.Draw(img)
    
    # Diamond Grille Cloth
    draw.rectangle([0, 150, WIDTH, HEIGHT], fill=(40, 15, 10))
    # Diamond pattern
    spacing = 30
    for i in range(-50, WIDTH+50, spacing):
        for j in range(120, HEIGHT, spacing):
            # Red/Green/Gold threads
            # Just simple crosshatch for icon scale
            draw.line([i, j, i+spacing, j+spacing], fill=(100, 50, 50), width=2)
            draw.line([i+spacing, j, i, j+spacing], fill=(100, 50, 50), width=2)
            
    # Diamond centers
    for i in range(0, WIDTH, spacing):
        for j in range(150, HEIGHT, spacing):
             draw.ellipse([i+13, j+13, i+17, j+17], fill=(150, 120, 50))

    # Control Panel (Top)
    draw.rectangle([0, 0, WIDTH, 150], fill=RED)
    # Gold piping
    draw.line([0, 150, WIDTH, 150], fill=GOLD, width=5)
    
    # Logo
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
    except:
        font = None
        font_sm = None
        
    draw.text((256, 60), "VOX", fill=GOLD, anchor="mm", font=font)
    draw.text((256, 120), "A.C.30", fill=GOLD, anchor="mm", font=font_sm)
    
    # Knobs (Chicken Head - roughly triangular)
    # Drawn overlaid on grille or panel?
    # Let's put them on the panel, small.
    # Actually AC30 panel is usually reddish/brown.
    
    img.save(path)
    print(f"Brit30 icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_vox_icon(sys.argv[1])
