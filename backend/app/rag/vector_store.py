import os
import json
import logging
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

_PERSISTENCE_FILE = os.path.join(settings.VECTOR_DB_DIR, "chunks.json")


class LocalVectorStore:
    """
    Local-first vector knowledge index for confidential RAG.
    Stores document chunks and performs keyword-based relevance search.
    Persists chunks to JSON file so they survive restarts.
    """
    def __init__(self):
        self._chunks: List[Dict[str, Any]] = []
        self._load_persisted()
        if not self._chunks:
            self._initialize_defaults()

    def _initialize_defaults(self):
        """Initialize with default SOP for demo purposes."""
        self._chunks.append({
            "chunk_id": "SOP-17_p13",
            "filename": "Safety_SOP_Standard_Procedure.pdf",
            "text": (
                "SOP-17 Section 4.2: Pressure relief valve inspection must occur every "
                "90 days with documented calibration logs. Maximum Operating Pressure "
                "Ceiling: 120.0 PSI. Over-pressure Threshold: Any reading exceeding "
                "135.0 PSI constitutes a CRITICAL SAFETY DEVIATION."
            ),
            "page": 13,
        })
        self._persist()

    def _load_persisted(self):
        """Load chunks from JSON file if it exists."""
        if os.path.exists(_PERSISTENCE_FILE):
            try:
                with open(_PERSISTENCE_FILE, "r", encoding="utf-8") as f:
                    self._chunks = json.load(f)
                logger.info(f"Loaded {len(self._chunks)} RAG chunks from {_PERSISTENCE_FILE}")
            except (json.JSONDecodeError, OSError) as e:
                logger.warning(f"Could not load persisted chunks: {e}")
                self._chunks = []

    def _persist(self):
        """Save chunks to JSON file."""
        try:
            os.makedirs(os.path.dirname(_PERSISTENCE_FILE), exist_ok=True)
            with open(_PERSISTENCE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._chunks, f, ensure_ascii=False, indent=2)
        except OSError as e:
            logger.error(f"Failed to persist chunks: {e}")

    def ingest_document(self, doc_data: Dict[str, Any]):
        """Ingest document chunks, replacing any previous version of the same file."""
        filename = doc_data["filename"]
        self._chunks = [c for c in self._chunks if c["filename"] != filename]

        for idx, chunk_text in enumerate(doc_data["chunks"]):
            self._chunks.append({
                "chunk_id": f"{filename}_{idx}",
                "filename": filename,
                "text": chunk_text,
                "page": doc_data.get("pages", 1),
            })
        self._persist()

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search chunks by keyword overlap.
        Prioritizes user-uploaded documents over the default SOP.
        Returns all uploaded chunks for broad queries like summaries.
        """
        if not self._chunks:
            return []

        # Separate uploaded docs from default SOP
        uploaded = [c for c in self._chunks if c["filename"] != "Safety_SOP_Standard_Procedure.pdf"]
        default = [c for c in self._chunks if c["filename"] == "Safety_SOP_Standard_Procedure.pdf"]

        # If there are uploaded documents, prefer them for any query
        if uploaded:
            if not query or not query.strip():
                return uploaded[:top_k]

            query_lower = query.lower()
            query_words = set(query_lower.split())

            # Score each uploaded chunk
            scored = []
            for chunk in uploaded:
                text_words = set(chunk["text"].lower().split())
                overlap = len(query_words & text_words)
                score = overlap / max(len(query_words), 1)
                scored.append((score, chunk))

            # Also score default chunks but with penalty
            for chunk in default:
                text_words = set(chunk["text"].lower().split())
                overlap = len(query_words & text_words)
                score = (overlap / max(len(query_words), 1)) - 0.3
                scored.append((score, chunk))

            scored.sort(key=lambda x: x[0], reverse=True)
            results = [item[1] for item in scored[:top_k]]

            # If all scores are 0, still return uploaded chunks
            if all(s[0] <= 0 for s in scored[:top_k]):
                return uploaded[:top_k]

            return results

        # No uploaded docs — use default chunks with keyword search
        if not query or not query.strip():
            return default[:top_k]

        query_words = set(query.lower().split())
        scored = []
        for chunk in default:
            text_words = set(chunk["text"].lower().split())
            overlap = len(query_words & text_words)
            score = overlap / max(len(query_words), 1)
            scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:top_k]]

    def list_chunks(self) -> List[Dict[str, Any]]:
        """List all ingested chunks."""
        return self._chunks[:]

    def clear(self):
        """Clear all chunks and reset to default."""
        self._chunks.clear()
        self._initialize_defaults()
        # Remove persistence file on explicit reset
        if os.path.exists(_PERSISTENCE_FILE):
            try:
                os.remove(_PERSISTENCE_FILE)
            except OSError:
                pass
        self._initialize_defaults()


vector_store = LocalVectorStore()
