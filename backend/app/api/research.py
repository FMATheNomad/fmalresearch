from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.user import User
from app.models.research import ResearchSession, Claim
from app.schemas.research import ResearchRequest, ResearchResponse, ResearchResult
from app.services.orchestrator import start_research

settings = get_settings()

router = APIRouter(prefix="/research", tags=["research"])

MODE_ESTIMATES = {
    "fast": {"cost": 0.05, "duration": 3},
    "balanced": {"cost": 0.25, "duration": 10},
    "scientist": {"cost": 3.00, "duration": 45},
    "multi_agent": {"cost": 3.00, "duration": 90},
}


@router.post("", response_model=ResearchResponse)
async def create_research(
    req: ResearchRequest,
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    estimate = MODE_ESTIMATES.get(req.mode, MODE_ESTIMATES["balanced"])

    if user.email not in settings.get_admin_emails() and user.balance < estimate["cost"]:
        raise HTTPException(status_code=402, detail="Insufficient balance. Please top up.")

    session = ResearchSession(
        user_id=user.id,
        query=req.query,
        mode=req.mode,
        domain=req.domain or "general",
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


@router.get("/search")
async def search_research(
    q: str = "",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ResearchSession)
        .where(ResearchSession.user_id == user.id)
        .order_by(ResearchSession.created_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    if q:
        q = q.lower()
        sessions = [s for s in sessions if q in s.query.lower() or (s.report and q in s.report.lower())]
    return [
        ResearchResult(
            id=s.id, query=s.query, status=s.status, report=s.report[:200] if s.report else None,
            sources_count=s.sources_count, cost_incurred=s.cost_incurred,
        )
        for s in sessions[:20]
    ]


@router.post("/{session_id}/continue")
async def continue_research(
    session_id: str,
    req: ResearchRequest,
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    original = await db.get(ResearchSession, session_id)
    if not original or original.user_id != user.id:
        raise HTTPException(status_code=404, detail="Research session not found")

    new_query = f"{original.query} — continued: {req.query}" if req.query else original.query
    estimate = MODE_ESTIMATES.get(req.mode, MODE_ESTIMATES["balanced"])

    if user.email not in settings.get_admin_emails() and user.balance < estimate["cost"]:
        raise HTTPException(status_code=402, detail="Insufficient balance")

    session = ResearchSession(
        user_id=user.id,
        query=new_query,
        mode=req.mode,
        domain=getattr(original, "domain", "general"),
        budget_cap=estimate["cost"] * 10,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    if user.email not in settings.get_admin_emails():
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


@router.get("/{session_id}/sources")
async def get_sources(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(ResearchSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Research session not found")

    from app.models.research import Source
    from app.tools.source_quality import get_source_quality
    result = await db.execute(
        select(Source).where(Source.session_id == session_id).order_by(Source.created_at)
    )
    sources = result.scalars().all()
    output = []
    for s in sources[:50]:
        quality = get_source_quality(s.url, s.title or "")
        output.append({
            "id": s.id, "url": s.url, "title": s.title or s.url,
            "quality_score": quality["quality_score"],
            "quality_label": quality["label"],
            "quality_freshness": quality["freshness"],
            "fetched": s.fetched,
        })
    return output


@router.get("/{session_id}/export")
async def export_research(
    session_id: str,
    fmt: str = "md",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(ResearchSession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Research session not found")
    if not session.report:
        raise HTTPException(status_code=400, detail="No report to export")

    claims_str = ""
    claims_result = await db.execute(select(Claim).where(Claim.session_id == session_id))
    claims = claims_result.scalars().all()
    if claims:
        claims_str = "\n\n## Confidence Scores\n\n"
        for c in claims:
            claims_str += f"- **{c.text}** — Confidence: {c.confidence*100:.0f}%\n"

    md = f"# {session.query}\n\n"
    md += f"**Mode:** {session.mode} | **Status:** {session.status} | **Cost:** ${session.cost_incurred:.4f}\n\n"
    md += f"**Sumber:** {session.sources_count} | **Token:** {session.token_input + session.token_output:,}\n\n---\n\n"
    md += session.report
    md += claims_str
    md += f"\n\n---\n*Generated by FMA Labs Research*"

    return PlainTextResponse(md, media_type="text/markdown", headers={
        "Content-Disposition": f"attachment; filename=research-{session_id[:8]}.md"
    })


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
