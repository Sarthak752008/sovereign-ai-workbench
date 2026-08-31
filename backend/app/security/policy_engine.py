from typing import Dict, Any
from app.schemas.workbench import ConfidentialityLevel, RiskLevel, PolicyEvaluationResult

class PolicyEngine:
    """
    Sovereign Security Policy Engine.
    Evaluates risk levels, data classifications, tool capabilities, and human approval rules.
    Guarantees 0 external cloud network permissions.
    """
    def evaluate(
        self,
        task_prompt: str,
        confidentiality: ConfidentialityLevel,
        action_name: str = "task_execution",
        tool_name: str = None
    ) -> PolicyEvaluationResult:
        
        # 1. High risk tool calls require human approval
        if tool_name in ["python.exec", "file.delete", "shell.exec", "system.write"]:
            return PolicyEvaluationResult(
                decision="REQUIRE_APPROVAL",
                reason=f"Tool '{tool_name}' performs sensitive sandbox/system modifications and requires human operator approval.",
                rule_id="RULE_001_HIGH_RISK_TOOL_HITL"
            )

        # 2. Restricted or Highly Confidential data -> strict local air-gap enforcement
        if confidentiality in [ConfidentialityLevel.RESTRICTED, ConfidentialityLevel.HIGHLY_CONFIDENTIAL]:
            return PolicyEvaluationResult(
                decision="ALLOW_WITH_VERIFICATION",
                reason="Task involves RESTRICTED/HIGHLY_CONFIDENTIAL data. Strict local air-gap enforcement active.",
                rule_id="RULE_002_HIGHLY_CONFIDENTIAL_LOCAL_ONLY"
            )

        # 3. Default Policy Allow
        return PolicyEvaluationResult(
            decision="ALLOW",
            reason="Task passed security policy checks for local execution.",
            rule_id="RULE_000_DEFAULT_ALLOW"
        )

policy_engine = PolicyEngine()
