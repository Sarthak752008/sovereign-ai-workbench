import os
import tempfile
from app.ingest.document_processor import document_processor
from app.rag.vector_store import vector_store

def test_document_processor_text_file():
    with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".txt") as f:
        f.write("SOP Section 4: Pressure relief valves must be calibrated every 90 days.")
        f_path = f.name

    doc_data = document_processor.process_file(f_path, "sop_test.txt")
    assert doc_data["filename"] == "sop_test.txt"
    assert doc_data["pages"] == 1
    assert "calibrated every 90 days" in doc_data["extracted_text"]
    os.remove(f_path)

def test_text_chunking():
    long_text = "word " * 1200
    chunks = document_processor._chunk_text(long_text, chunk_size=500)
    assert len(chunks) == 3

def test_rag_ingest_and_search():
    doc_data = {
        "filename": "Refinery_Manual.pdf",
        "chunks": [
            "Section 1: Operating temperature ceiling is 450 degrees Celsius.",
            "Section 2: Emergency shutdown valve location is Terminal 4."
        ]
    }
    vector_store.ingest_document(doc_data)
    results = vector_store.search("emergency shutdown valve", top_k=1)
    assert len(results) >= 1
    assert "Refinery_Manual.pdf" in results[0]["filename"]
    assert "Terminal 4" in results[0]["text"]

def test_rag_search_no_match_citation_fallback():
    results = vector_store.search("nonexistent query term xyz123")
    assert len(results) >= 1
    assert results[0]["page"] is not None

def test_document_processor_fallback_non_text():
    doc_data = document_processor.process_file("dummy.unknown", "dummy.unknown")
    assert doc_data["filename"] == "dummy.unknown"
    assert doc_data["pages"] == 1

def test_rag_chunk_id_structure():
    doc_data = {
        "filename": "Test_Doc.txt",
        "chunks": ["Chunk text content test."]
    }
    vector_store.ingest_document(doc_data)
    results = vector_store.search("Chunk text content", top_k=1)
    assert results[0]["chunk_id"].startswith("Test_Doc.txt")
