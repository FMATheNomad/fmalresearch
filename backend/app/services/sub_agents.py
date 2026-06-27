from app.services.deepseek import chat_completion, MODE_CONFIGS
from app.services.orchestrator import execute_tool, COST_PER_INPUT_TOKEN, COST_PER_OUTPUT_TOKEN
from app.core.logging import get_logger
from app.models.research import ResearchSession, Source, Claim
from app.core.database import async_session

logger = get_logger("sub_agents")

PERSONAS = {
    "analyst": {
        "name": "Analyst",
        "prompt": "You are a data-focused analyst. Prioritize quantitative data, statistics, metrics, and verifiable facts. Question claims without evidence. Output structured data where possible."
    },
    "critic": {
        "name": "Critic",
        "prompt": "You are a skeptical critic. Focus on risks, limitations, contradictory evidence, and weaknesses in arguments. Challenge every assumption. Identify what could go wrong."
    },
    "explorer": {
        "name": "Explorer",
        "prompt": "You are an opportunity-focused explorer. Look for emerging trends, novel connections, under-explored angles, and positive signals. Think about future possibilities and applications."
    },
}

MODERATOR_PROMPT = """You are a research synthesis moderator. Three sub-agents have independently researched the same topic from different perspectives. Your job is to:

1. Identify consensus — claims ALL agents agree on
2. Identify conflicts — claims agents disagree on
3. Synthesize a balanced final report

Structure your output:
- Executive Summary (balanced view)
- Consensus Findings (with confidence scores)
- Conflicting Claims (with each agent's perspective)
- Key Takeaways (actionable insights)
- Sources Cited

Focus on creating ONE coherent report that represents the full picture, not three separate summaries."""


async def run_parallel_sub_agents(session_id: str, query: str, user_id: str):
    async with async_session() as db:
        session = await db.get(ResearchSession, session_id)
        if not session:
            return

        logger.info("parallel_sub_agents_started", session_id=session_id, query=query)

        try:
            results = []
            total_cost = 0.0
            total_input = 0
            total_output = 0

            for persona_key, persona in PERSONAS.items():
                messages = [
                    {"role": "system", "content": persona["prompt"]},
                    {"role": "user", "content": f"Research this topic: {query}"},
                ]

                agent_session_id = f"{session_id}_{persona_key}"
                source_count = 0

                for round_num in range(10):
                    response = await chat_completion(messages, mode="balanced", stream=False, tools_enabled=True)
                    msg = response.choices[0].message
                    tool_calls = msg.tool_calls

                    if response.usage:
                        total_input += response.usage.prompt_tokens or 0
                        total_output += response.usage.completion_tokens or 0

                    assistant_msg = {
                        "role": "assistant",
                        "content": msg.content or "",
                        "reasoning_content": getattr(msg, "reasoning_content", None),
                    }

                    if tool_calls:
                        tc_list = [{"id": tc.id, "type": "function",
                                     "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                                   for tc in tool_calls]
                        assistant_msg["tool_calls"] = tc_list
                        messages.append(assistant_msg)

                        for tc in tool_calls:
                            fn = tc.function
                            try:
                                import json
                                arguments = json.loads(fn.arguments)
                            except json.JSONDecodeError:
                                arguments = {}

                            tool_result = await execute_tool(fn.name, arguments, session_id, db)

                            if fn.name == "search_searxng":
                                try:
                                    parsed = json.loads(tool_result) if isinstance(tool_result, str) else tool_result
                                    if isinstance(parsed, dict) and "results" in parsed:
                                        source_count += len(parsed["results"])
                                except Exception:
                                    pass

                            messages.append({
                                "role": "tool",
                                "tool_call_id": tc.id,
                                "content": json.dumps(tool_result) if not isinstance(tool_result, str) else (tool_result or "{}"),
                            })
                    else:
                        if msg.content:
                            results.append({"persona": persona["name"], "content": msg.content, "sources": source_count})
                        messages.append(assistant_msg)
                        break

                logger.info("sub_agent_complete", persona=persona["name"], sources=source_count)

            if not results:
                session.report = "Sub-agents could not complete research."
                session.status = "completed"
                session.cost_incurred = total_cost
                await db.commit()
                return

            synthesis_messages = [
                {"role": "system", "content": MODERATOR_PROMPT},
                {"role": "user", "content": f"Research query: {query}\n\nSub-agent findings:\n\n" + "\n\n".join(
                    [f"=== {r['persona']} ===\n{r['content']}" for r in results]
                )},
            ]

            synthesis_response = await chat_completion(synthesis_messages, mode="scientist", stream=False, tools_enabled=False)
            synthesis_msg = synthesis_response.choices[0].message
            final_report = synthesis_msg.content or ""

            if synthesis_response.usage:
                total_input += synthesis_response.usage.prompt_tokens or 0
                total_output += synthesis_response.usage.completion_tokens or 0

            total_cost = total_input * COST_PER_INPUT_TOKEN + total_output * COST_PER_OUTPUT_TOKEN

            session.report = final_report
            session.status = "completed"
            session.cost_incurred = total_cost
            session.token_input = total_input
            session.token_output = total_output
            session.sources_count = sum(r["sources"] for r in results) if results else 0
            await db.commit()

            logger.info("parallel_sub_agents_complete", session_id=session_id, cost=total_cost,
                        sources=session.sources_count)

        except Exception as e:
            logger.error("parallel_sub_agents_failed", session_id=session_id, error=str(e))
            session.status = "failed"
            session.error = str(e)
            await db.commit()
