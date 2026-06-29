import re
from urllib.parse import urlparse

DOMAIN_RANKINGS = {
    # Government & Institutions
    ".gov": 95, ".gov.uk": 95, ".go.id": 90, ".gov.au": 95,
    ".edu": 90, ".ac.id": 85, ".edu.au": 90,
    ".mil": 90, ".int": 85,

    # Major Journals & Science
    "nature.com": 99, "science.org": 99, "cell.com": 98,
    "nejm.org": 99, "thelancet.com": 99, "ieee.org": 95,
    "acm.org": 95, "springer.com": 90, "elsevier.com": 90,
    "sciencedirect.com": 90, "pubmed.ncbi.nlm.nih.gov": 98,
    "ncbi.nlm.nih.gov": 95, "arxiv.org": 85,

    # Major News
    "reuters.com": 95, "apnews.com": 95, "bbc.com": 93,
    "bbc.co.uk": 93, "nytimes.com": 90, "wsj.com": 90,
    "economist.com": 92, "bloomberg.com": 90, "ft.com": 90,
    "washingtonpost.com": 88, "theguardian.com": 85,
    "nikkei.com": 88, "asahi.com": 80,

    # Tech & Business
    "techcrunch.com": 80, "theverge.com": 78, "wired.com": 82,
    "zdnet.com": 78, "arstechnica.com": 85, "stackoverflow.com": 80,
    "github.com": 85, "gitlab.com": 80, "medium.com": 50,

    # Academic Databases
    "scholar.google.com": 90, "semanticscholar.org": 85,
    "researchgate.net": 75, "academia.edu": 70,

    # Indonesian
    "kompas.com": 78, "tempo.co": 80, "cnnindonesia.com": 75,
    "detik.com": 70, "tirto.id": 80, "antaranews.com": 82,
    "liputan6.com": 73,

    # Encyclopedia & Reference
    "wikipedia.org": 78, "britannica.com": 92,
    "who.int": 95, "worldbank.org": 95, "imf.org": 95,
    "oecd.org": 95, "un.org": 92,
}

DEFAULT_SCORE = 40
BLOG_SCORE = 45
SEO_SPAM_THRESHOLD = 20


def get_source_quality(url: str, title: str = "") -> dict:
    parsed = urlparse(url)
    domain = parsed.netloc.lower().replace("www.", "")

    score = DEFAULT_SCORE
    reasons = []

    for key, val in sorted(DOMAIN_RANKINGS.items(), key=lambda x: -len(x[0])):
        if key in domain or key in url:
            score = val
            reasons.append(f"Domain recognized: {key}")
            break

    if domain.endswith(".gov") or domain.endswith(".go.id"):
        reasons.append("Government domain — high authority")
    elif domain.endswith(".edu") or domain.endswith(".ac.id"):
        reasons.append("Educational institution — high authority")

    if any(kw in url.lower() for kw in ["spam", "clickbait", "ad"]):
        score = min(score, SEO_SPAM_THRESHOLD)
        reasons.append("Possible spam/SEO content")

    if "medium.com" in domain:
        score = BLOG_SCORE
        reasons.append("Blog platform — medium authority")

    freshness = _estimate_freshness(url, title)

    return {
        "url": url,
        "domain": domain,
        "quality_score": score,
        "label": _score_to_label(score),
        "reasons": reasons[:3],
        "freshness": freshness,
    }


def _score_to_label(score: int) -> str:
    if score >= 95: return "Very High"
    if score >= 85: return "High"
    if score >= 70: return "Good"
    if score >= 50: return "Fair"
    if score >= 30: return "Low"
    return "Very Low"


def _estimate_freshness(url: str, title: str) -> str:
    import re
    years = re.findall(r"(19\d\d|20\d\d)", url + " " + (title or ""))
    if years:
        latest = max(int(y) for y in years)
        if latest >= 2025: return "Current"
        if latest >= 2023: return "Recent"
        if latest >= 2020: return "Moderate"
        return "Aged"
    return "Unknown"
