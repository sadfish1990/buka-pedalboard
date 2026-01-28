from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

# Config
WIDTH, HEIGHT = 512, 512
BG_COLOR = (40, 40, 40) # Dark Metal
ACCENT_COLOR = (220, 20, 20) # Red
TEXT_COLOR = (220, 220, 220) # White/Silver
OUTLINE_COLOR = (80, 80, 80)

def create_metal_icon(path):
    img = Image.new('RGB', (WIDTH, HEIGHT), (20, 20, 20))
    draw = ImageDraw.Draw(img)
    
    # 1. Main Pedal Body (Rounded Rect)
    margin = 40
    shape = [margin, margin, WIDTH-margin, HEIGHT-margin]
    draw.rounded_rectangle(shape, radius=40, fill=BG_COLOR, outline=OUTLINE_COLOR, width=8)
    
    # 2. Industrial Texture (Rivets)
    rivet_offset = 60
    rivet_size = 15
    fill_rivet = (20, 20, 20)
    # TL
    draw.ellipse([rivet_offset, rivet_offset, rivet_offset+rivet_size, rivet_offset+rivet_size], fill=fill_rivet)
    # TR
    draw.ellipse([WIDTH-rivet_offset-rivet_size, rivet_offset, WIDTH-rivet_offset, rivet_offset+rivet_size], fill=fill_rivet)
    # BL
    draw.ellipse([rivet_offset, HEIGHT-rivet_offset-rivet_size, rivet_offset+rivet_size, HEIGHT-rivet_offset], fill=fill_rivet)
    # BR
    draw.ellipse([WIDTH-rivet_offset-rivet_size, HEIGHT-rivet_offset-rivet_size, WIDTH-rivet_offset, HEIGHT-rivet_offset], fill=fill_rivet)

    # 3. Knobs (6 Layout)
    cx, cy = WIDTH // 2, HEIGHT // 2
    knob_radius = 25
    knob_gap_x = 90
    knob_gap_y = 70
    start_y = cy - 20
    
    positions = [
        (cx - knob_gap_x, start_y - knob_gap_y), (cx, start_y - knob_gap_y), (cx + knob_gap_x, start_y - knob_gap_y),
        (cx - knob_gap_x, start_y + knob_gap_y), (cx, start_y + knob_gap_y), (cx + knob_gap_x, start_y + knob_gap_y)
    ]
    
    for x, y in positions:
        # Outer ring
        draw.ellipse([x-knob_radius, y-knob_radius, x+knob_radius, y+knob_radius], fill=(20,20,20), outline=(100,100,100), width=3)
        # Position indicator Line
        draw.line([x, y, x, y-knob_radius+5], fill=ACCENT_COLOR, width=4)

    # 4. Branding
    # Simple bitmap font usually available fallback or draw text vertically/horizontally
    # Without external fonts, we draw shapes or use default font
    # Draw "METAL" "X" shapes manually if needed or simple text
    
    # Main 'X' Graphic
    x_center_y = 130
    x_size = 60
    
    # Draw thicker X
    width_x = 12
    draw.line([cx-x_size, x_center_y-x_size, cx+x_size, x_center_y+x_size], fill=ACCENT_COLOR, width=width_x)
    draw.line([cx+x_size, x_center_y-x_size, cx-x_size, x_center_y+x_size], fill=ACCENT_COLOR, width=width_x)
    
    # 5. Footswitch
    switch_y = 400
    switch_r = 30
    draw.ellipse([cx-switch_r, switch_y-switch_r, cx+switch_r, switch_y+switch_r], fill=(150,150,150), outline=(50,50,50), width=5)
    
    # Save
    img.save(path)
    print(f"Icon saved to {path}")

if __name__ == '__main__':
    import sys
    create_metal_icon(sys.argv[1])
