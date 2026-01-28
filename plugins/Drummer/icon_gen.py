from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 512, 512
BG_COLOR = (30, 30, 30)
ACCENT_ORANGE = (237, 140, 28)
ACCENT_YELLOW = (240, 220, 50)
ACCENT_WHITE = (220, 220, 220)
ACCENT_RED = (200, 40, 40)

def create_drummer_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), (20, 20, 20))
    draw = ImageDraw.Draw(img)
    
    # Body
    margin = 40
    shape = [margin, margin, WIDTH-margin, HEIGHT-margin]
    draw.rounded_rectangle(shape, radius=20, fill=BG_COLOR, outline=(80,80,80), width=6)
    
    # Header Strip
    draw.rectangle([margin, margin+40, WIDTH-margin, margin+50], fill=ACCENT_ORANGE)
    
    # 16-Step Grid Visual (Abstract)
    grid_y = 150
    grid_h = 200
    rows = 4
    cols = 4
    
    cell_w = (WIDTH - 2*margin - 40) / cols
    cell_h = (grid_h) / rows
    
    start_x = margin + 20
    
    for r in range(rows):
        for c in range(cols):
            x = start_x + c * cell_w
            y = grid_y + r * cell_h + (r*10)
            
            # Color logic (TR-808 ish)
            if r == 3: color = ACCENT_YELLOW 
            elif r == 2: color = ACCENT_ORANGE
            elif r == 1: color = ACCENT_WHITE
            else: color = ACCENT_RED
            
            # Active/Inactive randomness for 'icon' feel
            is_active = (c + r) % 3 == 0 
            
            fill = color if is_active else (50,50,50)
            outline = color
            
            draw.rectangle([x, y, x+cell_w-10, y+cell_h-10], fill=fill, outline=outline, width=2)

    # Logo Text "TR"
    # Draw simple shapes for TR
    # T
    tx, ty = 200, 400
    draw.rectangle([tx, ty, tx+60, ty+15], fill=ACCENT_WHITE)
    draw.rectangle([tx+22, ty, tx+38, ty+60], fill=ACCENT_WHITE)
    
    # R
    rx, ry = 280, 400
    draw.rectangle([rx, ry, rx+15, ry+60], fill=ACCENT_WHITE)
    draw.pieslice([rx, ry, rx+50, ry+40], 270, 90, fill=ACCENT_WHITE)
    draw.line([rx+15, ry+30, rx+50, ry+60], fill=ACCENT_WHITE, width=15)
    
    img.save(path)
    print(f"Drummer Icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_drummer_icon(sys.argv[1])
