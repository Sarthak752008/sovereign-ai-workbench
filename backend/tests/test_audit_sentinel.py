from app.audit.ledger import audit_ledger
from app.sentinel.network_sentinel import network_sentinel

def test_audit_ledger_record_and_hash_chain():
    initial_len = len(audit_ledger.get_events())
    ev1 = audit_ledger.record_event(action="TEST_ACTION_1", actor="operator", details={"param": 1})
    ev2 = audit_ledger.record_event(action="TEST_ACTION_2", actor="system", details={"param": 2})
    
    assert len(audit_ledger.get_events()) == initial_len + 2
    assert ev2.prev_hash == ev1.hash

def test_audit_ledger_verify_integrity():
    assert audit_ledger.verify_ledger_integrity() is True

def test_sentinel_status_metrics():
    status = network_sentinel.get_status()
    assert status.sovereign_mode == "ACTIVE"
    assert status.network_status == "BLOCKED"
    assert status.external_ai_calls == 0
    assert status.external_dns_requests == 0
    assert status.cloud_ai_requests == 0

def test_sentinel_active_local_models_list():
    status = network_sentinel.get_status()
    assert len(status.active_local_models) >= 4
    assert any("Qwen" in m for m in status.active_local_models)

def test_audit_ledger_unique_ids():
    ev1 = audit_ledger.record_event(action="UNIQUE_ID_TEST_1")
    ev2 = audit_ledger.record_event(action="UNIQUE_ID_TEST_2")
    assert ev1.event_id != ev2.event_id
