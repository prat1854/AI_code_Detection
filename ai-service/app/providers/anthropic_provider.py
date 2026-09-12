import json
import httpx
from app.providers.base import BaseAIProvider
from app.providers.heuristic_provider import HeuristicProvider
from app.models.schemas import (
    ExplainRequest, ExplainResponse,
    FixRequest, FixResponse,
    ReviewRequest, ReviewResponse, RecommendationItem
)
from app.config import settings

class AnthropicProvider(BaseAIProvider):
    """Anthropic Claude provider with heuristic fallback."""

    def __init__(self):
        self.api_key = settings.anthropic_api_key
        self.model = settings.anthropic_model
        self.fallback = HeuristicProvider()

    async def explain_issue(self, request: ExplainRequest) -> ExplainResponse:
        if not self.api_key:
            res = await self.fallback.explain_issue(request)
            res.source = "anthropic-fallback (no api key)"
            return res

        prompt = f"""Explain this issue in {request.language} code:
Code:
{request.code}

Issue: {request.issue.title} (line {request.issue.line}): {request.issue.message}

Return ONLY a JSON object with keys: "title", "whatIsWrong", "whyItMatters", "whatCouldHappen", "suggestedFix"
"""
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": self.model,
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["content"][0]["text"]
                    parsed = json.loads(text)
                    return ExplainResponse(
                        title=parsed.get("title", request.issue.title or "Code Issue"),
                        whatIsWrong=parsed.get("whatIsWrong", ""),
                        whyItMatters=parsed.get("whyItMatters", ""),
                        whatCouldHappen=parsed.get("whatCouldHappen", ""),
                        suggestedFix=parsed.get("suggestedFix", ""),
                        source="anthropic"
                    )
        except Exception as e:
            print(f"Anthropic API error in explain: {e}")

        res = await self.fallback.explain_issue(request)
        res.source = "anthropic-fallback (api error)"
        return res

    async def generate_fix(self, request: FixRequest) -> FixResponse:
        if not self.api_key:
            return await self.fallback.generate_fix(request)

        prompt = f"""Provide a fixed version of this {request.language} code:
{request.code}

Fix issue: {request.issue.title if request.issue else 'Code issue'} at line {request.issue.line if request.issue else 1}

Return ONLY a JSON object with keys: "fixedCode", "diffSummary", "explanation", "confidence" (0.0 to 1.0)
"""
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": self.model,
                "max_tokens": 2048,
                "messages": [{"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["content"][0]["text"]
                    parsed = json.loads(text)
                    return FixResponse(
                        fixedCode=parsed.get("fixedCode", request.code),
                        diffSummary=parsed.get("diffSummary", "Automated patch generated."),
                        explanation=parsed.get("explanation", ""),
                        confidence=float(parsed.get("confidence", 0.95))
                    )
        except Exception as e:
            print(f"Anthropic API error in fix: {e}")

        return await self.fallback.generate_fix(request)

    async def review_code(self, request: ReviewRequest) -> ReviewResponse:
        if not self.api_key:
            res = await self.fallback.review_code(request)
            res.source = "anthropic-fallback (no api key)"
            return res

        prompt = f"""Review this {request.language} code:
{request.code}

Return ONLY a JSON object with keys: "readabilityScore" (int), "maintainabilityScore" (int), "architectureSummary" (string), "recommendations" (list of objects with "category" and "text")
"""
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": self.model,
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["content"][0]["text"]
                    parsed = json.loads(text)
                    recs = [
                        RecommendationItem(category=r.get("category", "General"), text=r.get("text", ""))
                        for r in parsed.get("recommendations", [])
                    ]
                    return ReviewResponse(
                        readabilityScore=int(parsed.get("readabilityScore", 85)),
                        maintainabilityScore=int(parsed.get("maintainabilityScore", 80)),
                        architectureSummary=parsed.get("architectureSummary", ""),
                        recommendations=recs,
                        source="anthropic"
                    )
        except Exception as e:
            print(f"Anthropic API error in review: {e}")

        res = await self.fallback.review_code(request)
        res.source = "anthropic-fallback (api error)"
        return res
