import uuid
from datetime import datetime
from typing import List, Optional

from .embedding_service import embedding_service


class EventStore:
    COLLECTION = "gml_events"

    async def record_event(self, db, user_id: str, session_id: str, description: str, participants: List[str] = None, entities_mentioned: List[str] = None, source_transcript: str = "") -> dict:
        embedding = await embedding_service.embed(description)
        event = {
            "event_id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_id": session_id,
            "description": description,
            "embedding": embedding,
            "participants": participants or [],
            "entities_mentioned": entities_mentioned or [],
            "timestamp": datetime.utcnow(),
            "confidence": 1.0,
            "source_transcript": source_transcript[:500],
        }
        result = await db[self.COLLECTION].insert_one(event)
        event["_id"] = str(result.inserted_id)
        return event

    async def search_events(self, db, user_id: str, query_text: str, top_k: int = 10, since_days: int = None) -> List[dict]:
        query_embedding = await embedding_service.embed(query_text)
        filter_query = {"user_id": user_id}
        if since_days:
            from datetime import timedelta

            filter_query["timestamp"] = {"$gte": datetime.utcnow() - timedelta(days=since_days)}
        all_events = await db[self.COLLECTION].find(filter_query).sort("timestamp", -1).to_list(length=500)
        return await embedding_service.find_most_similar(query_embedding, all_events, top_k=top_k, threshold=0.35)

    async def get_events_for_session(self, db, session_id: str) -> List[dict]:
        return await db[self.COLLECTION].find({"session_id": session_id}).sort("timestamp", 1).to_list(length=100)

    async def get_events_for_entity(self, db, user_id: str, entity_id: str) -> List[dict]:
        return await db[self.COLLECTION].find({"user_id": user_id, "$or": [{"participants": entity_id}, {"entities_mentioned": entity_id}]}).sort("timestamp", -1).to_list(length=100)

    async def get_timeline(self, db, user_id: str, limit: int = 50) -> List[dict]:
        return await db[self.COLLECTION].find({"user_id": user_id}).sort("timestamp", -1).limit(limit).to_list(length=limit)


event_store = EventStore()
