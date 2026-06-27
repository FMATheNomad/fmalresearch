import pytest
from app.tools.semantic_scholar import search_papers, get_paper_details


@pytest.mark.asyncio
async def test_search_papers_returns_list():
    results = await search_papers("machine learning", limit=3)
    assert isinstance(results, list)
    if results:
        assert "title" in results[0]
        assert "url" in results[0]
        assert "source" in results[0]
        assert results[0]["source"] == "semantic_scholar"


@pytest.mark.asyncio
async def test_search_papers_empty_query():
    results = await search_papers("", limit=3)
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_get_paper_details_invalid_id():
    result = await get_paper_details("nonexistent-id")
    assert result is None
