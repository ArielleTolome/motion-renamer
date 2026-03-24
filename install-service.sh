#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_PATH="$(which node)"
PLIST="$HOME/Library/LaunchAgents/com.motion-renamer.plist"
cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.motion-renamer</string>
  <key>ProgramArguments</key>
  <array><string>$NODE_PATH</string><string>$PROJECT_DIR/server.js</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>WorkingDirectory</key><string>$PROJECT_DIR</string>
  <key>StandardOutPath</key><string>/tmp/motion-renamer.log</string>
  <key>StandardErrorPath</key><string>/tmp/motion-renamer.error.log</string>
</dict>
</plist>
EOF
launchctl load "$PLIST"
echo "Service installed and started. Will auto-start on login."
