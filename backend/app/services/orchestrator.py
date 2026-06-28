import json
import asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session
from app.core.logging import get_logger
from app.models.research import ResearchSession, Source, Claim
from app.services.deepseek import chat_completion, get_system_prompt, MODE_CONFIGS
from app.tools import TOOL_REGISTRY
from app.api.ws import notify_tool_call, notify_report_chunk, notify_complete, check_control, clear_control

logger = get_logger("orchestrator")

COST_PER_INPUT_TOKEN = 0.14 / 1_000_000
COST_PER_OUTPUT_TOKEN = 0.28 / 1_000_000


async def start_research(session_id: str):
    async with async_session() as db:
        session = await db.get(ResearchSession, session_id)
        if not session:
            return

        try:
            session.status = "running"
            await db.commit()

            if session.mode == "multi_agent":
                from app.services.sub_agents import run_parallel_sub_agents
                await run_parallel_sub_agents(session_id, session.query, session.user_id)
                return

            messages = [
                {"role": "system", "content": get_system_prompt(getattr(session, "domain", "general"))},
                {"role": "user", "content": session.query},
            ]

            max_tool_rounds = {"fast": 10, "balanced": 20, "scientist": 40, "multi_agent": 60}
            max_rounds = max_tool_rounds.get(session.mode, 15)
            config = MODE_CONFIGS.get(session.mode, MODE_CONFIGS["balanced"])

            source_counter = 0

            for round_num in range(max_rounds):
                control = await check_control(session_id)
                if control == "cancelled":
                    session.report = "Research cancelled by user."
                    session.status = "failed"
                    session.completed_at = datetime.now(timezone.utc)
                    await notify_complete(session_id)
                    await db.commit()
                    return

                while await check_control(session_id) == "paused":
                    await asyncio.sleep(2)

                response = await chat_completion(messages, mode=session.mode, stream=False, tools_enabled=True)

                msg = response.choices[0].message
                tool_calls = msg.tool_calls

                if response.usage:
                    session.token_input += response.usage.prompt_tokens or 0
                    session.token_output += response.usage.completion_tokens or 0

                current_cost = (
                    session.token_input * COST_PER_INPUT_TOKEN
                    + session.token_output * COST_PER_OUTPUT_TOKEN
                )
                if session.budget_cap and current_cost > session.budget_cap:
                    logger.info("budget_cap_reached", session_id=session_id, cost=current_cost, cap=session.budget_cap)
                    session.report = msg.content or f"Research stopped — budget cap of ${session.budget_cap:.2f} reached."
                    session.status = "completed"
                    session.completed_at = datetime.now(timezone.utc)
                    session.cost_incurred = current_cost
                    await notify_complete(session_id)
                    await db.commit()
                    return

                assistant_msg = {
                    "role": "assistant",
                    "content": msg.content or "",
                    "reasoning_content": getattr(msg, "reasoning_content", None),
                }

                logger.info("orchestrator_round", round=round_num, has_content=bool(msg.content), has_tool_calls=bool(tool_calls), has_reasoning=bool(getattr(msg, "reasoning_content", None)))

                if tool_calls:
                    tc_list = []
                    for tc in tool_calls:
                        fn = tc.function
                        tc_list.append({
                            "id": tc.id, "type": "function",
                            "function": {"name": fn.name, "arguments": fn.arguments}
                        })

                    assistant_msg["tool_calls"] = tc_list
                    messages.append(assistant_msg)

                    for tc in tool_calls:
                        fn = tc.function
                        tool_name = fn.name
                        try:
                            arguments = json.loads(fn.arguments)
                        except json.JSONDecodeError:
                            arguments = {}

                        await notify_tool_call(session_id, tool_name, "running", {"arguments": arguments})
                        result = await execute_tool(tool_name, arguments, session.id, db)
                        result_str = json.dumps(result) if not isinstance(result, str) else (result or "{}")
                        await notify_tool_call(session_id, tool_name, "completed", {"result": result_str[:200]})

                        if tool_name in ("search_searxng", "search_academic"):
                            try:
                                parsed = json.loads(result_str) if isinstance(result_str, str) else result
                                if isinstance(parsed, dict) and "results" in parsed:
                                    source_counter += len(parsed["results"])
                            except Exception:
                                pass

                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": result_str,
                        })

                        if tool_name == "fetch_content" and isinstance(result, dict) and result.get("content"):
                            quality = min(len(result["content"]) / 500, 100)
                            await _index_source(db, session.id, result["url"],
                                                result.get("title", ""), result["content"][:20000], quality)

                    await db.commit()
                else:
                    if not msg.content and not tool_calls:
                        logger.info("orchestrator_still_thinking", round=round_num)
                        messages.append(assistant_msg)
                        continue

                    messages.append(assistant_msg)
                    session.report = msg.content
                    session.status = "completed"
                    session.completed_at = datetime.now(timezone.utc)
                    session.cost_incurred = (
                        session.token_input * COST_PER_INPUT_TOKEN
                        + session.token_output * COST_PER_OUTPUT_TOKEN
                    )
                    session.sources_count = source_counter

                    if msg.content:
                        chunks = msg.content.split("\n\n")
                        for chunk in chunks:
                            if chunk.strip():
                                await notify_report_chunk(session_id, chunk + "\n\n")

                    await notify_complete(session_id)
                    await db.commit()
                    return

            session.status = "completed"
            session.completed_at = datetime.now(timezone.utc)
            await notify_complete(session_id)
            await db.commit()

        except Exception as e:
            logger.error("research_failed", session_id=session_id, error=str(e))
            session.status = "failed"
            session.error = str(e)
            await db.commit()


