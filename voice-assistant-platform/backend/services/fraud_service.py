import re

from config import settings
from utils.helpers import calculate_levenshtein_similarity


class FraudService:
    OTP_PATTERNS = [
        r"\b(otp|one.?time.?password|verification.?code|auth.?code)\b",
        r"\bsend.{0,20}(code|otp|pin)\b",
        r"\b(enter|provide|give).{0,20}(otp|pin|code)\b",
    ]
    ACCOUNT_TAKEOVER_PATTERNS = [
        r"\b(reset|change|update).{0,20}password\b",
        r"\b(forgot|lost|cant.?access).{0,20}(account|password|email)\b",
        r"\bverify.{0,20}(identity|account|yourself)\b",
        r"\b(social.?security|ssn|social.?insurance)\b",
        r"\b(cvv|card.?verification|security.?code).{0,20}(number|digit)\b",
        r"\bfull.{0,20}card.{0,20}number\b",
        r"\b(mother.?maiden|security.?question)\b",
    ]
    SENSITIVE_DATA_PATTERNS = [
        r"\b\d{3}-\d{2}-\d{4}\b",
        r"\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b",
        r"\b(pin|password|passcode)\s*:?\s*\d{4,}\b",
    ]

    def _count_pattern_matches(self, text: str, patterns: list[str]) -> tuple[int, list[str]]:
        found_signals = []
        total = 0
        for p in patterns:
            matches = re.findall(p, text, flags=re.IGNORECASE)
            if matches:
                total += len(matches)
                found_signals.append(p)
        return total, found_signals

    def _check_repetition(self, current_text: str, history: list[dict]) -> float:
        user_msgs = [m for m in history if m.get("role") == "user"][-3:]
        if not user_msgs:
            return 0.0
        sims = [calculate_levenshtein_similarity(current_text.lower(), (m.get("transcript", "")).lower()) for m in user_msgs]
        if any(s > 0.85 for s in sims):
            return 0.25
        if sims and (sum(sims) / len(sims)) > 0.6:
            return 0.15
        return 0.0

    def _detect_topic_switching(self, history: list[dict]) -> float:
        user_msgs = [m for m in history if m.get("role") == "user"][-5:]
        topics = set()
        for msg in user_msgs:
            t = (msg.get("transcript", "") or "").lower()
            if self._count_pattern_matches(t, self.OTP_PATTERNS)[0] > 0:
                topics.add("otp")
            if self._count_pattern_matches(t, self.ACCOUNT_TAKEOVER_PATTERNS)[0] > 0:
                topics.add("account")
            if self._count_pattern_matches(t, self.SENSITIVE_DATA_PATTERNS)[0] > 0:
                topics.add("sensitive")
            if any(k in t for k in ["refund", "money", "transfer", "payment", "bank"]):
                topics.add("financial")
        if len(topics) >= 3:
            return 0.2
        if len(topics) == 2:
            return 0.1
        return 0.0

    def evaluate(self, transcript: str, session_history: list[dict]) -> dict:
        score = 0.0
        signals = []

        otp_count, otp_signals = self._count_pattern_matches(transcript, self.OTP_PATTERNS)
        if otp_count > 0:
            history_otp_count = sum(
                1
                for msg in session_history[-10:]
                if msg.get("role") == "user" and self._count_pattern_matches(msg.get("transcript", ""), self.OTP_PATTERNS)[0] > 0
            )
            score += min(0.3 + (history_otp_count * 0.15), 0.9)
            signals.extend(otp_signals)

        at_count, at_signals = self._count_pattern_matches(transcript, self.ACCOUNT_TAKEOVER_PATTERNS)
        if at_count > 0:
            score += min(at_count * 0.25, 0.75)
            signals.extend(at_signals)

        sd_count, sd_signals = self._count_pattern_matches(transcript, self.SENSITIVE_DATA_PATTERNS)
        if sd_count > 0:
            score += min(sd_count * 0.4, 0.8)
            signals.extend(sd_signals)

        rep_score = self._check_repetition(transcript, session_history)
        if rep_score > 0:
            score += rep_score
            signals.append("repeated_similar_queries")

        ts_score = self._detect_topic_switching(session_history)
        if ts_score > 0:
            score += ts_score
            signals.append("abnormal_topic_switching")

        fraud_risk = min(score, 1.0)
        return {
            "fraud_risk": round(fraud_risk, 3),
            "fraud_signals": list(set(signals)),
            "escalation_required": fraud_risk > settings.FRAUD_ALERT_THRESHOLD,
        }


fraud_service = FraudService()
