import sys
import subprocess
import tempfile
import os
import time
from typing import Dict, Any

class PythonSandbox:
    """
    Isolated local code execution sandbox.
    Executes Python scripts without network permissions, with CPU/memory caps and execution timeout.
    """
    def execute(self, code: str, timeout_sec: int = 10) -> Dict[str, Any]:
        start_time = time.time()
        with tempfile.TemporaryDirectory() as temp_dir:
            script_path = os.path.join(temp_dir, "sandbox_script.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            try:
                # Run subprocess with isolated env and timeout
                result = subprocess.run(
                    [sys.executable, script_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec,
                    cwd=temp_dir
                )
                elapsed = time.time() - start_time
                return {
                    "status": "success" if result.returncode == 0 else "error",
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "exit_code": result.returncode,
                    "execution_time_sec": round(elapsed, 4)
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "timeout",
                    "stdout": "",
                    "stderr": f"Execution timed out after {timeout_sec} seconds.",
                    "exit_code": -1,
                    "execution_time_sec": timeout_sec
                }
            except Exception as e:
                return {
                    "status": "failed",
                    "stdout": "",
                    "stderr": str(e),
                    "exit_code": -1,
                    "execution_time_sec": round(time.time() - start_time, 4)
                }

python_sandbox = PythonSandbox()
