#!/bin/bash
cd "$(dirname "$0")"

echo "=========================================================="
echo "   REMOTION STUDIO // CREEPY RULES + 2D STORY ENGINE"
echo "=========================================================="
echo "Starting local server at http://localhost:4567 ..."

# Check if port 4567 is already in use
lsof -ti:4567 | xargs kill -9 2>/dev/null

# Start Node Server in background
node tool/server.js &
SERVER_PID=$!

sleep 1

# Open default browser
open "http://localhost:4567"

echo "Server is running (PID: $SERVER_PID)."
echo "Press Ctrl+C to stop the studio."

wait $SERVER_PID
