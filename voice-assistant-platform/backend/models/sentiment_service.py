import asyncio
import time

from config import settings
from utils.logger import get_logger

logger = get_logger("models.sentiment")

try:
    from transformers import pipeline
except Exception:  # pragma: no cover
    pipeline = None


class SentimentService:
    LABEL_MAP = {"label_0": "negative", "label_1": "neutral", "label_2": "positive", "negative": "negative", "neutral": "neutral", "positive": "positive"}

    def __init__(self):
        self.available = False
        self.pipeline = None
        self.model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        self.load_time_ms = 0
        self.error: str | None = None

    async def load_model(self) -> None:
        if pipeline is None:
            self.error = "transformers unavailable"
            return
        start = time.perf_counter()
        try:
            self.pipeline = await asyncio.to_thread(
                pipeline,
                "text-classification",
                model=self.model_name,
                top_k=None,
                token=settings.HUGGINGFACE_TOKEN or None,
            )
            self.available = True
            self.error = None
            self.load_time_ms = int((time.perf_counter() - start) * 1000)
        except Exception as exc:
            self.available = False
            self.error = str(exc)

    def analyze(self, text: str) -> dict:
        fallback = {
            "sentiment": "neutral",
            "sentiment_score": 0.5,
            "label_scores": {"positive": 0.33, "neutral": 0.34, "negative": 0.33},
        }
        if not self.available or self.pipeline is None:
            return {**fallback, "error": "sentiment model unavailable"}

        try:
            clean_text = (text or "")[:512]
            raw = self.pipeline(clean_text)
            # pipeline(top_k=None) returns [ [..scores..] ]
            if raw and isinstance(raw[0], list):
                scores_raw = raw[0]
            else:
                scores_raw = raw

            label_scores = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
            for row in scores_raw:
                label = self.LABEL_MAP.get(str(row.get("label", "")).lower(), str(row.get("label", "")).lower())
                if label in label_scores:
                    label_scores[label] = float(row.get("score", 0.0))

            winner = max(label_scores, key=label_scores.get)
            return {
                "sentiment": winner,
                "sentiment_score": float(label_scores[winner]),
                "label_scores": label_scores,
            }
        except Exception as exc:
            return {**fallback, "error": str(exc)}


sentiment_service = SentimentService()
