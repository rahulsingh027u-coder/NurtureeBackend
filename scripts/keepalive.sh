#!/bin/bash
# Keepalive script for Next.js dev server
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting Next.js dev server..."
  rm -rf .next
  npx next dev --port 3000 -H 0.0.0.0 >> /tmp/next-keepalive.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
