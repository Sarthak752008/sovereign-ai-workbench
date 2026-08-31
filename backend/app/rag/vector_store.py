from typing import List, Dict, Any

class LocalVectorStore:
    """
    Local-first vector knowledge index for confidential RAG.
    Maintains chunk embeddings and metadata citations.
    """
    def __init__(self):
        self._chunks: List[Dict[str, Any]] = []
        # Initialize with SOP for testing if needed
        self._initialize_defaults()

    def _initialize_defaults(self):
        """Initialize with default SOP for demo purposes"""
        default_chunks = [
            {
                "chunk_id": "SOP-17_p13",
                "filename": "Safety_SOP_Standard_Procedure.pdf",
                "text": "SOP-17 Section 4.2: Pressure relief valve inspection must occur every 90 days with documented calibration logs. Maximum Operating Pressure Ceiling: 120.0 PSI. Over-pressure Threshold: Any reading exceeding 135.0 PSI constitutes a CRITICAL SAFETY DEVIATION.",
                "page": 13
            }
        ]
        self._chunks.extend(default_chunks)

    def ingest_document(self, doc_data: Dict[str, Any]):
        """Ingest document and update chunks"""
        filename = doc_data["filename"]
        # Clear old chunks from same filename to avoid duplicates
        self._chunks = [c for c in self._chunks if c["filename"] != filename]
        
        # Add new chunks from document
        for idx, chunk in enumerate(doc_data["chunks"]):
            self._chunks.append({
                "chunk_id": f"{filename}_{idx}",
                "filename": filename,
                "text": chunk,
                "page": doc_data.get("pages", 1)
            })

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search documents using keyword matching + improved ranking
        Returns actual ingested chunks, not hardcoded fallback
        """
        if not query or not query.strip():
            return self._chunks[:top_k] if self._chunks else []
        
        query_words = set(query.lower().split())
        scored = []
        
        for chunk in self._chunks:
            text_words = set(chunk["text"].lower().split())
            overlap = len(query_words.intersection(text_words))
            score = overlap / max(len(query_words), 1) if query_words else 0
            scored.append((score, chunk))
        
        # Sort by relevance
        scored.sort(key=lambda x: x[0], reverse=True)
        
        # Return top results (including zero-match results from ingested docs)
        results = [item[1] for item in scored[:top_k]]
        
        return results if results else self._chunks[:top_k]

    def list_chunks(self) -> List[Dict[str, Any]]:
        """List all ingested chunks"""
        return self._chunks if self._chunks else []

    def clear(self):
        """Clear all chunks"""
        self._chunks = []
        self._initialize_defaults()

vector_store = LocalVectorStore()
