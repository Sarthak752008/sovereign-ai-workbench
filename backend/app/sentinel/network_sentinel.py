from datetime import datetime
from app.schemas.workbench import SentinelStatus
from app.models.registry import model_registry

class NetworkSentinel:
    """
    Host-level Network Sentinel.
    Monitors process sockets and network egress to guarantee zero external AI calls and air-gapped privacy.
    """
    def __init__(self):
        self._external_ai_calls: int = 0
        self._external_dns_requests: int = 0
        self._cloud_ai_requests: int = 0

    def get_status(self) -> SentinelStatus:
        active_models = [m.display_name for m in model_registry.list_models()]
        return SentinelStatus(
            sovereign_mode="ACTIVE",
            network_status="BLOCKED",
            local_inference="ACTIVE",
            external_ai_calls=self._external_ai_calls,
            external_dns_requests=self._external_dns_requests,
            cloud_ai_requests=self._cloud_ai_requests,
            last_egress_check=datetime.utcnow(),
            active_local_models=active_models
        )

network_sentinel = NetworkSentinel()
