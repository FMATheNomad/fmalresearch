import re
from collections import Counter

STOP_WORDS = {"the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
              "have", "has", "had", "do", "does", "did", "will", "would", "can",
              "could", "may", "might", "shall", "should", "to", "of", "in", "for",
              "on", "with", "at", "by", "from", "as", "into", "through", "during",
              "before", "after", "above", "below", "between", "out", "off", "over",
              "under", "again", "further", "then", "once", "here", "there", "when",
              "where", "why", "how", "all", "each", "every", "both", "few", "more",
              "most", "other", "some", "such", "no", "nor", "not", "only", "own",
              "same", "so", "than", "too", "very", "just", "because", "but", "and",
              "or", "if", "while", "although", "since", "until", "about", "across",
              "after", "against", "along", "among", "around", "at", "before",
              "behind", "below", "beneath", "beside", "between", "beyond", "by",
              "down", "during", "except", "for", "from", "in", "inside", "into",
              "near", "of", "off", "on", "out", "outside", "over", "through",
              "throughout", "to", "toward", "under", "underneath", "until", "up",
              "upon", "with", "within", "without", "yang", "dan", "di", "ke",
              "dari", "dengan", "untuk", "pada", "adalah", "ini", "itu", "tidak",
              "akan", "dalam", "oleh", "saya", "kamu", "dia", "kami", "mereka"}


def _tokenize(text: str) -> set[str]:
    text = text.lower()
    tokens = re.findall(r"[a-zA-Z0-9]+", text)
    return {t for t in tokens if t not in STOP_WORDS and len(t) > 2}


def _compute_match(claim_tokens: set[str], source_tokens: set[str]) -> float:
    if not claim_tokens:
        return 0.0
    intersection = claim_tokens & source_tokens
    return len(intersection) / len(claim_tokens)


def _detect_negation(claim: str, source: str) -> bool:
    negation_words = ["not", "no", "never", "bukan", "tidak", "jangan",
                      "without", "except", "excluding", "kecuali", "selain"]
    claim_lower = claim.lower()
    source_lower = source.lower()

    claim_has_negation = any(nw in claim_lower for nw in negation_words)
    source_has_negation = any(nw in source_lower for nw in negation_words)

    if claim_has_negation != source_has_negation:
        return True
    return False


async def verify_claim(claim: str, sources: list[dict]) -> dict:
    if not sources:
        return {
            "claim": claim,
            "confidence": 0.0,
            "explanation": "No sources available for verification",
            "supporting_count": 0,
            "conflicting_count": 0,
            "supporting": [],
            "conflicting": [],
        }

    claim_tokens = _tokenize(claim)
    if not claim_tokens:
        return {
            "claim": claim,
            "confidence": 0.0,
            "explanation": "Claim too short to verify meaningfully",
            "supporting_count": 0,
            "conflicting_count": 0,
        }

    supporting = []
    conflicting = []
    total_weight = 0

    for src in sources:
        content = src.get("content") or ""
        url = src.get("url", "")
        title = src.get("title", "")

        source_tokens = _tokenize(content)
        match_ratio = _compute_match(claim_tokens, source_tokens)
        has_negation_mismatch = _detect_negation(claim, content)

        authority_bonus = 1.0
        if any(d in url for d in [".gov", ".edu", ".ac.id"]):
            authority_bonus = 1.3
        elif any(d in url for d in ["wikipedia", "nature.com", "science.org"]):
            authority_bonus = 1.15

        entry = {"url": url, "title": title, "match_score": round(match_ratio, 2)}

        if has_negation_mismatch:
            conflicting.append(entry)
            total_weight += 0.2 * authority_bonus
        elif match_ratio > 0.25:
            supporting.append(entry)
            total_weight += match_ratio * authority_bonus
        else:
            conflicting.append(entry)
            total_weight += 0.1 * authority_bonus

    total_sources = len(supporting) + len(conflicting)
    raw_confidence = total_weight / total_sources if total_sources > 0 else 0.0
    confidence = min(max(raw_confidence, 0.0), 1.0)

    if confidence > 0.7:
        explanation = f"{len(supporting)} of {total_sources} sources support this claim"
    elif confidence > 0.4:
        explanation = f"Mixed evidence: {len(supporting)} supporting, {len(conflicting)} conflicting"
    else:
        explanation = f"Most sources ({len(conflicting)}) do not support or contradict this claim"

    return {
        "claim": claim,
        "confidence": round(confidence, 2),
        "explanation": explanation,
        "supporting_count": len(supporting),
        "conflicting_count": len(conflicting),
        "supporting": supporting[:5],
        "conflicting": conflicting[:5],
    }
