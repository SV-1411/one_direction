from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from config import settings
from utils.logger import get_logger

logger = get_logger("mongo")
client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_mongo() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_default_database()
    await ensure_indexes()
    logger.info("mongo_connected", uri=settings.mongodb_uri)


async def disconnect_mongo() -> None:
    if client:
        client.close()
        logger.info("mongo_disconnected")


async def ensure_indexes() -> None:
    if db is None:
        return
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("api_key", unique=True)

    await db.voice_sessions.create_index("session_id", unique=True)
    await db.voice_sessions.create_index("started_at")
    await db.voice_sessions.create_index("escalation_required")

    await db.messages.create_index("session_id")
    await db.messages.create_index("timestamp")

    await db.integration_logs.create_index("timestamp")
    await db.analytics.create_index("date", unique=True)


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database not initialized")
    return db
