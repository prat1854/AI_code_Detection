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

class GeminiProvider(BaseAIProvider):
    """Google Gemini LLM Provider with fallback to heuristic engine."""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.fallback = HeuristicProvider()

    async def explain_issue(self, request: ExplainRequest) -> ExplainResponse:
        if not self.api_key:
            res = await self.fallback.explain_issue(request)
            res.source = "gemini-fallback (no api key)"
            return res

        prompt = f"""You are a world-class code security and static analysis expert.
Analyze this issue in {request.language} code:
Code:
```{request.language}
{request.code}
```
Issue Details:
Title: {request.issue.title}
Rule: {request.issue.ruleId}
Line: {request.issue.line}
Message: {request.issue.message}

Return a valid JSON object with EXACTLY these keys:
"title": short title,
"whatIsWrong": explanation of the defect,
"whyItMatters": security or operational reason,
"whatCouldHappen": risk and exploitation scenario,
"suggestedFix": concrete step-by-step fix recommendation
"""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                })
                if resp.status_code == 200:
                    data = resp.json()
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    parsed = json.loads(text)
                    return ExplainResponse(
                        title=parsed.get("title", request.issue.title or "Code Issue"),
                        whatIsWrong=parsed.get("whatIsWrong", ""),
                        whyItMatters=parsed.get("whyItMatters", ""),
                        whatCouldHappen=parsed.get("whatCouldHappen", ""),
                        suggestedFix=parsed.get("suggestedFix", ""),
                        source="google-gemini"
                    )
        except Exception as e:
            print(f"Gemini API error in explain: {e}")

        res = await self.fallback.explain_issue(request)
        res.source = "gemini-fallback (api error)"
        return res

    async def generate_fix(self, request: FixRequest) -> FixResponse:
        if not self.api_key:
            return await self.fallback.generate_fix(request)

        prompt = f"""You are a professional software engineer. Provide a corrected, patched version of the code.
Language: {request.language}
Original Code:
```{request.language}
{request.code}
```
Issue to Fix:
{request.issue.title if request.issue else 'Code safety issue'} at line {request.issue.line if request.issue else 1}

Return JSON with:
"fixedCode": complete fixed source code,
"diffSummary": summary of changes made,
"explanation": explanation of the fix,
"confidence": float between 0.0 and 1.0
"""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                })
                if resp.status_code == 200:
                    data = resp.json()
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    parsed = json.loads(text)
                    return FixResponse(
                        fixedCode=parsed.get("fixedCode", request.code),
                        diffSummary=parsed.get("diffSummary", "Automated patch generated."),
                        explanation=parsed.get("explanation", ""),
                        confidence=float(parsed.get("confidence", 0.95))
                    )
        except Exception as e:
            print(f"Gemini API error in fix: {e}")

        return await self.fallback.generate_fix(request)

    async def review_code(self, request: ReviewRequest) -> ReviewResponse:
        if not self.api_key:
            res = await self.fallback.review_code(request)
            res.source = "gemini-fallback (no api key)"
            return res

        prompt = f"""Perform a code review for this {request.language} code:
```{request.language}
{request.code}
```
Return JSON with:
"readabilityScore": integer 0-100,
"maintainabilityScore": integer 0-100,
"architectureSummary": concise paragraph summary,
"recommendations": list of objects with "category" and "text"
"""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                })
                if resp.status_code == 200:
                    data = resp.json()
                    text = data['candidates'][0]['content']['parts'][0]['text']
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
                        source="google-gemini"
                    )
        except Exception as e:
            print(f"Gemini API error in review: {e}")

        res = await self.fallback.review_code(request)
        res.source = "gemini-fallback (api error)"
        return res
