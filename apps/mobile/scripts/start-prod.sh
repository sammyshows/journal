#!/bin/bash

# Set production environment variables
# Update these URLs to match your production API endpoints
EXPO_PUBLIC_API_URL=https://journal-production-d159.up.railway.app

echo "🚀 Production Mode"
echo "🌐 Setting API URL to: $EXPO_PUBLIC_API_URL"

echo "📱 Starting Expo in production mode..."

# Start Expo with tunnel and clear cache
npx expo start --tunnel --clear 