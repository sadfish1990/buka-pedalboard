from PIL import Image
import sys
import os

try:
    source_path = sys.argv[1]
    dest_path = sys.argv[2]
    width = int(float(sys.argv[3]))
    height = int(float(sys.argv[4]))

    print(f"Opening {source_path}")
    img = Image.open(source_path)
    
    # Check if DPR scaling is needed (e.g. if image width is much larger than screen width)
    # Assuming CSS pixels 1:1 for now, but let's check
    print(f"Image Size: {img.size}")
    
    # Simple crop at 0,0
    box = (0, 0, width, height)
    crop = img.crop(box)
    
    crop.save(dest_path)
    print(f"Saved crop to {dest_path}")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
