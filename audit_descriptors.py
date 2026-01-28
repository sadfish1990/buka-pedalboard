import json
import glob

files = glob.glob("plugins/*/descriptor.json")
found = False
for f in files:
    try:
        with open(f, 'r') as fp:
            data = json.load(fp)
            keywords = data.get('keywords', [])
            for k in keywords:
                if "Amplifier" in k and "Guitar" not in k and "Cabs" not in k: # exact match or close
                     print(f"FOUND 'Amplifier' in {f}: {keywords}")
                     found = True
                if "Amplifiers" in k: # Checking english plural
                     print(f"FOUND 'Amplifiers' in {f}: {keywords}")
                     found = True
    except Exception as e:
        print(f"Error reading {f}: {e}")

if not found:
    print("Clean scan: No 'Amplifier' category found in any descriptor.")
