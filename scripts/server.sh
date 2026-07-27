#!/bin/bash
cd /home/z/my-project
LOGFILE=/tmp/nurturee-server.log
PIDFILE=/tmp/nurturee-server.pid

echo "[$(date)] Server script started" >> $LOGFILE

while true; do
  # Kill any existing process on port 3000
  fuser -k 3000/tcp 2>/dev/null
  sleep 1
  
  echo "[$(date)] Starting production server..." >> $LOGFILE
  NODE_OPTIONS='--max-old-space-size=512' npx next start -H 0.0.0.0 -p 3000 >> $LOGFILE 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited (code=$EXIT_CODE), restarting in 3s..." >> $LOGFILE
  sleep 3
done
