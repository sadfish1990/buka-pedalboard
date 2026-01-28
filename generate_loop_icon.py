from PIL import Image, ImageDraw

WIDTH, HEIGHT = 512, 512
BG_COLOR = (40, 40, 40) # Dark Console Grey
FADER_BG = (20, 20, 20)
ACCENT_GREEN = (0, 200, 0)
ACCENT_RED = (200, 0, 0)

def create_loop_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 1. Console Body
    margin = 20
    draw.rectangle([margin, margin, WIDTH-margin, HEIGHT-margin], outline=(80,80,80), width=4)
    
    # 2. 4 Channels Strips
    strip_w = (WIDTH - 2*margin) / 4
    for i in range(4):
        x = margin + i * strip_w
        
        # Fader Track
        track_x = x + strip_w/2
        track_y_start = 150
        track_y_end = 400
        draw.line([track_x, track_y_start, track_x, track_y_end], fill=(10,10,10), width=8)
        
        # Fader Cap (Random positions)
        pos = [0.8, 0.5, 0.7, 0.2][i] # Mix
        cap_y = track_y_end - (pos * (track_y_end - track_y_start))
        
        draw.rectangle([track_x-15, cap_y-10, track_x+15, cap_y+10], fill=(200,200,200), outline=(0,0,0))
        
        # Rec Button
        rec_y = 440
        fill_rec = ACCENT_RED if i == 0 else (60,0,0)
        draw.ellipse([track_x-10, rec_y-10, track_x+10, rec_y+10], fill=fill_rec)
        
        # Pan Knob
        knob_y = 80
        draw.ellipse([track_x-15, knob_y-15, track_x+15, knob_y+15], fill=(30,30,30), outline=(100,100,100))
        draw.line([track_x, knob_y, track_x, knob_y-15], fill=ACCENT_GREEN, width=2)

    img.save(path)
    print(f"Loop Icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_loop_icon(sys.argv[1])
