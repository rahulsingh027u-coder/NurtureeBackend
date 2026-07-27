#!/bin/bash
# Auto-restarting production server for Nurturee Admin
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting production server..."
  NODE_OPTIONS='--max-old-space-size=512' npx next start -H 0.0.0.0 -p 3000 >> /tmp/server-loop.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited (code=$EXIT_CODE), restarting in 2s..."
  sleep 2
done
