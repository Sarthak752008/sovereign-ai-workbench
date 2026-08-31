from app.verification.verifier import verification_engine

def test_code_verifier_success():
    result = verification_engine.verify_code(
        code="print('Hello')",
        execution_result={"status": "success", "exit_code": 0, "stdout": "Hello\n", "stderr": ""}
    )
    assert result["verifier"] == "CodeVerifier"
    assert result["passed"] is True
    assert result["confidence"] == 1.0

def test_code_verifier_failure():
    result = verification_engine.verify_code(
        code="import missing_mod",
        execution_result={"status": "error", "exit_code": 1, "stdout": "", "stderr": "ModuleNotFoundError"}
    )
    assert result["passed"] is False
    assert result["confidence"] == 0.0
    assert "ModuleNotFoundError" in result["errors"][0]

def test_calculation_verifier_pass():
    result = verification_engine.verify_calculation(
        formula="P_delta = (142.8 - 120.0) / 120.0",
        expected=0.19,
        actual=0.190001
    )
    assert result["verifier"] == "CalculationVerifier"
    assert result["passed"] is True

def test_calculation_verifier_fail():
    result = verification_engine.verify_calculation(
        formula="P_delta = (142.8 - 120.0) / 120.0",
        expected=0.19,
        actual=0.35
    )
    assert result["passed"] is False
    assert len(result["errors"]) >= 1

def test_citation_verifier_with_sources():
    result = verification_engine.verify_citations(
        claims=["Pressure variance is 19%"],
        sources=[{"filename": "SOP-17.pdf", "page": 13}]
    )
    assert result["verifier"] == "CitationVerifier"
    assert result["passed"] is True
    assert result["confidence"] == 0.95

def test_citation_verifier_without_sources():
    result = verification_engine.verify_citations(
        claims=["Uncited claim"],
        sources=[]
    )
    assert result["passed"] is False
    assert "Uncited claims" in result["errors"][0]
