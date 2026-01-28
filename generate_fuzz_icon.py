from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
GREEN = (50, 80, 50) # Military Green
BLACK = (10, 10, 10)
YELLOW = (200, 200, 50) # Vintage yellow text

def create_fuzz_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), GREEN)
    draw = ImageDraw.Draw(img)
    
    # Border (Rugged)
    draw.rectangle([15, 15, WIDTH-15, HEIGHT-15], outline=BLACK, width=8)
    
    # Title (Cyrillic Fake Style)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
    except:
        font = None
        font_sm = None
    
    # "BASS FUZZ"
    draw.text((256, 100), "BASS FUZZ", fill=YELLOW, anchor="mm", font=font)
    draw.text((256, 170), "ЛЮБОВЬ К БАСУ", fill=BLACK, anchor="mm", font=font_sm) # Love for bass
    
    # Knobs Layout: 3 Big Knobs (Vol, Tone, Sustain) + 1 Blend
    # Triangle layout
    # Vol (Left), Tone (Top), Sustain (Right)
    # Blend (Small, Center Bottom)
    
    cx, cy = 256, 300
    
    # Tone
    draw.ellipse([cx-45, cy-120, cx+45, cy-30], fill=BLACK)
    draw.line([cx, cy-75, cx, cy-110], fill=YELLOW, width=4)
    draw.text((cx, cy-140), "TONE", fill=YELLOW, anchor="mm", font=font_sm)
    
    # Vol
    draw.ellipse([cx-145, cy+20, cx-55, cy+110], fill=BLACK)
    draw.line([cx-100, cy+65, cx-100, cy+30], fill=YELLOW, width=4)
    draw.text((cx-100, cy+130), "VOL", fill=YELLOW, anchor="mm", font=font_sm)
    
    # Sustain
    draw.ellipse([cx+55, cy+20, cx+145, cy+110], fill=BLACK)
    draw.line([cx+100, cy+65, cx+100, cy+30], fill=YELLOW, width=4)
    draw.text((cx+100, cy+130), "SUSTAIN", fill=YELLOW, anchor="mm", font=font_sm)
    
    # Blend (Small knob)
    draw.ellipse([cx-25, cy+50, cx+25, cy+100], fill=BLACK, outline=YELLOW)
    draw.line([cx, cy+75, cx, cy+55], fill=YELLOW, width=3)
    draw.text((cx, cy+125), "BLEND", fill=YELLOW, anchor="mm", font=font_sm)

    img.save(path)
    print(f"BassFuzz icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_fuzz_icon(sys.argv[1])
