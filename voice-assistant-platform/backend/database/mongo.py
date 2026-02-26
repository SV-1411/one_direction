import time
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from config import settings
from utils.logger import get_logger

logger = get_logger("database.mongo")

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def init_database() -> AsyncIOMotorDatabase:
    global _client, _db
    if _db is not None:
        return _db
    _client = AsyncIOMotorClient(settings.MONGODB_URI, maxPoolSize=50, minPoolSize=5)
    _db = _client.get_default_database()
    await create_indexes()
    logger.info("database_initialized", uri=settings.MONGODB_URI)
    return _db


async def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        return await init_database()
    return _db


async def create_indexes() -> None:
    db = _db
    if db is None:
        return
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("api_key", unique=True)

    await db.voice_sessions.create_index("session_id", unique=True)
    await db.voice_sessions.create_index("user_id")
    await db.voice_sessions.create_index("started_at")
    await db.voice_sessions.create_index("escalation_required")

    await db.messages.create_index("session_id")
    await db.messages.create_index("timestamp")

    await db.integration_logs.create_index("timestamp")
    await db.integration_logs.create_index("integration")

    await db.analytics.create_index("date", unique=True)

    await db["gml_entities"].create_index([("entity_id", 1)], unique=True)
    await db["gml_entities"].create_index([("user_id", 1)])
    await db["gml_entities"].create_index([("user_id", 1), ("is_forgotten", 1)])
    await db["gml_entities"].create_index([("name", "text")])
    await db["gml_entities"].create_index([("last_seen", -1)])

    await db["gml_relationships"].create_index([("relationship_id", 1)], unique=True)
    await db["gml_relationships"].create_index([("user_id", 1), ("subject_entity_id", 1)])
    await db["gml_relationships"].create_index([("user_id", 1), ("object_entity_id", 1)])
    await db["gml_relationships"].create_index([("predicate", 1)])

    await db["gml_events"].create_index([("event_id", 1)], unique=True)
    await db["gml_events"].create_index([("user_id", 1), ("timestamp", -1)])
    await db["gml_events"].create_index([("session_id", 1)])

    await db["gml_memory_snapshots"].create_index([("user_id", 1), ("snapshot_date", -1)])


async def close_database() -> None:
    global _client, _db
    if _client:
        _client.close()
        logger.info("database_closed")
    _client = None
    _db = None


async def ping_database() -> tuple[bool, int]:
    db = await get_database()
    start = time.perf_counter()
    try:
        await db.command("ping")
        ms = int((time.perf_counter() - start) * 1000)
        return True, ms
    except Exception as exc:
        logger.error("database_ping_failed", error=str(exc))
        return False, -1


async def insert_integration_log(payload: dict[str, Any]) -> None:
    db = await get_database()
    await db.integration_logs.insert_one(payload)
