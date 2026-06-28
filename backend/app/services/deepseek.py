import json
from typing import Any
from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()

client = AsyncOpenAI(
    api_key=settings.deepseek_api_key,
    base_url=settings.deepseek_base_url,
)


def get_tool_definitions() -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": "search_searxng",
                "description": "Search the web via SearXNG metasearch engine. Returns URLs with titles and snippets.",
                "strict": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search query string"
                        },
                        "engines": {
                            "type": "array",
                            "items": {"type": "string", "enum": ["google", "bing", "brave", "duckduckgo", "qwant"]},
                            "description": "Search engines to use. Default: all available."
                        },
                        "max_results": {
                            "type": "integer",
                            "description": "Maximum number of search results to return",
                            "minimum": 1,
                            "maximum": 50
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "fetch_content",
                "description": "Fetch the full content of a webpage using Playwright headless browser.",
                "strict": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The full URL to fetch content from"
                        }
                    },
                    "required": ["url"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_cache",
                "description": "Search previously crawled content in MeiliSearch cache. Use this before fetching new content.",
                "strict": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query string"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum results to return",
                            "minimum": 1,
                            "maximum": 50
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "rerank_documents",
                "description": "Rerank a list of documents by relevance to a query using BGE cross-encoder.",
                "strict": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The original research query"
                        },
                        "documents": {
                            "type": "array",
                            "items": {"type": "object"},
                            "description": "List of documents with 'id' and 'content' fields to rerank"
                        }
                    },
                    "required": ["query", "documents"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_academic",
                "description": "Search academic papers via Semantic Scholar. Returns papers with title, abstract, authors, year, citations.",
                "strict": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query for academic papers"},
                        "limit": {"type": "integer", "description": "Maximum results", "minimum": 1, "maximum": 50}
                    },
                    "required": ["query"],
                    "additionalProperties": False
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "verify_claim",
                "description": "Verify a claim against multiple sources. Returns confidence score and conflicting claims.",
                "strict": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "claim": {
                            "type": "string",
                            "description": "The claim statement to verify"
                        },
                        "sources": {
                            "type": "array",
                            "items": {"type": "object"},
                            "description": "List of source documents with 'content' and 'url' fields"
                        }
                    },
                    "required": ["claim", "sources"],
                    "additionalProperties": False
                }
            }
        }
    ]


MODE_CONFIGS = {
    "fast": {
        "reasoning_effort": "low",
        "max_tokens": 8192,
        "description": "Quick fact-check, 1-3 minutes"
    },
    "balanced": {
        "reasoning_effort": "high",
        "max_tokens": 32768,
        "description": "Standard research, 5-10 minutes"
    },
    "scientist": {
        "reasoning_effort": "max",
        "max_tokens": 131072,
        "description": "Deep research, 15-60 minutes"
    },
    "multi_agent": {
        "reasoning_effort": "max",
        "max_tokens": 384000,
        "description": "Multi-agent debate, 30-120+ minutes"
    }
}

SYSTEM_PROMPT = """You are FMA Labs Research, an AI deep research assistant.

Your workflow:
1. Understand the user's research query
2. Search the web via search_searxng (multiple queries for comprehensive coverage)
3. For academic/scientific topics, use search_academic to search scholarly papers
4. Check cache first via search_cache to avoid re-fetching
5. Fetch content from relevant URLs via fetch_content
6. Rerank documents via rerank_documents to prioritize relevance
7. Verify key claims via verify_claim (cross-reference multiple sources)
8. Synthesize findings into a structured report

Rules:
- Always think step by step before calling tools
- Use multiple search queries to cover different angles
- For research questions, prioritize academic sources via search_academic
- Verify every important claim against at least 2-3 sources
- Output confidence scores (0.0-1.0) for each key claim
- If sources disagree, highlight the conflicting claims
- Cite all sources with URLs
- Use JSON format for structured data (confidence scores, source metadata)
- When you detect conflicting information, present both sides with source support counts

Output format for final report:
- Executive summary (2-3 paragraphs)
- Key findings with confidence scores
- Detailed analysis per subtopic
- Sources cited (include academic papers where relevant)
- Conflicting claims (if any)
- Methodology (engines used, sources crawled)"""


DOMAIN_PROMPTS = {
    "general": "Focus on general web sources and provide balanced coverage.",
    "academic": "Prioritize academic sources (Google Scholar, Semantic Scholar). Use search_academic tool extensively. Output formal academic-style report.",
    "financial": "Focus on financial data, market reports, numerical analysis. Include market size, growth rates, projections.",
    "legal": "Focus on legal databases, court rulings, legislation. Prioritize primary legal sources.",
    "technical": "Focus on technical documentation, GitHub, API references. Prioritize implementation details and code examples.",
}


def get_system_prompt(domain: str = "general") -> str:
    domain_instruction = DOMAIN_PROMPTS.get(domain, DOMAIN_PROMPTS["general"])
    return f"""{SYSTEM_PROMPT}

Domain-specific instructions:
{domain_instruction}"""


async def chat_completion(
    messages: list[dict],
    mode: str = "balanced",
    stream: bool = False,
    tools_enabled: bool = True,
) -> Any:
    config = MODE_CONFIGS.get(mode, MODE_CONFIGS["balanced"])

    kwargs = {
        "model": settings.deepseek_model,
        "messages": messages,
        "max_tokens": config["max_tokens"],
        "stream": stream,
        "extra_body": {"thinking": {"type": "enabled"}},
        "reasoning_effort": config["reasoning_effort"],
    }

    if tools_enabled:
        kwargs["tools"] = get_tool_definitions()

    return await client.chat.completions.create(**kwargs)
