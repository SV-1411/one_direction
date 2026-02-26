from config import settings
from utils.logger import get_logger

logger = get_logger("sentiment")

try:
    from transformers import pipeline
except Exception:  # pragma: no cover
    pipeline = None


class SentimentService:
    def __init__(self):
        self.classifier = None
        self.available = False

    def load(self):
        if pipeline is None:
            logger.warning("sentiment_import_failed")
            return
        try:
            self.classifier = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                token=settings.huggingface_token or None,
            )
            self.available = True
            logger.info("sentiment_loaded")
        except Exception as exc:
            logger.warning("sentiment_unavailable", error=str(exc))

    def analyze(self, text: str) -> dict:
        if not self.available or self.classifier is None:
            raise RuntimeError("SENTIMENT_UNAVAILABLE")
        result = self.classifier(text, return_all_scores=True)[0]
        mapped = {row["label"].lower(): float(row["score"]) for row in result}
        sentiment = max(mapped, key=mapped.get)
        return {
            "sentiment": sentiment,
            "sentiment_score": mapped[sentiment],
            "label_scores": mapped,
        }


sentiment_service = SentimentService()
