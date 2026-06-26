async def verify_claim(claim: str, sources: list[dict]) -> dict:
    if not sources:
        return {
            "claim": claim,
            "confidence": 0.0,
            "supporting": [],
            "conflicting": [],
            "reason": "No sources available for verification",
        }

    supporting = []
    conflicting = []

    for src in sources:
        content = (src.get("content") or "").lower()
        claim_lower = claim.lower()
        claim_words = set(claim_lower.split())

        matches = sum(1 for word in claim_words if word in content)
        match_ratio = matches / len(claim_words) if claim_words else 0

        entry = {
            "url": src.get("url", ""),
            "title": src.get("title", ""),
            "match_score": round(match_ratio, 2),
        }

        if match_ratio > 0.3:
            supporting.append(entry)
        else:
            conflicting.append(entry)

    total = len(supporting) + len(conflicting)
    confidence = len(supporting) / total if total > 0 else 0.0

    return {
        "claim": claim,
        "confidence": round(confidence, 2),
        "supporting_count": len(supporting),
        "conflicting_count": len(conflicting),
        "supporting": supporting[:5],
        "conflicting": conflicting[:5],
    }
