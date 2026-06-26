from pydantic import BaseModel
from typing import Optional


class ResearchRequest(BaseModel):
    query: str
    mode: str = "balanced"  # fast, balanced, scientist, multi_agent
    budget_cap: Optional[float] = None
    max_sources: Optional[int] = None
    domain: Optional[str] = None  # general, academic, financial, legal, technical


class ResearchResponse(BaseModel):
    id: str
    query: str
    mode: str
    status: str
    cost_estimate: float
    estimated_duration_minutes: int

    class Config:
        from_attributes = True


class ResearchResult(BaseModel):
    id: str
    query: str
    status: str
    report: Optional[str] = None
    sources_count: int = 0
    cost_incurred: float = 0.0
    confidence_scores: Optional[dict] = None
    research_graph: Optional[dict] = None

    class Config:
        from_attributes = True
