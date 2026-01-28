#!/bin/bash
# Sync patched files to Pi running on HotspotIP 10.42.0.1
IP="10.42.0.1"

echo "Attempting to sync patched files to Pi at $IP..."

# Check connectivity
ping -c 1 $IP > /dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot reach Pi at $IP. Are you connected to 'buka' Wi-Fi?"
    exit 1
fi

echo "Syncing BabylonJS and Visualizer..."
sshpass -p 1 scp -o StrictHostKeyChecking=no PedalBoard/src/babylon.js buka@$IP:/home/buka/wam2/PedalBoard/src/babylon.js
sshpass -p 1 scp -o StrictHostKeyChecking=no PedalBoard/src/Gui/Visualizer.js buka@$IP:/home/buka/wam2/PedalBoard/src/Gui/Visualizer.js

echo "Syncing new Multi-IP Certificates..."
sshpass -p 1 scp -o StrictHostKeyChecking=no key.pem buka@$IP:/home/buka/wam2/key.pem
sshpass -p 1 scp -o StrictHostKeyChecking=no cert.pem buka@$IP:/home/buka/wam2/cert.pem

echo "Restarting Pi Server..."
sshpass -p 1 ssh -o StrictHostKeyChecking=no buka@$IP "sudo systemctl restart wam2"

echo "Done! Pi should be ready at https://$IP:3008"