async def execute_tool(tool_name: str, arguments: dict, session_id: str, db: AsyncSession) -> dict | str:
    func = TOOL_REGISTRY.get(tool_name)
    if not func:
        return {"error": f"Unknown tool: {tool_name}"}

    try:
        if tool_name == "search_searxng":
            results = await func(arguments.get("query", ""), arguments.get("engines"), arguments.get("max_results", 10))
            for r in results:
                db.add(Source(session_id=session_id, url=r["url"], title=r["title"],
                              quality_score=r.get("score", 50)))
            await db.commit()
            return {"results": results[:10]}

        elif tool_name == "fetch_content":
            result = await func(arguments.get("url", ""))
            return result or {"error": "Failed to fetch"}

        elif tool_name == "search_cache":
            result = await func(arguments.get("query", ""), arguments.get("limit", 10))
            return {"results": result[:10]}

        elif tool_name == "rerank_documents":
            docs = arguments.get("documents", [])
            if not docs:
                return {"results": []}
            result = await func(documents=docs, query=arguments.get("query", ""))
            return {"results": [{"id": d.get("id"), "title": d.get("title"),
                                 "relevance_score": d.get("relevance_score", 0)} for d in result[:20]]}

        elif tool_name == "search_academic":
            results = await func(arguments.get("query", ""), arguments.get("limit", 10))
            for r in results:
                db.add(Source(session_id=session_id, url=r["url"], title=r["title"],
                              quality_score=min(r.get("citation_count", 0) * 5, 95)))
            await db.commit()
            return {"results": results[:10]}

        elif tool_name == "verify_claim":
            result = await func(arguments.get("claim", ""), arguments.get("sources", []))
            return result

        return {"result": "ok"}

    except Exception as e:
        return {"error": str(e)}


async def _index_source(db: AsyncSession, session_id: str, url: str, title: str, content: str, quality: float):
    from sqlalchemy import select
    result = await db.execute(select(Source).where(Source.url == url, Source.session_id == session_id))
    existing = result.scalar_one_or_none()
    if not existing:
        db.add(Source(session_id=session_id, url=url, title=title,
                      content=content, quality_score=quality, fetched=True))
    else:
        existing.fetched = True
        existing.content = content
        existing.quality_score = quality
    await db.commit()
