#!/usr/bin/env python
"""
Comprehensive test script to validate:
1. DOCX document processing (extract real content, not placeholder)
2. RAG vector store (return ingested documents, not hardcoded fallback)
3. Document upload endpoint (return proper response data)
4. Task execution (use actual RAG results in reports)
"""
import requests
import json
import time
from pathlib import Path

BASE_URL = "http://localhost:8000/api/v1"

print("="*80)
print("SOVEREIGN AI WORKBENCH - DOCUMENT PROCESSING FIX VALIDATION")
print("="*80)

# Test 1: List existing documents
print("\n[TEST 1] List existing documents...")
response = requests.get(f"{BASE_URL}/documents")
try:
    docs = response.json()
    if isinstance(docs, list):
        print(f"✓ Found {len(docs)} documents")
        for doc in docs:
            if isinstance(doc, dict):
                print(f"  - {doc.get('filename', 'unknown')} ({doc.get('size_bytes', 0)} bytes)")
    else:
        print(f"✓ Response: {docs}")
except Exception as e:
    print(f"Response type issue: {e}")

# Test 2: Upload DOCX file
print("\n[TEST 2] Upload DOCX file...")
docx_path = Path("backend/data/workspaces/Lab_Assignment_Test.docx")
if not docx_path.exists():
    print("✗ Test DOCX file not found!")
else:
    with open(docx_path, "rb") as f:
        files = {"file": (docx_path.name, f)}
        response = requests.post(f"{BASE_URL}/documents/upload", files=files)
        upload_result = response.json()
        print(f"✓ Upload response:")
        print(f"  Status: {upload_result.get('status')}")
        print(f"  Filename: {upload_result.get('filename')}")
        print(f"  Pages: {upload_result.get('pages')}")
        print(f"  Chunks: {upload_result.get('chunks_count')}")
        print(f"  Message: {upload_result.get('message')}")
        print(f"\n  Preview of extracted content:")
        preview = upload_result.get('extracted_text', '')[:300]
        print(f"  {preview}...")

# Test 3: List knowledge chunks (should include DOCX content)
print("\n[TEST 3] List knowledge chunks from vector store...")
response = requests.get(f"{BASE_URL}/knowledge/chunks")
chunks = response.json()
print(f"✓ Found {len(chunks)} chunks in vector store")

# Find chunks from our DOCX
docx_chunks = [c for c in chunks if "Lab_Assignment_Test.docx" in c.get("filename", "")]
print(f"\n  Chunks from Lab_Assignment_Test.docx: {len(docx_chunks)}")
if docx_chunks:
    print(f"\n  First chunk preview:")
    print(f"  Chunk ID: {docx_chunks[0].get('chunk_id')}")
    print(f"  Filename: {docx_chunks[0].get('filename')}")
    print(f"  Content: {docx_chunks[0].get('text', '')[:200]}...")
else:
    print("  ✗ No chunks from DOCX found!")

# Test 4: Test RAG search
print("\n[TEST 4] Test RAG search for DOCX content...")
search_payload = {
    "query": "Lab Assignment DOCX processing test",
    "top_k": 5
}
response = requests.post(f"{BASE_URL}/knowledge/search", json=search_payload)
results = response.json()
print(f"✓ Search returned {len(results)} results")

# Check if DOCX content is in results
docx_results = [r for r in results if "Lab_Assignment_Test.docx" in r.get("filename", "")]
print(f"\n  Results from Lab_Assignment_Test.docx: {len(docx_results)}")
if docx_results:
    print(f"  ✓ DOCX content found in search results!")
    for r in docx_results[:2]:
        print(f"\n    - {r.get('filename')} (Page {r.get('page')})")
        print(f"      Text: {r.get('text', '')[:150]}...")
else:
    print(f"  ✗ No DOCX content in search results")
    print(f"  Results showing:")
    for r in results[:2]:
        print(f"    - {r.get('filename')}: {r.get('text', '')[:100]}...")

# Test 5: Create task and verify it uses RAG results
print("\n[TEST 5] Create task referencing Lab Assignment...")
task_payload = {
    "title": "Analyze Lab Assignment Document",
    "prompt": "Please analyze the Lab Assignment DOCX document and extract key findings about document processing",
    "confidentiality": "INTERNAL"
}
response = requests.post(f"{BASE_URL}/tasks", json=task_payload)
if response.status_code == 200:
    task = response.json()
    task_id = task.get("task_id")
    print(f"✓ Task created: {task_id}")
    print(f"  Title: {task.get('title')}")
    print(f"  Status: {task.get('status')}")
    print(f"  Current Step: {task.get('current_step')}")
    
    # Wait a bit for task execution
    print("\n  Waiting for task execution...")
    time.sleep(2)
    
    # Get task status
    response = requests.get(f"{BASE_URL}/tasks/{task_id}")
    if response.status_code == 200:
        task = response.json()
        print(f"\n  Updated Task Status:")
        print(f"    Status: {task.get('status')}")
        print(f"    Current Step: {task.get('current_step')}")
        output = task.get('output') or ''
        print(f"    Output Preview: {output[:300] if output else '[No output yet]'}...")
        
        # If waiting for approval, approve it
        if task.get('status') == 'WAITING_APPROVAL':
            print(f"\n  Task waiting for approval. Getting approvals...")
            response = requests.get(f"{BASE_URL}/approvals")
            approvals = response.json()
            if approvals:
                approval = approvals[0] if isinstance(approvals, list) else approvals
                if isinstance(approval, dict) and 'approval_id' in approval:
                    approval_id = approval['approval_id']
                    print(f"    Approving task with approval ID: {approval_id}")
                    
                    approval_payload = {"approval_id": approval_id, "decision": "APPROVED"}
                    response = requests.post(f"{BASE_URL}/approvals/decide", json=approval_payload)
                    
                    if response.status_code == 200:
                        print(f"    ✓ Approval granted!")
                        
                        # Wait for task completion
                        time.sleep(2)
                        response = requests.get(f"{BASE_URL}/tasks/{task_id}")
                        if response.status_code == 200:
                            task = response.json()
                            print(f"\n    Final Task Status:")
                            print(f"      Status: {task.get('status')}")
                            print(f"      Current Step: {task.get('current_step')}")
                            output = task.get('output') or ''
                            print(f"      Output Preview: {output[:500] if output else '[No output]'}...")
                            
                            # Check if output references DOCX document
                            if output:
                                output_lower = output.lower()
                                if 'lab_assignment' in output_lower or 'docx' in output_lower:
                                    print(f"\n      ✓ Task output references uploaded document!")
                                else:
                                    print(f"\n      ? Task output may not reference document")
        
        # Check if output references DOCX document
        if output:
            output_lower = output.lower()
            if 'lab_assignment' in output_lower or 'docx' in output_lower:
                print(f"\n    ✓ Task output references document!")
            else:
                print(f"\n    ? Task output may not reference document - check manually")
    else:
        print(f"✗ Failed to get task status: {response.status_code}")


# Test 6: Verify audit logs
print("\n[TEST 6] Check audit logs for document processing events...")
response = requests.get(f"{BASE_URL}/audit/events")
events = response.json()
print(f"✓ Found {len(events)} audit events")

# Find document-related events
doc_events = [e for e in events if "DOCUMENT" in e.get("action", "") or "RAG" in e.get("action", "")]
print(f"\n  Document/RAG related events: {len(doc_events)}")
for event in doc_events[-5:]:  # Show last 5
    print(f"    - {event.get('action')}: {event.get('details', {})}")

print("\n" + "="*80)
print("VALIDATION TESTS COMPLETED")
print("="*80)
