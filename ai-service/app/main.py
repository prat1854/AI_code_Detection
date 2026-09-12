from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.schemas import (
    ExplainRequest, ExplainResponse,
    FixRequest, FixResponse,
    ReviewRequest, ReviewResponse,
    HealthResponse
)
from app.providers.factory import get_ai_provider

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="CodeGuard AI Modular AI Service for Code Explanation, Fixing, and Review"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

provider = get_ai_provider()

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        provider=settings.ai_provider,
        version="1.0.0"
    )

@app.post("/api/v1/explain", response_model=ExplainResponse)
async def explain_issue(request: ExplainRequest):
    try:
        return await provider.explain_issue(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/fix", response_model=FixResponse)
async def generate_fix(request: FixRequest):
    try:
        return await provider.generate_fix(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/review", response_model=ReviewResponse)
async def review_code(request: ReviewRequest):
    try:
        return await provider.review_code(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
