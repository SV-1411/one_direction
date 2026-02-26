from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class UserCreate(BaseSchema):
    username: str
    email: EmailStr
    password: str
    role: Literal["admin", "agent"] = "agent"


class UserUpdate(BaseSchema):
    username: str | None = None
    email: EmailStr | None = None


class UserInDB(BaseSchema):
    id: str | None = Field(default=None, alias="_id")
    username: str
    email: EmailStr
    hashed_password: str
    role: Literal["admin", "agent"] = "agent"
    api_key: str
    created_at: datetime
    last_login: datetime | None = None


class UserResponse(BaseSchema):
    id: str | None = Field(default=None, alias="_id")
    username: str
    email: EmailStr
    role: Literal["admin", "agent"]
    api_key: str | None = None
    created_at: datetime | None = None


class VoiceSessionCreate(BaseSchema):
    channel: Literal["web", "whatsapp"] = "web"


class VoiceSessionUpdate(BaseSchema):
    status: Literal["active", "completed", "escalated"] | None = None
    ended_at: datetime | None = None
    final_sentiment: str | None = None
    escalation_required: bool | None = None


class VoiceSessionInDB(BaseSchema):
    id: str | None = Field(default=None, alias="_id")
    session_id: str
    user_id: str
    channel: Literal["web", "whatsapp"]
    status: Literal["active", "completed", "escalated"] = "active"
    started_at: datetime
    ended_at: datetime | None = None
    total_messages: int = 0
    final_sentiment: str | None = None
    peak_urgency_score: float = 0.0
    peak_fraud_score: float = 0.0
    escalation_required: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class VoiceSessionResponse(VoiceSessionInDB):
    pass


class MessageCreate(BaseSchema):
    session_id: str
    role: Literal["user", "assistant"]
    transcript: str
    audio_path: str | None = None


class MessageInDB(BaseSchema):
    id: str | None = Field(default=None, alias="_id")
    session_id: str
    role: Literal["user", "assistant"]
    transcript: str
    audio_path: str | None = None
    sentiment: str
    sentiment_score: float
    urgency_score: float
    fraud_risk: float
    escalation_required: bool
    processing_time_ms: int
    timestamp: datetime


class MessageResponse(MessageInDB):
    pass


class IntegrationLogCreate(BaseSchema):
    integration: Literal["whatsapp", "n8n", "crm"]
    direction: Literal["inbound", "outbound"]
    payload: dict[str, Any]
    status: Literal["success", "failed"]
    error: str | None = None


class IntegrationLogInDB(IntegrationLogCreate):
    id: str | None = Field(default=None, alias="_id")
    timestamp: datetime


class AnalyticsRecord(BaseSchema):
    id: str | None = Field(default=None, alias="_id")
    date: str
    total_sessions: int
    avg_sentiment_score: float
    fraud_alerts_count: int
    escalations_count: int
    urgency_distribution: dict[str, int]


class DashboardStats(BaseSchema):
    total_sessions: int
    active_sessions: int
    sessions_today: int
    avg_sentiment_score_7d: float
    fraud_alerts_count: int
    escalations_today: int
    sentiment_trend: list[dict[str, Any]]
    session_volume: list[dict[str, Any]]
    urgency_distribution: dict[str, int]


class EmotionResult(BaseSchema):
    dominant_emotion: str
    dominant_score: float
    emotion_scores: dict[str, float]
    audio_features: dict[str, float] = Field(default_factory=dict)
    suggestion: str = ""
    analysis_method: str = "audio"


class AnalysisResult(BaseSchema):
    sentiment: str
    sentiment_score: float
    urgency_score: float
    fraud_risk: float
    fraud_signals: list[str]
    escalation_required: bool
    label_scores: dict[str, float]
    urgency_label: str = "low"
    emotion: EmotionResult | None = None


class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseSchema):
    refresh_token: str


class WhatsAppMessage(BaseSchema):
    from_number: str
    text: str


class WhatsAppWebhookPayload(BaseSchema):
    payload: dict[str, Any]


class N8nAlertPayload(BaseSchema):
    event: str
    trigger: str
    session_id: str
    timestamp: str
    analysis: dict[str, Any]
    session_url: str


class ModelStatus(BaseSchema):
    available: bool
    model_name: str
    load_time_ms: int
    error: str | None = None


class HealthStatus(BaseSchema):
    status: str
    timestamp: str
    version: str
    database: dict[str, Any]
    models: dict[str, dict[str, Any]]
    integrations: dict[str, Any]


class UserLogin(BaseSchema):
    username: str
    password: str


class StartSessionRequest(BaseSchema):
    channel: Literal["web", "whatsapp"] = "web"


class EndSessionRequest(BaseSchema):
    session_id: str
