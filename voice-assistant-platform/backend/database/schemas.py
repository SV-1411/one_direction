from pydantic import BaseModel, EmailStr
from typing import Literal, Any
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Literal["admin", "agent"] = "agent"


class UserLogin(BaseModel):
    username: str
    password: str


class StartSessionRequest(BaseModel):
    channel: Literal["web", "whatsapp"] = "web"


class EndSessionRequest(BaseModel):
    session_id: str


class MessageAnalysis(BaseModel):
    sentiment: str
    sentiment_score: float
    urgency_score: float
    fraud_risk: float
    escalation_required: bool
    fraud_signals: list[str] = []
    label_scores: dict[str, float] = {}


class IntegrationLog(BaseModel):
    integration: str
    direction: str
    payload: dict[str, Any]
    status: str
    error: str | None = None
    timestamp: datetime
