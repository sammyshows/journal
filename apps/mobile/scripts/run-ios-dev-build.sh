#!/bin/bash

# Get the current IP address of the Mac (excluding localhost and Docker interfaces)
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | grep -v "172.17." | awk '{print $2}' | head -n1)

# Check if we got an IP address
if [ -z "$IP_ADDRESS" ]; then
    echo "❌ Could not detect IP address. Using localhost as fallback."
    IP_ADDRESS="localhost"
fi

# Set the API URL using your IP address
export EXPO_PUBLIC_API_URL="http://${IP_ADDRESS}:3001"

echo "🌐 Setting API URL to: $EXPO_PUBLIC_API_URL"
echo "📱 Running iOS development build with pnpm..."

# Optional: clear metro cache (uncomment if needed)
# rm -rf node_modules/.cache

# Run the iOS development build
pnpm expo run:ios
