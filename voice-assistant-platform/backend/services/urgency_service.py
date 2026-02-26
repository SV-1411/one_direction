import re

CRITICAL = ["emergency", "help now", "immediately", "urgent", "right now"]
HIGH = ["asap", "can't wait", "critical", "panic"]
MEDIUM = ["soon", "important", "please hurry"]


def score(text: str, sentiment_result: dict) -> float:
    lower = text.lower()
    s = 0.0
    s += sum(0.15 for w in CRITICAL if w in lower)
    s += sum(0.1 for w in HIGH if w in lower)
    s += sum(0.05 for w in MEDIUM if w in lower)

    exclam = min(text.count("!"), 5) * 0.03
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    repetition = 0.08 if re.search(r"(\b\w+\b)(?:\s+\1){2,}", lower) else 0
    sentiment_amp = 0.2 * sentiment_result.get("label_scores", {}).get("negative", 0.0)

    return max(0.0, min(1.0, s + exclam + caps_ratio + repetition + sentiment_amp))
