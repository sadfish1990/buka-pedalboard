import json
import os

with open('plugins.json', 'r') as f:
    registered = set(json.load(f))

actual = set()
for d in os.listdir('plugins'):
    if os.path.isdir(os.path.join('plugins', d)) and d != 'utils':
        # Check if descriptor exists
        if os.path.exists(os.path.join('plugins', d, 'descriptor.json')):
             actual.add(d)

missing_from_json = actual - registered
broken_links = registered - actual

print(f"Plugins on disk: {len(actual)}")
print(f"Plugins in JSON: {len(registered)}")
print(f"Missing from JSON (Hidden): {missing_from_json}")
print(f"In JSON but missing (Broken): {broken_links}")
