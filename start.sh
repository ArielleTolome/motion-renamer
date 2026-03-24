#!/bin/bash
PORT=3210
pkill -f "node server.js" 2>/dev/null
cd "$(dirname "$0")"
node server.js &
sleep 1
open http://localhost:$PORT
echo "Motion Renamer started at http://localhost:$PORT"
