import subprocess
import os
import sys
import time
import threading
import traceback

# Get workspace root directory based on script location
root_dir = os.path.dirname(os.path.abspath(__file__))
log_file_path = os.path.join(root_dir, "run_servers.log")

# Open log file
log_file = open(log_file_path, "w", encoding="utf-8", buffering=1)

def log(message):
    msg = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}"
    print(msg, flush=True)
    log_file.write(msg + "\n")
    log_file.flush()

log("[*] Starting run_servers.py runner script")

try:
    # Use absolute node.exe path
    node_path = "C:\\Program Files\\nodejs\\node.exe"
    if not os.path.exists(node_path):
        log("[!] Node.exe not found at C:\\Program Files\\nodejs\\node.exe. Using fallback 'node'.")
        node_path = "node"
    else:
        log(f"[*] Found node.exe at {node_path}")

    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    log(f"[*] Backend directory: {backend_dir}")
    log(f"[*] Frontend directory: {frontend_dir}")

    # Verify node_modules in both directories
    if not os.path.exists(os.path.join(backend_dir, "node_modules")):
        log("[!] Warning: backend/node_modules does not exist!")
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        log("[!] Warning: frontend/node_modules does not exist!")

    def read_output(proc, prefix):
        log(f"[*] Started reading output for {prefix}")
        try:
            for line in iter(proc.stdout.readline, ''):
                if line:
                    log(f"[{prefix}] {line.strip()}")
        except Exception as e:
            log(f"[!] Error reading {prefix} output: {e}")
        log(f"[*] Finished reading output for {prefix}")

    # Start Backend
    log("[*] Launching Backend Server...")
    backend_proc = subprocess.Popen(
        [node_path, "src/server.js"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding='utf-8'
    )
    log("[*] Backend Server process spawned.")

    # Start Frontend
    log("[*] Launching Frontend Server...")
    vite_path = os.path.join(frontend_dir, "node_modules", "vite", "bin", "vite.js")
    frontend_proc = subprocess.Popen(
        [node_path, vite_path],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding='utf-8'
    )
    log("[*] Frontend Server process spawned.")

    # Start output streaming threads
    t1 = threading.Thread(target=read_output, args=(backend_proc, "BACKEND"), daemon=True)
    t2 = threading.Thread(target=read_output, args=(frontend_proc, "FRONTEND"), daemon=True)
    t1.start()
    t2.start()

    while True:
        time.sleep(1)
        if backend_proc.poll() is not None:
            log(f"[!] Backend exited with code {backend_proc.returncode}")
            break
        if frontend_proc.poll() is not None:
            log(f"[!] Frontend exited with code {frontend_proc.returncode}")
            break

except Exception as err:
    tb = traceback.format_exc()
    log(f"[CRITICAL] Runner crashed: {err}\n{tb}")

finally:
    log("[*] Cleaning up child processes...")
    try:
        backend_proc.terminate()
        log("[*] Terminated backend process.")
    except Exception as e:
        pass
    try:
        frontend_proc.terminate()
        log("[*] Terminated frontend process.")
    except Exception as e:
        pass
    log_file.close()
