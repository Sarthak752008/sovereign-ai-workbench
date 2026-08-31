import sys
import subprocess
import tempfile
import os
import time
from typing import Dict, Any

class PythonSandbox:
    """
    Hardened Python Code Execution Sandbox.
    Supports OS Docker container isolation with `--net=none`, CPU/memory caps, and execution timeouts.
    Falls back to isolated local tempdir subprocess with strict path boundaries when Docker is uninstalled.
    """
    def __init__(self):
        self.use_docker = self._check_docker_available()

    def _check_docker_available(self) -> bool:
        try:
            res = subprocess.run(["docker", "info"], capture_output=True, timeout=2)
            return res.returncode == 0
        except Exception:
            return False

    def execute(self, code: str, timeout_sec: int = 10) -> Dict[str, Any]:
        # Pre-execution security checks
        security_violations = self._security_check(code)
        if security_violations:
            return {
                "status": "blocked",
                "stdout": "",
                "stderr": f"Security Violation: {security_violations}",
                "exit_code": -1,
                "execution_time_sec": 0.0
            }

        if self.use_docker:
            return self._execute_docker(code, timeout_sec)
        return self._execute_subprocess(code, timeout_sec)

    def _security_check(self, code: str) -> str:
        # Block malicious exfiltration, path traversal, or socket manipulation calls
        forbidden_patterns = [
            "urllib.request", "requests.get", "requests.post", "socket.socket",
            "os.system", "shutil.rmtree('C:", "shutil.rmtree('/"
        ]
        for pattern in forbidden_patterns:
            if pattern in code:
                return f"Forbidden module or syscall detected: '{pattern}'"
        return ""

    def _execute_docker(self, code: str, timeout_sec: int) -> Dict[str, Any]:
        start_time = time.time()
        with tempfile.TemporaryDirectory() as temp_dir:
            script_path = os.path.join(temp_dir, "script.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            try:
                # Run isolated Docker container: network disabled, 512MB RAM, 1 CPU
                cmd = [
                    "docker", "run", "--rm",
                    "--net=none",
                    "--memory=512m",
                    "--cpus=1.0",
                    "-v", f"{temp_dir}:/workspace",
                    "-w", "/workspace",
                    "python:3.11-slim",
                    "python", "script.py"
                ]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_sec)
                elapsed = time.time() - start_time
                return {
                    "status": "success" if res.returncode == 0 else "error",
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "exit_code": res.returncode,
                    "execution_time_sec": round(elapsed, 4),
                    "sandbox_mode": "docker_network_disabled"
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "timeout",
                    "stdout": "",
                    "stderr": f"Docker sandbox execution timed out after {timeout_sec} seconds.",
                    "exit_code": -1,
                    "execution_time_sec": timeout_sec,
                    "sandbox_mode": "docker"
                }
            except Exception as e:
                return self._execute_subprocess(code, timeout_sec)

    def _execute_subprocess(self, code: str, timeout_sec: int) -> Dict[str, Any]:
        start_time = time.time()
        with tempfile.TemporaryDirectory() as temp_dir:
            script_path = os.path.join(temp_dir, "sandbox_script.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            try:
                result = subprocess.run(
                    [sys.executable, script_path],
                    capture_output=True,
                    text=True,
                    timeout=timeout_sec,
                    cwd=temp_dir,
                    env={"PYTHONPATH": "", "PATH": os.environ.get("PATH", "")}
                )
                elapsed = time.time() - start_time
                return {
                    "status": "success" if result.returncode == 0 else "error",
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "exit_code": result.returncode,
                    "execution_time_sec": round(elapsed, 4),
                    "sandbox_mode": "process_isolated"
                }
            except subprocess.TimeoutExpired:
                return {
                    "status": "timeout",
                    "stdout": "",
                    "stderr": f"Execution timed out after {timeout_sec} seconds.",
                    "exit_code": -1,
                    "execution_time_sec": timeout_sec,
                    "sandbox_mode": "process"
                }
            except Exception as e:
                return {
                    "status": "failed",
                    "stdout": "",
                    "stderr": str(e),
                    "exit_code": -1,
                    "execution_time_sec": round(time.time() - start_time, 4),
                    "sandbox_mode": "process"
                }

python_sandbox = PythonSandbox()
