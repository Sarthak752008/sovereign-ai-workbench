# Quick Verification Guide - Sovereign AI Workbench Improvements

This guide walks you through verifying that all the fixes are working correctly.

---

## Prerequisites

Ensure both backend and frontend are running:

```bash
# Terminal 1: Backend
cd backend
python -m app.main
# Should show: "Uvicorn running on http://127.0.0.1:8000"

# Terminal 2: Frontend
cd frontend
npm run dev
# Should show: "Local: http://localhost:5173"
```

Backend API docs available at: http://localhost:8000/docs

---

## Automated Verification (Recommended)

Run the comprehensive test suite:

```bash
python test_improvements.py
```

This will automatically test:
- ✓ Reset endpoint working
- ✓ Document upload and RAG indexing
- ✓ PDF summary quality
- ✓ C++ code generation
- ✓ RAG search accuracy
- ✓ Session reset clearing

Expected output: **6/6 tests passed**

---

## Manual Verification

### TEST 1: Refresh/Reset Button

**Goal**: Verify the "New Report / Refresh Session" button works

1. Open http://localhost:5173 in browser
2. Click "Upload PDF / SOP" and select any document
3. Verify: Upload success message appears
4. Type some text in the "Submit New Task" prompt field
5. Click the "New Report / Refresh Session" button (top banner or card header)
6. Verify:
   - ✓ Prompt text cleared
   - ✓ Upload status banner cleared/hidden
   - ✓ Active task state reset

**Expected Result**: Button clears all session state and resets UI for new report

---

### TEST 2: PDF Summarization Quality

**Goal**: Verify PDF summaries are detailed, not generic

1. Reset workbench (if needed)
2. Click "Upload PDF / SOP" and upload `sample_data/Safety_SOP_Standard_Procedure.txt`
3. See success message: "Uploaded & processed ... (X pages). Local vector RAG index updated."
4. In "Submit New Task" field, type: `short summary do`
5. Click "Execute Sovereign Task"
6. Verify output contains:
   - ✓ Structured headings like "Executive Summary Report"
   - ✓ Sections like "Document Analysis & Key Findings"
   - ✓ Key points extracted from document
   - ✓ Assessment with specific details
   - ✓ **NO approval gate** - task completes immediately

**Expected Result**: 
- Detailed summary with document content
- No approval required
- Task status shows "completed"

---

### TEST 3: C++ Code Generation

**Goal**: Verify complete, runnable C++ code is generated

1. Click "New Report / Refresh Session" to start fresh
2. In "Submit New Task" field, type: `array code in c++`
3. Click "Execute Sovereign Task"
4. Verify output contains:
   - ✓ `#include <iostream>` and other headers
   - ✓ `int main()` function
   - ✓ Array declaration: `int arr[5] = {45, 12, 89, 33, 67};`
   - ✓ Array operations (traversal, sum, max, min)
   - ✓ Sorting and reverse iteration
   - ✓ Well-commented code with explanations
   - ✓ Compilation instructions
   - ✓ **NO approval gate** - output immediate
   - ✓ **NO generic fallback** - full working code

**Expected Result**:
- Complete, professional C++ code
- 50+ lines of actual code, not template
- Copy button works to copy code
- Task completes without approval

**Bonus Verification**:
Copy the C++ code and test it:
```bash
# Save the code to a file
# Compile: g++ -std=c++17 -o array_demo array_demo.cpp
# Run: ./array_demo
# Should output array elements, sum, max, min, sorted array, reverse order
```

---

### TEST 4: No Unnecessary Approval Gates

**Goal**: Verify simple tasks don't require approval

Run these tasks and verify none show approval gates:

1. `short summary do` - Should complete without approval
2. `array code in c++` - Should complete without approval  
3. `write a python script for data analysis` - Should complete without approval
4. `explain the zig-zag traversal pattern` - Should complete without approval

**When Approval IS Required**:
- Only when you explicitly ask: `run code in sandbox` or `execute python`
- Example: `"create a python script and execute it in the sandbox"`

**Expected Result**: 
- Simple summarization/coding tasks → Direct output
- Only explicit sandbox requests → Approval gate

---

### TEST 5: RAG Search Prioritizes Uploaded Documents

**Goal**: Verify RAG retrieval returns uploaded documents first

