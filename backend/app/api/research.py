from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.research import ResearchSession, Claim
from app.schemas.research import ResearchRequest, ResearchResponse, ResearchResult
from app.services.orchestrator import start_research, COST_PER_INPUT_TOKEN, COST_PER_OUTPUT_TOKEN, MODE_CONFIGS

router = APIRouter(prefix="/research", tags=["research"])

MODE_ESTIMATES = {
    "fast": {"cost": 0.05, "duration": 3},
    "balanced": {"cost": 0.25, "duration": 10},
    "scientist": {"cost": 3.00, "duration": 45},
    "multi_agent": {"cost": 10.00, "duration": 90},
}


@router.post("", response_model=ResearchResponse)
async def create_research(
    req: ResearchRequest,
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    estimate = MODE_ESTIMATES.get(req.mode, MODE_ESTIMATES["balanced"])

    if user.balance < estimate["cost"]:
        raise HTTPException(status_code=402, detail="Insufficient balance. Please top up.")

    session = ResearchSession(
        user_id=user.id,
        query=req.query,
        mode=req.mode,
        budget_cap=req.budget_cap or estimate["cost"] * 10,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    user.balance -= estimate["cost"]
    await db.commit()

    bg_tasks.add_task(start_research, session.id)

    return ResearchResponse(
        id=session.id,
        query=session.query,
        mode=session.mode,
        status=session.status,
        cost_estimate=estimate["cost"],
        estimated_duration_minutes=estimate["duration"],
    )


@router.get("/{session_id}", response_model=ResearchResult)
async def get_research(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(ResearchSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Research session not found")

    claims_result = await db.execute(select(Claim).where(Claim.session_id == session_id))
    claims = claims_result.scalars().all()

    confidence_scores = None
    if claims:
        confidence_scores = {
            c.text: {"confidence": c.confidence, "supporting": c.supporting_sources,
                     "conflicting": c.conflicting_sources} for c in claims
        }

    return ResearchResult(
        id=session.id,
        query=session.query,
        status=session.status,
        report=session.report,
        sources_count=session.sources_count,
        cost_incurred=session.cost_incurred,
        confidence_scores=confidence_scores,
        research_graph=session.research_graph,
    )


@router.get("", response_model=list[ResearchResult])
async def list_research(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
):
    result = await db.execute(
        select(ResearchSession)
        .where(ResearchSession.user_id == user.id)
        .order_by(ResearchSession.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    sessions = result.scalars().all()
    return [
        ResearchResult(
            id=s.id, query=s.query, status=s.status, report=s.report,
            sources_count=s.sources_count, cost_incurred=s.cost_incurred,
        )
        for s in sessions
    ]
