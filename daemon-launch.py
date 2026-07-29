#!/usr/bin/env python3
"""
Nurturee Admin Portal - Daemon launcher for Next.js server.
Uses double-fork to persist across bash tool session exits.

Usage:
  python3 daemon-launch.py              # start on port 3000
  python3 daemon-launch.py 3000          # start on custom port
  python3 daemon-launch.py stop         # stop the daemon
"""
import os, sys, subprocess, time, signal

port = sys.argv[1] if len(sys.argv) > 1 else "3000"
log_file = "/tmp/nurturee-server.log"
pid_file = "/tmp/nurturee-server.pid"

# Handle stop
if port == "stop":
    try:
        with open(pid_file) as f:
            pid = int(f.read().strip())
        os.kill(pid, signal.SIGTERM)
        # Also kill the process group
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except:
            pass
        # Also kill any next start processes
        subprocess.run(['pkill', '-f', 'next start'], timeout=5)
        with open(log_file, 'a') as f:
            f.write(f'\n[{time.strftime("%Y-%m-%d %H:%M:%S")}] Daemon stopped\n')
        print('Daemon stopped')
    except FileNotFoundError:
        print('No PID file found')
    except ProcessLookupError:
        print('Process not running')
    sys.exit(0)

# Validate port is numeric
try:
    int(port)
except ValueError:
    print(f'Invalid port: {port}. Use a number or "stop".')
    sys.exit(1)

# --- Double fork to fully daemonize ---
pid = os.fork()
if pid > 0:
    sys.exit(0)

os.setsid()

pid = os.fork()
if pid > 0:
    sys.exit(0)

# --- Redirect file descriptors ---
sys.stdout.flush()
sys.stderr.flush()
si = open('/dev/null', 'r')
so = open(log_file, 'a+')
se = open(log_file, 'a+')
os.dup2(si.fileno(), sys.stdin.fileno())
os.dup2(so.fileno(), sys.stdout.fileno())
os.dup2(se.fileno(), sys.stderr.fileno())

# --- Set working directory & launch ---
os.chdir('/home/z/my-project')

env = os.environ.copy()
env['NODE_OPTIONS'] = '--max-old-space-size=512'

# Auto-restart loop
while True:
    # Kill anything on the port first
    try:
        subprocess.run(['fuser', '-k', f'{port}/tcp'],
                       stdout=so, stderr=se, timeout=5)
        time.sleep(1)
    except:
        pass
    
    with open(log_file, 'a') as f:
        f.write(f'\n[{time.strftime("%Y-%m-%d %H:%M:%S")}] Starting Next.js server on port {port}...\n')
    
    proc = subprocess.Popen(
        ['/usr/bin/npx', 'next', 'start', '-H', '0.0.0.0', '-p', port],
        env=env,
        stdout=so.fileno(),
        stderr=se.fileno(),
    )
    
    with open(pid_file, 'w') as f:
        f.write(str(proc.pid))
    
    exit_code = proc.wait()
    
    with open(log_file, 'a') as f:
        f.write(f'[{time.strftime("%Y-%m-%d %H:%M:%S")}] Server exited (code={exit_code}), restarting in 3s...\n')
    
    time.sleep(3)
