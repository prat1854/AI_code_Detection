import pytest
from app.models.schemas import (
    ExplainRequest, IssueContext, FixRequest, ReviewRequest
)
from app.providers.heuristic_provider import HeuristicProvider
from app.providers.factory import get_ai_provider

@pytest.mark.asyncio
async def test_heuristic_provider_explain():
    provider = HeuristicProvider()
    req = ExplainRequest(
        code="const q = 'SELECT * FROM users WHERE id=' + id;",
        language="javascript",
        issue=IssueContext(
            id="test-1",
            ruleId="security-sql-injection",
            title="SQL Injection",
            line=1,
            message="Unsanitized concatenation"
        )
    )
    res = await provider.explain_issue(req)
    assert res.title == "SQL Injection"
    assert "remediation" in res.suggestedFix.lower() or "secure" in res.suggestedFix.lower()
    assert res.source == "ai-heuristic-engine"

@pytest.mark.asyncio
async def test_heuristic_provider_fix_sqli():
    provider = HeuristicProvider()
    code = "  const query = 'SELECT * FROM users WHERE id=' + id;"
    req = FixRequest(
        code=code,
        language="javascript",
        issue=IssueContext(
            id="test-1",
            ruleId="security-sql-injection",
            line=1,
            title="SQL Injection"
        )
    )
    res = await provider.generate_fix(req)
    assert "$1" in res.fixedCode
    assert "parameterized" in res.diffSummary.lower()
    assert res.confidence >= 0.9

@pytest.mark.asyncio
async def test_heuristic_provider_review():
    provider = HeuristicProvider()
    req = ReviewRequest(
        code="console.log('test');",
        language="javascript",
        issues=[]
    )
    res = await provider.review_code(req)
    assert res.readabilityScore > 80
    assert res.maintainabilityScore > 80
    assert len(res.recommendations) > 0

def test_provider_factory():
    provider = get_ai_provider()
    assert provider is not None
