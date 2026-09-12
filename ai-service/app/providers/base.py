from abc import ABC, abstractmethod
from app.models.schemas import (
    ExplainRequest, ExplainResponse,
    FixRequest, FixResponse,
    ReviewRequest, ReviewResponse
)

class BaseAIProvider(ABC):
    """Abstract Base Class for modular LLM providers in CodeGuard AI."""
    
    @abstractmethod
    async def explain_issue(self, request: ExplainRequest) -> ExplainResponse:
        """Provide detailed human-readable explanation of detected issue."""
        pass

    @abstractmethod
    async def generate_fix(self, request: FixRequest) -> FixResponse:
        """Generate corrected code patching the issue."""
        pass

    @abstractmethod
    async def review_code(self, request: ReviewRequest) -> ReviewResponse:
        """Conduct comprehensive qualitative code review across architecture, security, readability."""
        pass
