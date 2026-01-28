#!/bin/bash
echo "Configuring Raspberry Pi Hotspot..."

# Define interface
IFACE="wlan0"
SSID="buka"
PASS="pedalboard"
CON_NAME="Hotspot"

# Delete existing connections on wlan0 to avoid conflicts
echo "Deleting existing connections on $IFACE..."
nmcli device disconnect $IFACE
EXISTING_CONS=$(nmcli -t -f UUID,DEVICE connection show | grep $IFACE | cut -d: -f1)
for UUID in $EXISTING_CONS; do
    nmcli connection delete $UUID
done

# Create Hotspot connection
echo "Creating Hotspot '$SSID'..."
nmcli con add type wifi ifname $IFACE con-name $CON_NAME autoconnect yes ssid $SSID
nmcli con modify $CON_NAME 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared
nmcli con modify $CON_NAME wifi-sec.key-mgmt wpa-psk wifi-sec.psk $PASS

# Bring up connection
echo "Activating Hotspot..."
nmcli con up $CON_NAME

echo "Hotspot '$SSID' configured successfully."
echo "IP Address should be 10.42.0.1"
ip a show $IFACE
