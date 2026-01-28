
import json

local_wams_path = "/home/buka/Documentos/wam2/PedalBoard/src/wams.json"

with open(local_wams_path, 'r') as f:
    current_wams = json.load(f)

updated_wams = []
for url in current_wams:
    if not url.endswith('/'):
        updated_wams.append(url + '/')
    else:
        updated_wams.append(url)

with open(local_wams_path, 'w') as f:
    json.dump(updated_wams, f, indent=2)

print(f"Fixed {len(updated_wams)} URLs.")
