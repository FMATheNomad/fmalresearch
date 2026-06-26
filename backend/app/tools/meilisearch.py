import httpx
from app.core.config import get_settings

settings = get_settings()
headers = {"Authorization": f"Bearer {settings.meilisearch_api_key}"} if settings.meilisearch_api_key else {}


async def search_cache(query: str, limit: int = 10) -> list[dict]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.post(
                f"{settings.meilisearch_url}/indexes/sources/search",
                headers=headers,
                json={"q": query, "limit": limit, "attributesToHighlight": ["title", "content"]},
            )
            resp.raise_for_status()
            data = resp.json()
            return [h["_formatted"] if "_formatted" in h else h for h in data.get("hits", [])]
        except Exception:
            return []


async def index_source(url: str, title: str, content: str, session_id: str, quality_score: float = 0.0):
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            doc = {
                "id": url,
                "url": url,
                "title": title,
                "content": content[:20000],
                "session_id": session_id,
                "quality_score": quality_score,
                "crawled_at": __import__("datetime").datetime.utcnow().isoformat(),
            }
            await client.post(
                f"{settings.meilisearch_url}/indexes/sources/documents",
                headers=headers,
                json=[doc],
            )
        except Exception:
            pass
