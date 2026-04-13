#!/usr/bin/env python
"""Launch backend with output flushing"""
import sys
import subprocess

# Ensure output is not buffered
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)
sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf8', buffering=1)

print("[1/3] Starting backend launcher...", flush=True)

try:
    print("[2/3] Importing uvicorn...", flush=True)
    import uvicorn
    print("[3/3] Starting uvicorn server...", flush=True)
    
    # Run the server
    uvicorn.run(
        "backend.app:app",
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
