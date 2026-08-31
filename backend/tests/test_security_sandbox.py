import pytest
from app.sandbox.python_sandbox import python_sandbox

def test_sandbox_network_call_blocked():
    code = "import urllib.request\nurllib.request.urlopen('http://example.com')"
    res = python_sandbox.execute(code)
    assert res["status"] == "blocked"
    assert "Security Violation" in res["stderr"]

def test_sandbox_socket_blocked():
    code = "import socket.socket\ns = socket.socket()\ns.connect(('1.1.1.1', 80))"
    res = python_sandbox.execute(code)
    assert res["status"] == "blocked"
    assert "Security Violation" in res["stderr"]

def test_sandbox_execution_timeout():
    code = "import time\ntime.sleep(15)"
    res = python_sandbox.execute(code, timeout_sec=2)
    assert res["status"] == "timeout"
    assert "timed out" in res["stderr"]

def test_sandbox_valid_calculation():
    code = "x = 142.8 - 120.0\nprint(f'Calculated delta: {x:.2f}')"
    res = python_sandbox.execute(code)
    assert res["status"] == "success"
    assert "Calculated delta: 22.80" in res["stdout"]
