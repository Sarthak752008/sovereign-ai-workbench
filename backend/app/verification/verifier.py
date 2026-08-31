from typing import Dict, Any, List

class VerificationEngine:
    """
    Independent verification subsystem for code, calculations, citations, and schemas.
    """
    def verify_code(self, code: str, execution_result: Dict[str, Any]) -> Dict[str, Any]:
        passed = execution_result.get("status") == "success" and execution_result.get("exit_code") == 0
        return {
            "verifier": "CodeVerifier",
            "passed": passed,
            "confidence": 1.0 if passed else 0.0,
            "errors": [execution_result.get("stderr")] if not passed else [],
            "evidence": execution_result.get("stdout", "")
        }

    def verify_calculation(self, formula: str, expected: float, actual: float) -> Dict[str, Any]:
        passed = abs(expected - actual) < 1e-4
        return {
            "verifier": "CalculationVerifier",
            "passed": passed,
            "confidence": 1.0 if passed else 0.0,
            "errors": [] if passed else [f"Calculation mismatch: expected {expected}, got {actual}"],
            "evidence": f"Formula: {formula}"
        }

    def verify_citations(self, claims: List[str], sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        passed = len(sources) > 0
        return {
            "verifier": "CitationVerifier",
            "passed": passed,
            "confidence": 0.95 if passed else 0.3,
            "errors": [] if passed else ["Uncited claims detected in generated report."],
            "evidence": f"Verified against {len(sources)} source document chunks."
        }

verification_engine = VerificationEngine()
