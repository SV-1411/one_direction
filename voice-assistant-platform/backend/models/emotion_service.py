"""
Emotion-Aware AI Service
"""

import asyncio
import io
import random

import numpy as np
import structlog

logger = structlog.get_logger(__name__)

try:
    import librosa

    LIBROSA_AVAILABLE = True
except Exception:
    LIBROSA_AVAILABLE = False
    logger.warning("librosa_not_available")


class EmotionService:
    EMOTIONS = ["stressed", "confident", "nervous", "excited", "calm", "sad"]

    STRESS_INDICATORS = {"high_pitch_mean": 200, "high_pitch_variation": 50, "fast_speech_rate": 160, "low_pause_ratio": 0.1, "high_energy": 0.08}
    NERVOUSNESS_INDICATORS = {"very_fast_speech": 180, "high_tremor": 30, "many_pauses": 0.35, "low_energy": 0.02}
    EXCITEMENT_INDICATORS = {"high_pitch": 220, "fast_speech": 150, "high_energy": 0.07, "low_pauses": 0.08}
    CONFIDENCE_INDICATORS = {"moderate_pitch": (120, 180), "low_variation": 25, "moderate_speech": (100, 140), "moderate_pauses": (0.15, 0.3)}

    def __init__(self):
        self.available = LIBROSA_AVAILABLE

    async def analyze_audio(self, audio_bytes: bytes, transcript: str = "") -> dict:
        if not audio_bytes or len(audio_bytes) < 1000:
            return self._text_only_fallback(transcript)

        loop = asyncio.get_event_loop()
        try:
            features = await loop.run_in_executor(None, self._extract_audio_features, audio_bytes)
        except Exception:
            features = None

        if features is None or not LIBROSA_AVAILABLE:
            return self._text_only_fallback(transcript)

        if transcript and features.get("duration", 0) > 0:
            word_count = len(transcript.split())
            features["speech_rate_wpm"] = (word_count / features["duration"]) * 60
        else:
            features["speech_rate_wpm"] = 120

        emotion_scores = self._score_emotions(features)
        
        # Determine dominant emotion from scores
        dominant_emotion = max(emotion_scores, key=lambda k: emotion_scores[k])
        dominant_score = emotion_scores[dominant_emotion]

        # Post-process: If transcript contains high-intensity keywords, 
        # ensure dominant emotion reflects the sentiment even if audio features are subtle.
        text_lower = (transcript or "").lower()
        
        # High intensity maps
        stressed_keywords = ["pain", "hurt", "help", "emergency", "dying", "accident", "stop", "immediate", "urgent"]
        hostile_keywords = ["hate", "hateful", "shut up", "idiot", "stupid", "dumb", "kill", "die", "annoying"]
        sad_keywords = ["sad", "unhappy", "cry", "crying", "lonely", "alone", "depressed", "miserable", "broken"]
        
        if any(w in text_lower for w in stressed_keywords):
            emotion_scores["stressed"] = 0.9
            emotion_scores["calm"] = 0.0
        elif any(w in text_lower for w in hostile_keywords):
            emotion_scores["stressed"] = 0.8
            emotion_scores["nervous"] = 0.1
            emotion_scores["calm"] = 0.0
        elif any(w in text_lower for w in sad_keywords):
            emotion_scores["sad"] = 0.9
            emotion_scores["calm"] = 0.0

        # Re-normalize after keyword overrides
        total = sum(emotion_scores.values())
        emotion_scores = {k: v / total for k, v in emotion_scores.items()}
        
        dominant_emotion = max(emotion_scores, key=lambda k: emotion_scores[k])
        dominant_score = emotion_scores[dominant_emotion]

        suggestion = self._generate_suggestion(dominant_emotion, dominant_score, features)
        return {
            "dominant_emotion": dominant_emotion,
            "dominant_score": round(dominant_score, 3),
            "emotion_scores": {k: round(v, 3) for k, v in emotion_scores.items()},
            "audio_features": {
                "pitch_mean_hz": round(features.get("pitch_mean", 0), 1),
                "pitch_std_hz": round(features.get("pitch_std", 0), 1),
                "speech_rate_wpm": round(features.get("speech_rate_wpm", 0), 0),
                "pause_ratio": round(features.get("pause_ratio", 0), 3),
                "energy_rms": round(features.get("energy_rms", 0), 4),
                "tremor_score": round(features.get("tremor", 0), 3),
            },
            "suggestion": suggestion,
            "analysis_method": "audio" if LIBROSA_AVAILABLE else "text_fallback",
        }

    def _extract_audio_features(self, audio_bytes: bytes) -> dict:
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000, mono=True)
        duration = librosa.get_duration(y=y, sr=sr)
        if duration < 0.5:
            return None
        f0, voiced_flag, _ = librosa.pyin(y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7"), sr=sr)
        voiced_f0 = f0[voiced_flag] if voiced_flag is not None else f0[~np.isnan(f0)]
        if len(voiced_f0) > 0:
            pitch_mean = float(np.nanmean(voiced_f0))
            pitch_std = float(np.nanstd(voiced_f0))
            tremor = float(np.nanmean(np.abs(np.diff(voiced_f0)))) if len(voiced_f0) > 1 else 0.0
        else:
            pitch_mean = pitch_std = tremor = 0.0
        rms = librosa.feature.rms(y=y)[0]
        energy_rms = float(np.mean(rms))
        silence_threshold = np.max(rms) * 0.1 if len(rms) else 0
        pause_ratio = float(np.sum(rms < silence_threshold) / len(rms)) if len(rms) else 0.0
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        return {
            "pitch_mean": pitch_mean,
            "pitch_std": pitch_std,
            "tremor": tremor,
            "energy_rms": energy_rms,
            "pause_ratio": pause_ratio,
            "tone_brightness": float(np.mean(spectral_centroid)),
            "duration": duration,
        }

    def _score_emotions(self, features: dict) -> dict[str, float]:
        pitch_mean = features.get("pitch_mean", 0)
        pitch_std = features.get("pitch_std", 0)
        pause_ratio = features.get("pause_ratio", 0)
        speech_rate = features.get("speech_rate_wpm", 120)

        # Start with zero scores instead of high calm baseline
        scores = {
            "calm": 0.05,
            "happy": 0.05,
            "sad": 0.05,
            "stressed": 0.05,
            "nervous": 0.05,
        }

        # Stressed: High pitch, high variability, fast speech
        if pitch_mean > 220 or pitch_std > 40 or speech_rate > 150:
            scores["stressed"] += 0.6
        elif pitch_mean > 180 or pitch_std > 25:
            scores["stressed"] += 0.3

        # Happy: High pitch, moderate variability
        if 190 < pitch_mean < 280 and pitch_std > 25:
            scores["happy"] += 0.5

        # Sad: Low pitch, slow speech, many pauses
        if pitch_mean < 140 or pause_ratio > 0.25 or speech_rate < 100:
            scores["sad"] += 0.6

        # Nervous: High variability, many pauses
        if pitch_std > 35 and pause_ratio > 0.15:
            scores["nervous"] += 0.5

        # Calm: only if nothing else is prominent
        if max(scores.values()) <= 0.1:
            scores["calm"] += 0.5

        total = sum(scores.values())
        return {k: v / total for k, v in scores.items()}
        if lp <= pitch <= hp: confident += 0.4
        if pitch_std < self.CONFIDENCE_INDICATORS["low_variation"]: confident += 0.4
        if 100 <= wpm <= 150: confident += 0.2
        scores["confident"] = min(confident, 1.0)

        # Sad: Low pitch, low energy, slow speech
        sad = 0.0
        if 0 < pitch < 110: sad += 0.4
        if energy < 0.02: sad += 0.4
        if wpm < 90: sad += 0.2
        scores["sad"] = min(sad, 1.0)

        # Calm: Low energy, low tremor, moderate pauses
        calm = 0.0
        if energy < 0.05: calm += 0.3
        if tremor < 15: calm += 0.3
        if 0.15 <= pauses <= 0.45: calm += 0.2
        scores["calm"] = min(calm, 1.0)

        # Add a bit of randomness to non-zero scores to prevent identical outputs
        for k in scores:
            if scores[k] > 0:
                scores[k] = min(1.0, max(0.1, scores[k] + (random.random() * 0.1 - 0.05)))

        return scores

    def _text_only_fallback(self, transcript: str) -> dict:
        if not transcript:
            return self._neutral_result()
        text = transcript.lower()
        # Keyword-driven fallback (used when audio feature extraction fails).
        distress_terms = [
            "pain",
            "help",
            "hurt",
            "suicide",
            "kill myself",
            "die",
            "can't go on",
            "hopeless",
            "panic",
            "anxiety",
            "scared",
            "terrified",
        ]
        hate_terms = [
            "hate",
            "hateful",
            "stupid",
            "idiot",
            "worthless",
            "die",
            "kill",
            "shut up",
        ]

        distress_hits = sum(1 for w in distress_terms if w in text)
        hate_hits = sum(1 for w in hate_terms if w in text)

        scores = {
            "stressed": min(
                (sum(w in text for w in ["stressed", "overwhelmed", "pressure", "exhausted"]) * 0.3)
                + (distress_hits * 0.25)
                + (hate_hits * 0.15),
                1.0,
            ),
            "nervous": min(
                (sum(w in text for w in ["nervous", "anxious", "worried", "scared", "panic"]) * 0.3)
                + (distress_hits * 0.2),
                1.0,
            ),
            "excited": min(sum(w in text for w in ["excited", "amazing", "awesome", "fantastic"]) * 0.3, 1.0),
            "confident": min(sum(w in text for w in ["definitely", "absolutely", "certainly", "confident"]) * 0.3, 1.0),
            "sad": min(
                (sum(w in text for w in ["sad", "depressed", "upset", "hopeless", "lonely"]) * 0.3)
                + (distress_hits * 0.25),
                1.0,
            ),
            "calm": 0.1,
        }

        # If nothing triggers, default to calm.
        if max(scores.values()) <= 0.15:
            scores["calm"] = 0.6
        dominant = max(scores, key=scores.get)
        return {
            "dominant_emotion": dominant,
            "dominant_score": round(scores[dominant], 3),
            "emotion_scores": {k: round(v, 3) for k, v in scores.items()},
            "audio_features": {},
            "suggestion": self._generate_suggestion(dominant, scores[dominant], {}),
            "analysis_method": "text_fallback",
        }

    def _generate_suggestion(self, emotion: str, score: float, features: dict) -> str:
        if score < 0.4:
            return ""
        suggestions = {
            "stressed": ["You sound a bit stressed. Want a short breathing exercise?", "I hear tension in your voice. Want help prioritizing tasks?"],
            "nervous": ["You sound a little nervous — take your time, I’m here to help."],
            "excited": ["Great energy! Let’s channel it productively."],
            "confident": ["You sound focused and clear. Let’s keep the momentum."],
            "calm": ["You sound calm and collected — great for focused work."],
            "sad": ["You sound like you’re having a tough time. I’m here for you."],
        }
        options = [s for s in suggestions.get(emotion, [""]) if s]
        return random.choice(options) if options else ""

    def _neutral_result(self) -> dict:
        return {
            "dominant_emotion": "calm",
            "dominant_score": 0.3,
            "emotion_scores": {"stressed": 0.0, "confident": 0.3, "nervous": 0.0, "excited": 0.0, "calm": 0.5, "sad": 0.0},
            "audio_features": {},
            "suggestion": "",
            "analysis_method": "unavailable",
        }


emotion_service = EmotionService()
