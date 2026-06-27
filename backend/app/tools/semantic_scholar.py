import httpx

API_BASE = "https://api.semanticscholar.org/graph/v1"


async def search_papers(query: str, limit: int = 10, fields: str = "title,url,abstract,authors,year,venue,citationCount") -> list[dict]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(
                f"{API_BASE}/paper/search",
                params={"query": query, "limit": min(limit, 100), "fields": fields},
            )
            resp.raise_for_status()
            data = resp.json()
            results = []
            for p in data.get("data", []):
                authors = p.get("authors", [])
                results.append({
                    "title": p.get("title", ""),
                    "url": p.get("url", "") or f"https://www.semanticscholar.org/paper/{p.get('paperId', '')}",
                    "abstract": p.get("abstract", ""),
                    "authors": [a.get("name", "") for a in authors[:5]],
                    "year": p.get("year"),
                    "venue": p.get("venue", ""),
                    "citation_count": p.get("citationCount", 0),
                    "source": "semantic_scholar",
                })
            return results
        except Exception:
            return []


async def get_paper_details(paper_id: str, fields: str = "title,url,abstract,authors,year,venue,citationCount,references") -> dict | None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(
                f"{API_BASE}/paper/{paper_id}",
                params={"fields": fields},
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return None
