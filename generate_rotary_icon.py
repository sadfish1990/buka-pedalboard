from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
WOOD_DARK = (60, 30, 10)
WOOD_LIGHT = (100, 60, 20)
MESH = (30, 20, 10)
BLACK = (10, 10, 10)
GOLD = (200, 180, 50)

def create_rotary_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), WOOD_DARK)
    draw = ImageDraw.Draw(img)
    
    # Wood Grain texture lines
    import random
    for i in range(200):
        y = random.randint(0, HEIGHT)
        width = random.randint(1, 4)
        length = random.randint(50, WIDTH)
        x = random.randint(0, WIDTH-length)
        draw.line([x, y, x+length, y], fill=WOOD_LIGHT, width=width)
        
    # Cabinet Frame
    margin = 20
    draw.rectangle([margin, margin, WIDTH-margin, HEIGHT-margin], outline=BLACK, width=5)
    
    # Top Louvers (Horn)
    louver_y = 100
    for i in range(3):
        draw.rectangle([60, louver_y, WIDTH-60, louver_y+30], fill=BLACK)
        louver_y += 50
        
    # Bottom Grille (Drum)
    draw.rectangle([60, 300, WIDTH-60, 450], fill=MESH, outline=BLACK)
    # Mesh texture
    for x in range(60, WIDTH-60, 10):
        draw.line([x, 300, x, 450], fill=BLACK, width=1)
    for y in range(300, 450, 10):
        draw.line([60, y, WIDTH-60, y], fill=BLACK, width=1)
        
    # Badge
    draw.rectangle([180, 40, 332, 90], fill=GOLD, outline=BLACK, width=2)
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
    except:
        font = None
    
    draw.text((256, 65), "ROTARY", fill=BLACK, anchor="mm", font=font)
    
    # Switch Visual (Fast/Slow)
    s_x, s_y = 420, 256
    draw.ellipse([s_x-40, s_y-40, s_x+40, s_y+40], fill=BLACK, outline=GOLD, width=3)
    draw.line([s_x, s_y, s_x, s_y-30], fill=GOLD, width=4) # Toggle Up

    img.save(path)
    print(f"Rotary icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_rotary_icon(sys.argv[1])
