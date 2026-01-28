from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
DARK_GREY = (50, 50, 55)
BLACK = (10, 10, 10)
SILVER = (180, 180, 190)
RIVET = (200, 200, 220)

def create_jc_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), DARK_GREY)
    draw = ImageDraw.Draw(img)
    
    # Industrial Border (Rivets)
    draw.rectangle([20, 20, WIDTH-20, HEIGHT-20], outline=BLACK, width=5)
    
    # Rivets
    for i in range(40, WIDTH-30, 60):
        draw.ellipse([i-5, 30-5, i+5, 30+5], fill=RIVET) # Top
        draw.ellipse([i-5, HEIGHT-30-5, i+5, HEIGHT-30+5], fill=RIVET) # Bottom
        
    for i in range(40, HEIGHT-30, 60):
        draw.ellipse([30-5, i-5, 30+5, i+5], fill=RIVET) # Left
        draw.ellipse([WIDTH-30-5, i-5, WIDTH-30+5, i+5], fill=RIVET) # Right
        
    # Grille (Cloth)
    draw.rectangle([50, 150, WIDTH-50, HEIGHT-50], fill=(70, 70, 75))
    # Speakers (Silver Cones)
    cx1, cy = 160, 320
    cx2 = 352
    r = 90
    draw.ellipse([cx1-r, cy-r, cx1+r, cy+r], fill=(30,30,30), outline=(100,100,100), width=2)
    draw.ellipse([cx2-r, cy-r, cx2+r, cy+r], fill=(30,30,30), outline=(100,100,100), width=2)
    
    # Dust caps (Silver)
    draw.ellipse([cx1-20, cy-20, cx1+20, cy+20], fill=SILVER)
    draw.ellipse([cx2-20, cy-20, cx2+20, cy+20], fill=SILVER)
    
    # Logo
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 55)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
    except:
        font = None
        font_sm = None
        
    draw.text((256, 80), "JC-120", fill=SILVER, anchor="mm", font=font)
    draw.text((256, 130), "JAZZ CHORUS", fill=SILVER, anchor="mm", font=font_sm)

    img.save(path)
    print(f"JazzChorus icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_jc_icon(sys.argv[1])