1. Upload a document (PDF, DOCX, or TXT)
2. Open browser DevTools (F12) and go to Console tab
3. Run this API call:
```javascript
fetch('/api/v1/knowledge/search', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: "short summary do", top_k: 5})
}).then(r => r.json()).then(results => console.log(results))
```

4. Verify:
   - ✓ Top results are from your uploaded document
   - ✓ Not "Safety_SOP_Standard_Procedure.pdf" chunks
   - ✓ Chunks contain actual document text

**Expected Result**:
- Uploaded document chunks appear first
- RAG search correctly prioritizes relevant documents

---

### TEST 6: Session Reset Clears Everything

**Goal**: Verify reset clears all session state

1. Upload a document
2. Create a task (e.g., "summarize this")
3. Open browser DevTools → Network tab
4. Check Tasks endpoint: 
```
GET /api/v1/tasks
```
Should show at least one task

5. Click "New Report / Refresh Session"
6. In Network tab, see POST to `/api/v1/workbench/reset`
7. Check Tasks endpoint again:
```
GET /api/v1/tasks  
```
Should return empty list `[]`

8. Verify:
   - ✓ Vector index cleared (can upload new document)
   - ✓ Tasks cleared
   - ✓ Approvals cleared
   - ✓ UI state reset (prompt, notifications)

**Expected Result**:
- All session data cleared
- Can start fresh new report
- No previous context persists

---

## Expected Behavior Comparison

### BEFORE (Issues):
```
Upload PDF → Ask "short summary do"
  → ❌ Forced approval gate
  → ❌ Generic fallback text
  → ❌ No actual document content
  ✗ Result: Poor user experience

No PDF → Ask "array code in c++"
  → ❌ Generic or incomplete code
  ✗ Result: Not useful
```

### AFTER (Fixed):
```
Upload PDF → Ask "short summary do"
  → ✓ Direct execution (no approval)
  → ✓ Structured summary
  → ✓ Actual document content used
  ✓ Result: Useful summary immediately

No PDF → Ask "array code in c++"
  → ✓ Complete, runnable code
  → ✓ 50+ lines with comments
  → ✓ Includes explanations
  ✓ Result: Production-ready code
```

---

## Troubleshooting

### Problem: PDF summary still shows generic text
**Solution**: 
- Verify document uploaded successfully (check upload banner)
- Verify RAG index has chunks: `/api/v1/knowledge/chunks`
- Clear browser cache and refresh
- Run `test_improvements.py` → "Document Upload" test

### Problem: Approval gate still appearing for simple tasks
**Solution**:
- Check prompt doesn't contain: "python sandbox", "execute python"
- Use simple prompts: "array code in c++", "short summary do"
- Approval only for explicit sandbox requests

### Problem: Reset button not clearing tasks
**Solution**:
- Check backend console for errors
- Verify reset endpoint responds with `{status: "success"}`
- Refresh page after clicking reset
- Check backend logs: `WORKBENCH_RESET` event

### Problem: C++ code still not complete
**Solution**:
- Backend might be offline (should fallback to local generation)
- Check `/api/v1/health` returns `{status: "ok"}`
- Restart backend: `python -m app.main`
- Test with API docs: http://localhost:8000/docs → Try it Out

---

## Success Checklist

After running all tests, you should have:

- [x] Reset button visible and functional
- [x] PDF summaries detailed and document-specific
- [x] C++ code complete and runnable
- [x] No unnecessary approval gates for simple tasks
- [x] Upload notification appears and can be cleared
- [x] Vector index updated with new documents
- [x] RAG search prioritizes uploaded documents
- [x] All `test_improvements.py` tests passing

---

## Performance Notes

**Expected Timings**:
- Document upload: < 1 second
- Task execution: 1-2 seconds
- RAG search: < 500ms
- Reset operation: < 100ms

If operations are slower:
- Check backend logs for errors
- Verify no other heavy processes running
- Restart backend and frontend

---

## Next Steps

1. **Run automated tests**: `python test_improvements.py`
2. **Manual verification**: Follow TEST 1-6 above
3. **Test your workflows**: Upload your PDFs and run your tasks
4. **Report any issues**: Check logs and error messages

For questions or issues, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Detailed technical changes
- `backend/app/main.py` - FastAPI setup
- Backend logs - Error diagnostics

---

**Ready to verify?** Start with the automated tests, then proceed through manual verification steps!
