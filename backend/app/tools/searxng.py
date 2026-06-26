import httpx
from app.core.config import get_settings

settings = get_settings()


async def search(query: str, engines: list[str] | None = None, max_results: int = 10) -> list[dict]:
    results = await _search_searxng(query, engines, max_results)
    if results:
        return results
    return await _search_duckduckgo(query, max_results)


async def _search_searxng(query: str, engines: list[str] | None = None, max_results: int = 10) -> list[dict]:
    params = {
        "q": query,
        "format": "json",
        "language": "en",
        "categories": "general",
        "pageno": 1,
    }
    if engines:
        params["engines"] = ",".join(engines)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{settings.searxng_base_url}/search", params=params)
            resp.raise_for_status()
            data = resp.json()
            results = []
            for r in data.get("results", [])[:max_results]:
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": r.get("content", ""),
                    "engine": r.get("engine", "searxng"),
                    "score": r.get("score", 50),
                })
            return results
        except Exception:
            return []


async def _search_duckduckgo(query: str, max_results: int = 10) -> list[dict]:
    try:
        from duckduckgo_search import DDGS
        results = []
        with DDGS() as ddgs:
            for i, r in enumerate(ddgs.text(query, max_results=max_results)):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                    "engine": "duckduckgo",
                    "score": max_results - i,
                })
        return results
    except Exception:
        return []
