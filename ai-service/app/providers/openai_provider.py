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

class OpenAIProvider(BaseAIProvider):
    """OpenAI GPT-4o / GPT-3.5 provider with heuristic fallback."""

    def __init__(self):
        self.api_key = settings.openai_api_key
        self.model = settings.openai_model
        self.fallback = HeuristicProvider()

    async def explain_issue(self, request: ExplainRequest) -> ExplainResponse:
        if not self.api_key:
            res = await self.fallback.explain_issue(request)
            res.source = "openai-fallback (no api key)"
            return res

        prompt = f"""Explain this issue in {request.language} code:
Code:
{request.code}

Issue: {request.issue.title} (line {request.issue.line}): {request.issue.message}

Return JSON with keys: "title", "whatIsWrong", "whyItMatters", "whatCouldHappen", "suggestedFix"
"""
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            payload = {
                "model": self.model,
                "response_format": {"type": "json_object"},
                "messages": [{"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parsed = json.loads(data["choices"][0]["message"]["content"])
                    return ExplainResponse(
                        title=parsed.get("title", request.issue.title or "Code Issue"),
                        whatIsWrong=parsed.get("whatIsWrong", ""),
                        whyItMatters=parsed.get("whyItMatters", ""),
                        whatCouldHappen=parsed.get("whatCouldHappen", ""),
                        suggestedFix=parsed.get("suggestedFix", ""),
                        source="openai"
                    )
        except Exception as e:
            print(f"OpenAI API error in explain: {e}")

        res = await self.fallback.explain_issue(request)
        res.source = "openai-fallback (api error)"
        return res

    async def generate_fix(self, request: FixRequest) -> FixResponse:
        if not self.api_key:
            return await self.fallback.generate_fix(request)

        prompt = f"""Provide a fixed version of this {request.language} code:
{request.code}

Fix issue: {request.issue.title if request.issue else 'Code issue'} at line {request.issue.line if request.issue else 1}

Return JSON with keys: "fixedCode", "diffSummary", "explanation", "confidence" (0.0 to 1.0)
"""
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            payload = {
                "model": self.model,
                "response_format": {"type": "json_object"},
                "messages": [{"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parsed = json.loads(data["choices"][0]["message"]["content"])
                    return FixResponse(
                        fixedCode=parsed.get("fixedCode", request.code),
                        diffSummary=parsed.get("diffSummary", "Automated patch generated."),
                        explanation=parsed.get("explanation", ""),
                        confidence=float(parsed.get("confidence", 0.95))
                    )
        except Exception as e:
            print(f"OpenAI API error in fix: {e}")

        return await self.fallback.generate_fix(request)

    async def review_code(self, request: ReviewRequest) -> ReviewResponse:
        if not self.api_key:
            res = await self.fallback.review_code(request)
            res.source = "openai-fallback (no api key)"
            return res

        prompt = f"""Review this {request.language} code:
{request.code}

Return JSON with keys: "readabilityScore" (int), "maintainabilityScore" (int), "architectureSummary" (string), "recommendations" (list of objects with "category" and "text")
"""
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            payload = {
                "model": self.model,
                "response_format": {"type": "json_object"},
                "messages": [{"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parsed = json.loads(data["choices"][0]["message"]["content"])
                    recs = [
                        RecommendationItem(category=r.get("category", "General"), text=r.get("text", ""))
                        for r in parsed.get("recommendations", [])
                    ]
                    return ReviewResponse(
                        readabilityScore=int(parsed.get("readabilityScore", 85)),
                        maintainabilityScore=int(parsed.get("maintainabilityScore", 80)),
                        architectureSummary=parsed.get("architectureSummary", ""),
                        recommendations=recs,
                        source="openai"
                    )
        except Exception as e:
            print(f"OpenAI API error in review: {e}")

        res = await self.fallback.review_code(request)
        res.source = "openai-fallback (api error)"
        return res
