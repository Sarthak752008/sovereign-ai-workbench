import hashlib
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from app.schemas.workbench import AuditEvent

class AuditLedger:
    """
    Append-only tamper-evident hash-chained audit ledger.
    Every action generates a cryptographic SHA-256 hash linked to the previous entry.
    """
    def __init__(self):
        self._events: List[AuditEvent] = []
        self._last_hash: str = "GENESIS_SOVEREIGN_HASH_0000000000000000"

    def record_event(
        self,
        action: str,
        actor: str = "operator",
        model_used: str = None,
        tool_used: str = None,
        document: str = None,
        details: Dict[str, Any] = None
    ) -> AuditEvent:
        event_id = str(uuid.uuid4())
        timestamp = datetime.utcnow()
        details_payload = details or {}
        
        # Calculate SHA-256 hash over event contents + prev_hash
        payload_str = f"{event_id}|{timestamp.isoformat()}|{action}|{actor}|{model_used}|{tool_used}|{document}|{json.dumps(details_payload, sort_keys=True)}|{self._last_hash}"
        current_hash = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
        
        event = AuditEvent(
            event_id=event_id,
            timestamp=timestamp,
            action=action,
            actor=actor,
            model_used=model_used,
            tool_used=tool_used,
            document=document,
            hash=current_hash,
            prev_hash=self._last_hash,
            details=details_payload
        )
        
        self._last_hash = current_hash
        self._events.append(event)
        return event

    def get_events(self) -> List[AuditEvent]:
        return self._events

    def verify_ledger_integrity(self) -> bool:
        prev = "GENESIS_SOVEREIGN_HASH_0000000000000000"
        for ev in self._events:
            if ev.prev_hash != prev:
                return False
            payload_str = f"{ev.event_id}|{ev.timestamp.isoformat()}|{ev.action}|{ev.actor}|{ev.model_used}|{ev.tool_used}|{ev.document}|{json.dumps(ev.details, sort_keys=True)}|{ev.prev_hash}"
            calc_hash = hashlib.sha256(payload_str.encode('utf-8')).hexdigest()
            if calc_hash != ev.hash:
                return False
            prev = ev.hash
        return True

audit_ledger = AuditLedger()
