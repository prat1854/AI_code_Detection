from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IssueContext(BaseModel):
    id: Optional[str] = None
    ruleId: Optional[str] = None
    severity: Optional[str] = "medium"
    category: Optional[str] = "quality"
    title: Optional[str] = None
    line: Optional[int] = 1
    column: Optional[int] = 1
    message: Optional[str] = None
    explanation: Optional[str] = None
    risk: Optional[str] = None
    suggestion: Optional[str] = None
    source: Optional[str] = "deterministic"

class ExplainRequest(BaseModel):
    code: str
    language: str = "javascript"
    issue: IssueContext

class ExplainResponse(BaseModel):
    title: str
    whatIsWrong: str
    whyItMatters: str
    whatCouldHappen: str
    suggestedFix: str
    source: str = "ai-service"

class FixRequest(BaseModel):
    code: str
    language: str = "javascript"
    issue: Optional[IssueContext] = None

class FixResponse(BaseModel):
    fixedCode: str
    diffSummary: str
    explanation: str
    confidence: float = 0.95

class RecommendationItem(BaseModel):
    category: str
    text: str

class ReviewRequest(BaseModel):
    code: str
    language: str = "javascript"
    issues: Optional[List[IssueContext]] = Field(default_factory=list)
    metrics: Optional[Dict[str, Any]] = None

class ReviewResponse(BaseModel):
    readabilityScore: int
    maintainabilityScore: int
    architectureSummary: str
    recommendations: List[RecommendationItem]
    source: str = "ai-service"

class HealthResponse(BaseModel):
    status: str
    provider: str
    version: str = "1.0.0"
