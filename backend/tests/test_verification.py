import pytest
from app.tools.verification import verify_claim


class TestVerificationEngine:
    @pytest.mark.asyncio
    async def test_no_sources_returns_zero_confidence(self):
        result = await verify_claim("AI is growing", [])
        assert result["confidence"] == 0.0
        assert result["supporting"] == []
        assert result["conflicting"] == []

    @pytest.mark.asyncio
    async def test_supporting_source_high_confidence(self):
        sources = [{"url": "https://example.com", "content": "AI is growing rapidly in 2026", "title": "AI Report"}]
        result = await verify_claim("AI is growing", sources)
        assert result["confidence"] >= 0.3
        assert len(result["supporting"]) == 1
        assert len(result["conflicting"]) == 0

    @pytest.mark.asyncio
    async def test_conflicting_source_reduces_confidence(self):
        sources = [
            {"url": "https://example.com/yes", "content": "AI is growing rapidly according to all reports", "title": "Pro"},
            {"url": "https://example.com/no", "content": "The stock market is declining today with no growth", "title": "Unrelated"},
        ]
        result = await verify_claim("AI is growing rapidly", sources)
        assert result["confidence"] <= 0.5
