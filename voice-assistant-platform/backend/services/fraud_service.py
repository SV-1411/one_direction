import re
from difflib import SequenceMatcher

OTP_PATTERNS = [r"\botp\b", r"\bpin\b", r"password", r"verification code"]
TAKEOVER = [r"reset .*password", r"change .*email", r"disable .*2fa"]
SENSITIVE = [r"\bssn\b", r"\bcvv\b", r"card number", r"full card"]


def evaluate(transcript: str, history: list[dict]) -> dict:
    signals = []
    risk = 0.0
    lower = transcript.lower()

    otp_hits = sum(bool(re.search(p, lower)) for p in OTP_PATTERNS)
    if otp_hits:
        signals.append("otp_repeated")
        risk += min(0.4, 0.15 * otp_hits)

    if any(re.search(p, lower) for p in TAKEOVER):
        signals.append("account_takeover_phrase")
        risk += 0.25

    if any(re.search(p, lower) for p in SENSITIVE):
        signals.append("sensitive_data_fishing")
        risk += 0.25

    if history:
        similarities = [SequenceMatcher(a=h.get("transcript", "").lower(), b=lower).ratio() for h in history[-5:]]
        if any(v > 0.92 for v in similarities):
            signals.append("repetitive_queries")
            risk += 0.15

    if len(history) > 4 and len({h.get("transcript", "").split(" ")[0:1][0] if h.get("transcript") else "" for h in history[-5:]}) > 4:
        signals.append("abnormal_topic_switching")
        risk += 0.1

    risk = min(1.0, risk)
    return {"fraud_risk": risk, "fraud_signals": signals, "escalation_required": risk > 0.65}
