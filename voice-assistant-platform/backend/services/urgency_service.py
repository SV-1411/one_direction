CRITICAL_KEYWORDS = [
    "emergency", "urgent", "critical", "immediately", "right now", "dying", "heart attack", "can't breathe", "fire", "danger", "help me", "please hurry", "asap", "life or death",
]
HIGH_KEYWORDS = ["important", "serious", "worried", "scared", "panicking", "need help now", "very bad", "terrible", "awful", "desperate"]
MEDIUM_KEYWORDS = ["problem", "issue", "concerned", "worried", "trouble", "not working", "broken", "failed", "error", "wrong"]
TIME_PRESSURE_PHRASES = ["by tonight", "before tomorrow", "in the next hour", "deadline", "running out of time", "limited time", "expires soon"]


def score(transcript: str, sentiment_result: dict) -> float:
    text_lower = (transcript or "").lower()
    value = 0.0

    critical_matches = [kw for kw in CRITICAL_KEYWORDS if kw in text_lower]
    value += min(len(critical_matches) * 0.4, 0.8)

    high_matches = [kw for kw in HIGH_KEYWORDS if kw in text_lower]
    value += min(len(high_matches) * 0.2, 0.4)

    medium_matches = [kw for kw in MEDIUM_KEYWORDS if kw in text_lower]
    value += min(len(medium_matches) * 0.1, 0.2)

    time_matches = [p for p in TIME_PRESSURE_PHRASES if p in text_lower]
    value += min(len(time_matches) * 0.15, 0.3)

    if transcript.count("!") >= 3:
        value += 0.1

    words = transcript.split()
    if words:
        caps_ratio = sum(1 for w in words if w.isupper() and len(w) > 2) / len(words)
        if caps_ratio > 0.3:
            value += 0.1

    neg_score = sentiment_result.get("label_scores", {}).get("negative", 0)
    value = value * (1 + neg_score * 0.3)

    return round(min(value, 1.0), 3)


def get_urgency_label(value: float) -> str:
    if value >= 0.85:
        return "critical"
    if value >= 0.65:
        return "high"
    if value >= 0.35:
        return "medium"
    return "low"
