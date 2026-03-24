#!/bin/bash
pkill -f 'node server.js' 2>/dev/null || true
sleep 1
cd /Users/arieltolome/.openclaw/workspace/motion-renamer
node server.js &
sleep 2
open http://localhost:3210
echo 'Precision Curator running at http://localhost:3210'
