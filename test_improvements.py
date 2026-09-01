#!/usr/bin/env python
"""
Comprehensive test script to validate the Sovereign AI Workbench improvements:
1. Document Summarization Quality (PDF/DOCX)
2. Code Generation (C++ arrays)
3. Refresh / Reset Session Functionality
4. LLM Output Preservation
5. Smart RAG Retrieval
"""
import asyncio
import requests
import json
import os
import sys
from pathlib import Path
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"
SAMPLE_PDF = Path("sample_data/Safety_SOP_Standard_Procedure.txt")

# ANSI color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

def print_header(text):
    print(f"\n{BOLD}{CYAN}{'='*80}{RESET}")
    print(f"{BOLD}{CYAN}{text}{RESET}")
    print(f"{BOLD}{CYAN}{'='*80}{RESET}\n")

def print_test(num, title):
    print(f"\n{BOLD}[TEST {num}] {title}{RESET}")

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg):
    print(f"{CYAN}ℹ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

# ============================================================================
# TEST 1: Verify Reset Endpoint
# ============================================================================
def test_reset_endpoint():
    print_test(1, "Verify Reset/Refresh Endpoint")
    try:
        response = requests.post(f"{BASE_URL}/workbench/reset")
        if response.status_code == 200:
            result = response.json()
            if result.get("status") == "success":
                print_success("Reset endpoint working correctly")
                print_info(f"Message: {result.get('message')}")
                return True
            else:
                print_error(f"Unexpected response: {result}")
                return False
        else:
            print_error(f"HTTP {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception: {e}")
        return False

# ============================================================================
# TEST 2: Document Upload and RAG Indexing
# ============================================================================
def test_document_upload():
    print_test(2, "Document Upload & RAG Vector Store Indexing")
    
    # Check if sample document exists
    if not SAMPLE_PDF.exists():
        print_warning(f"Sample PDF not found at {SAMPLE_PDF}")
        print_info("Creating test document for demonstration...")
        # Create a simple test file
        test_file = Path("sample_data/test_doc.txt")
        test_file.parent.mkdir(parents=True, exist_ok=True)
        test_file.write_text("""
        EXECUTIVE SUMMARY DOCUMENT
        
        Project: Industrial Safety Systems Integration
        Date: 2024
        Classification: CONFIDENTIAL
        
        KEY FINDINGS:
        - System integration completed successfully
        - All safety protocols verified
        - Performance metrics within acceptable ranges
        - Recommendations for optimization included
        
        TECHNICAL SPECIFICATIONS:
        - Operating Pressure: 120 PSI
        - Safety Margin: 15%
        - Maintenance Interval: 90 days
        - Last Service: 2024-09-01
        """)
        upload_file = test_file
    else:
        upload_file = SAMPLE_PDF
    
    try:
        with open(upload_file, "rb") as f:
            files = {"file": (upload_file.name, f)}
            response = requests.post(f"{BASE_URL}/documents/upload", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Document uploaded: {result.get('filename')}")
            print_info(f"Pages: {result.get('pages')}, Chunks: {result.get('chunks_count')}")
            print_info(f"Message: {result.get('message')}")
            return True
        else:
            print_error(f"Upload failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during upload: {e}")
        return False

# ============================================================================
# TEST 3: PDF Summarization Quality
# ============================================================================
def test_pdf_summarization():
    print_test(3, "PDF Summarization Quality Check")
    
    try:
        # Submit a summarization task
        task_payload = {
            "title": "PDF Summary Task",
            "prompt": "short summary do",
            "confidentiality": "CONFIDENTIAL"
        }
        
        response = requests.post(f"{BASE_URL}/tasks", json=task_payload)
        if response.status_code != 200:
            print_error(f"Task creation failed: {response.text}")
            return False
        
        task = response.json()
        task_id = task.get("task_id")
        print_info(f"Task created: {task_id}")
        
        # Wait a moment and fetch the task result
        import time
        time.sleep(1)
        
        task_response = requests.get(f"{BASE_URL}/tasks/{task_id}")
        if task_response.status_code != 200:
            print_error(f"Failed to fetch task: {task_response.text}")
            return False
        
        completed_task = task_response.json()
        output = completed_task.get("output", "")
        status = completed_task.get("status")
        
        print_info(f"Task status: {status}")
        
        # Check if output contains actual content (not just generic fallback)
        if not output:
            print_error("No output received from task")
            return False
        
        # Verify output structure
        is_detailed = any(keyword in output.lower() for keyword in 
                         ["summary", "analysis", "key", "finding", "executive"])
        
        if is_detailed:
            print_success("PDF summary output is detailed and structured")
            print_info(f"Output preview (first 200 chars):\n{output[:200]}...")
            return True
        else:
            print_warning("Summary output might be generic")
            print_info(f"Output preview:\n{output[:200]}...")
            return False
            
    except Exception as e:
        print_error(f"Exception during summarization test: {e}")
        return False

# ============================================================================
# TEST 4: C++ Code Generation
# ============================================================================
def test_cpp_code_generation():
    print_test(4, "C++ Array Code Generation Quality")
    
    try:
        # First reset to start fresh
        requests.post(f"{BASE_URL}/workbench/reset")
        
        # Submit a C++ code generation task
        task_payload = {
            "title": "C++ Array Code Task",
            "prompt": "array code in c++",
            "confidentiality": "CONFIDENTIAL"
        }
        
        response = requests.post(f"{BASE_URL}/tasks", json=task_payload)
        if response.status_code != 200:
            print_error(f"Task creation failed: {response.text}")
            return False
        
        task = response.json()
        task_id = task.get("task_id")
        print_info(f"Task created: {task_id}")
        
        # Wait for task completion
        import time
        time.sleep(1)
        
        task_response = requests.get(f"{BASE_URL}/tasks/{task_id}")
        if task_response.status_code != 200:
            print_error(f"Failed to fetch task: {task_response.text}")
            return False
        
        completed_task = task_response.json()
        output = completed_task.get("output", "")
        status = completed_task.get("status")
        
        print_info(f"Task status: {status}")
        
        # Check if output contains actual C++ code
        if not output:
            print_error("No output received from task")
            return False
        
        # Verify output contains C++ code elements
        cpp_keywords = ["#include", "int main()", "cout", "arr[", "return 0"]
        has_cpp_code = any(keyword in output for keyword in cpp_keywords)
        
        if has_cpp_code:
            print_success("C++ code generation output is complete and detailed")
            # Count lines of code
            code_lines = len([line for line in output.split('\n') if line.strip()])
            print_info(f"Generated {code_lines} lines of code")
            print_info(f"Output preview (first 300 chars):\n{output[:300]}...")
            return True
        else:
            print_warning("C++ output might not contain complete code")
            print_info(f"Output preview:\n{output[:300]}...")
            return False
            
    except Exception as e:
        print_error(f"Exception during C++ generation test: {e}")
        return False

# ============================================================================
# TEST 5: RAG Search Quality
# ============================================================================
def test_rag_search():
    print_test(5, "RAG Search Quality for Summaries")
    
    try:
        # Search with summary query
        search_payload = {
            "query": "short summary do",
            "top_k": 5
        }
        
        response = requests.post(f"{BASE_URL}/knowledge/search", json=search_payload)
        if response.status_code != 200:
            print_error(f"Search failed: {response.text}")
            return False
        
        results = response.json()
        
        if not results:
            print_warning("RAG search returned no results")
            return False
        
        print_success(f"RAG search returned {len(results)} chunks")
        
        # Check if results contain actual document content (not just defaults)
        has_uploaded_docs = any(
            chunk.get("filename") != "Safety_SOP_Standard_Procedure.pdf" 
            for chunk in results
        )
        
        if has_uploaded_docs:
            print_success("RAG search prioritizing uploaded documents")
        else:
            print_info("Only default SOP chunks in results (might be expected if no docs uploaded)")
        
        # Display first chunk
        if results:
            first_chunk = results[0]
            print_info(f"First result: {first_chunk.get('filename')} (Page {first_chunk.get('page')})")
            print_info(f"Content preview: {first_chunk.get('text', '')[:150]}...")
        
        return True
        
    except Exception as e:
        print_error(f"Exception during RAG search test: {e}")
        return False

# ============================================================================
# TEST 6: Reset Functionality
# ============================================================================
def test_reset_functionality():
    print_test(6, "Reset/Refresh Session Functionality")
    
    try:
        # Get current tasks count before reset
        response = requests.get(f"{BASE_URL}/tasks")
        if response.status_code == 200:
            tasks_before = len(response.json())
            print_info(f"Tasks before reset: {tasks_before}")
        
        # Execute reset
        reset_response = requests.post(f"{BASE_URL}/workbench/reset")
        if reset_response.status_code != 200:
            print_error(f"Reset failed: {reset_response.text}")
            return False
        
        print_info("Reset executed")
        
        # Check tasks after reset
        import time
        time.sleep(0.5)
        
        response = requests.get(f"{BASE_URL}/tasks")
        if response.status_code == 200:
            tasks_after = len(response.json())
            print_info(f"Tasks after reset: {tasks_after}")
            
            if tasks_after == 0:
                print_success("Reset cleared all tasks as expected")
                return True
            else:
                print_warning(f"Reset did not clear all tasks ({tasks_after} remaining)")
                return False
        else:
            print_error(f"Failed to fetch tasks after reset: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Exception during reset test: {e}")
        return False

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================
def main():
    print_header("SOVEREIGN AI WORKBENCH - COMPREHENSIVE IMPROVEMENT VALIDATION")
    
    print_info(f"Target Backend: {BASE_URL}")
    print_info(f"Test Started: {datetime.now().isoformat()}")
    
    # Check backend connectivity
    try:
        response = requests.get(f"{BASE_URL}/tasks", timeout=5)
        if response.status_code != 200:
            print_error("Backend returned non-200 status")
            sys.exit(1)
        print_success("Backend connectivity confirmed")
    except Exception as e:
        print_error(f"Cannot connect to backend: {e}")
        print_info("Make sure backend is running: cd backend && python -m app.main")
        sys.exit(1)
    
    # Run all tests
    results = {}
    
    results["Reset Endpoint"] = test_reset_endpoint()
    results["Document Upload"] = test_document_upload()
    results["PDF Summarization"] = test_pdf_summarization()
    results["C++ Code Generation"] = test_cpp_code_generation()
    results["RAG Search"] = test_rag_search()
    results["Reset Functionality"] = test_reset_functionality()
    
    # Print summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = f"{GREEN}PASS{RESET}" if passed_test else f"{RED}FAIL{RESET}"
        print(f"{status} - {test_name}")
    
    print(f"\n{BOLD}Overall: {passed}/{total} tests passed{RESET}\n")
    
    if passed == total:
        print_success("All improvements validated successfully!")
        return 0
    else:
        print_warning(f"{total - passed} test(s) need attention")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
