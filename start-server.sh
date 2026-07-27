#!/bin/bash
cd /home/z/my-project
export PATH="/usr/bin:/bin:/usr/local/bin:$PATH"
export NODE_OPTIONS="--max-old-space-size=512"
exec /usr/bin/npx next start -H 0.0.0.0 -p 3000
