from app.tools.searxng import search as searxng_search
from app.tools.playwright import fetch as playwright_fetch
from app.tools.meilisearch import search_cache, index_source
from app.tools.bge_reranker import rerank as bge_rerank
from app.tools.verification import verify_claim

TOOL_REGISTRY = {
    "search_searxng": searxng_search,
    "fetch_content": playwright_fetch,
    "search_cache": search_cache,
    "rerank_documents": bge_rerank,
    "verify_claim": verify_claim,
    "index_cache": index_source,
}

__all__ = ["TOOL_REGISTRY", "searxng_search", "playwright_fetch", "search_cache", "index_source", "bge_rerank", "verify_claim"]
