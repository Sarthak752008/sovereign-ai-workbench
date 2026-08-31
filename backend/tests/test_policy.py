from app.security.policy_engine import policy_engine
from app.schemas.workbench import ConfidentialityLevel, TaskType

def test_policy_python_exec_requires_approval():
    eval_res = policy_engine.evaluate(
        task_prompt="Run python script to calculate metrics",
        confidentiality=ConfidentialityLevel.INTERNAL,
        tool_name="python.exec"
    )
    assert eval_res.decision == "REQUIRE_APPROVAL"
    assert eval_res.rule_id == "RULE_001_HIGH_RISK_TOOL_HITL"

def test_policy_file_delete_requires_approval():
    eval_res = policy_engine.evaluate(
        task_prompt="Delete temporary log file",
        confidentiality=ConfidentialityLevel.INTERNAL,
        tool_name="file.delete"
    )
    assert eval_res.decision == "REQUIRE_APPROVAL"

def test_policy_highly_confidential_verification():
    eval_res = policy_engine.evaluate(
        task_prompt="Analyze defense technical drawing",
        confidentiality=ConfidentialityLevel.HIGHLY_CONFIDENTIAL,
        action_name="task_execution"
    )
    assert eval_res.decision == "ALLOW_WITH_VERIFICATION"

def test_policy_restricted_verification():
    eval_res = policy_engine.evaluate(
        task_prompt="Inspect refinery SOP",
        confidentiality=ConfidentialityLevel.RESTRICTED,
        action_name="task_execution"
    )
    assert eval_res.decision == "ALLOW_WITH_VERIFICATION"

def test_policy_default_allow():
    eval_res = policy_engine.evaluate(
        task_prompt="Summarize public report",
        confidentiality=ConfidentialityLevel.PUBLIC,
        action_name="read_file"
    )
    assert eval_res.decision == "ALLOW"

def test_policy_timestamp_created():
    eval_res = policy_engine.evaluate(
        task_prompt="Check policy",
        confidentiality=ConfidentialityLevel.INTERNAL
    )
    assert eval_res.timestamp is not None
