#!/bin/bash
# Nurturee Admin Portal - Server launcher
# Uses daemon-launch.py for persistent process

cd /home/z/my-project

# Kill any existing server
kill $(cat /tmp/nurturee-server.pid 2>/dev/null) 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 1

# Clear old logs
rm -f /tmp/nurturee-server.log

# Launch daemon (double-fork, auto-restart)
python3 daemon-launch.py 3000
