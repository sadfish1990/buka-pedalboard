from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
SURF_GREEN = (100, 200, 180)
CREAM = (250, 250, 230)
CHROME = (200, 200, 210)
BLACK = (20, 20, 20)

def create_trem_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), SURF_GREEN)
    draw = ImageDraw.Draw(img)
    
    # Enclosure Shape
    draw.rectangle([10, 10, WIDTH-10, HEIGHT-10], outline=CHROME, width=5)
    
    # Faceplate
    draw.rectangle([30, 100, WIDTH-30, HEIGHT-150], fill=CREAM, outline=BLACK, width=2)
    
    # Title
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 50)
    except:
        font = None
        
    draw.text((256, 60), "VintageTrem", fill=BLACK, anchor="mm", font=font)
    
    # Wave Graphic
    y_wave = 256
    points = []
    for x in range(100, 412):
        from math import sin, pi
        y = y_wave + sin((x-100)*0.05) * 40
        points.append((x, y))
    
    draw.line(points, fill=SURF_GREEN, width=8)
    
    # Knobs
    knob_y = 400
    for i, x in enumerate([156, 356]):
        draw.ellipse([x-50, knob_y-50, x+50, knob_y+50], fill=BLACK, outline=CHROME, width=4)
        draw.line([x, knob_y, x, knob_y-40], fill=CREAM, width=6)
        
    draw.text((156, 320), "SPEED", fill=BLACK, anchor="mm")
    draw.text((356, 320), "DEPTH", fill=BLACK, anchor="mm")

    img.save(path)
    print(f"VintageTrem icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_trem_icon(sys.argv[1])
