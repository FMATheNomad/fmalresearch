import httpx


async def rerank(query: str, documents: list[dict]) -> list[dict]:
    if not documents:
        return documents

    reranked = await _rerank_bge(query, documents)
    if reranked:
        return reranked
    return _rerank_tfidf(query, documents)


async def _rerank_bge(query: str, documents: list[dict]) -> list[dict] | None:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "http://localhost:8080/rerank",
                json={
                    "query": query,
                    "documents": [d.get("content", "") for d in documents],
                },
            )
            resp.raise_for_status()
            scores = resp.json().get("scores", [])
            for i, doc in enumerate(documents):
                doc["relevance_score"] = scores[i] if i < len(scores) else 0.0
            documents.sort(key=lambda d: d.get("relevance_score", 0), reverse=True)
            return documents
    except Exception:
        return None


def _rerank_tfidf(query: str, documents: list[dict]) -> list[dict]:
    query_words = set(query.lower().split())
    for doc in documents:
        content = (doc.get("content") or "").lower()
        words = set(content.split())
        if not query_words:
            doc["relevance_score"] = 0.0
        else:
            overlap = len(query_words & words)
            doc["relevance_score"] = overlap / len(query_words) if query_words else 0.0
    documents.sort(key=lambda d: d.get("relevance_score", 0), reverse=True)
    return documents
