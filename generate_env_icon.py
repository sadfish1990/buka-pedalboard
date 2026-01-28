from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
SILVER = (220, 220, 230)
BLUE = (0, 0, 150)
RED = (200, 20, 20)

def create_env_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), SILVER)
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=BLUE, width=5)
    
    # Title "BassEnvelope"
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 55)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25)
    except:
        font = None
        font_sm = None
    
    draw.text((256, 100), "BassEnvelope", fill=BLUE, anchor="mm", font=font)
    draw.text((256, 160), "DYNAMIC FILTER", fill=BLUE, anchor="mm", font=font_sm)
    
    # Graphics: Two sweeps
    draw.arc([100, 250, 200, 350], 180, 0, fill=BLUE, width=5)
    draw.arc([312, 250, 412, 350], 180, 0, fill=BLUE, width=5)
    
    # Knobs: Sens (Big), Attack, Decay
    # Fuzz Switch
    
    # Sens
    draw.ellipse([256-50, 300-50, 256+50, 300+50], fill=SILVER, outline=BLUE, width=4)
    draw.line([256, 300, 256, 260], fill=BLUE, width=4)
    draw.text((256, 380), "SENS", fill=BLUE, anchor="mm", font=font_sm)
    
    # Switch
    draw.rectangle([230, 420, 282, 450], fill=RED)
    draw.text((256, 435), "DIST", fill=SILVER, anchor="mm", font=font_sm)

    img.save(path)
    print(f"BassEnvelope icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_env_icon(sys.argv[1])
