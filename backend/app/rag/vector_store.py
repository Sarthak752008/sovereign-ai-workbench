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
        Search documents using keyword matching + improved ranking.
        For summarization queries, prioritizes uploaded non-default document chunks.
        Returns top-k most relevant chunks based on query context.
        """
        if not self._chunks:
            return []

        query_lower = query.lower() if query else ""
        sum_keywords = ["summary", "summarize", "overview", "brief", "short summary", "explain", "detail", "pdf", "report", "onepager", "document"]
        is_summary_query = any(k in query_lower for k in sum_keywords)

        # For summary queries: prioritize uploaded documents (ignore default SOP unless it's the only content)
        if is_summary_query:
            uploaded_chunks = [c for c in self._chunks if c["filename"] != "Safety_SOP_Standard_Procedure.pdf"]
            if uploaded_chunks:
                # Return all uploaded document chunks sorted by filename (stable order)
                return sorted(uploaded_chunks, key=lambda x: x.get("chunk_id", ""))[:top_k]
            # Fallback to default if no uploaded docs
            return self._chunks[:top_k]

        # Empty or whitespace-only queries: return top-k chunks by default
        if not query or not query.strip():
            return self._chunks[:top_k]
        
        # Keyword-based search for non-summary queries
        query_words = set(query_lower.split())
        scored = []
        
        for chunk in self._chunks:
            text_words = set(chunk["text"].lower().split())
            overlap = len(query_words.intersection(text_words))
            # Give bonus to uploaded non-default docs
            doc_bonus = 0.5 if chunk["filename"] != "Safety_SOP_Standard_Procedure.pdf" else 0.0
            score = (overlap / max(len(query_words), 1)) + doc_bonus
            scored.append((score, chunk))
        
        # Sort by relevance score (highest first)
        scored.sort(key=lambda x: x[0], reverse=True)
        
        results = [item[1] for item in scored[:top_k]]
        return results if results else self._chunks[:top_k]

    def list_chunks(self) -> List[Dict[str, Any]]:
        """List all ingested chunks"""
        return self._chunks if self._chunks else []

    def clear(self):
        """Clear all chunks and reset to default SOP"""
        self._chunks = []
        self._initialize_defaults()

vector_store = LocalVectorStore()
