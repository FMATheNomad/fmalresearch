import pytest
from app.tools.bge_reranker import _rerank_tfidf
from app.tools.verification import verify_claim


class TestRerankerFallback:
    def test_tfidf_returns_sorted(self):
        docs = [
            {"id": "1", "content": "Python is a programming language"},
            {"id": "2", "content": "JavaScript is used for web development"},
            {"id": "3", "content": "Python is great for AI and machine learning"},
        ]
        result = _rerank_tfidf("Python AI", docs)
        assert result[0]["id"] in ["1", "3"]
        assert result[0]["relevance_score"] >= result[1]["relevance_score"]

    def test_empty_docs_returns_empty(self):
        assert _rerank_tfidf("query", []) == []

    def test_empty_query_returns_zero_scores(self):
        docs = [{"id": "1", "content": "Some content"}]
        result = _rerank_tfidf("", docs)
        assert result[0]["relevance_score"] == 0.0
