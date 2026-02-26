import uuid
from datetime import datetime
from typing import Dict, List, Optional

import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase

from .embedding_service import embedding_service

logger = structlog.get_logger(__name__)


class EntityStore:
    COLLECTION = "gml_entities"

    PERSON_KEYWORDS = ["girl", "guy", "man", "woman", "person", "he", "she", "him", "her", "friend", "colleague", "boss", "doctor", "teacher", "someone"]
    PLACE_KEYWORDS = ["place", "city", "country", "restaurant", "office", "school", "hospital", "park", "street", "building", "location"]
    ORGANIZATION_KEYWORDS = ["company", "organization", "team", "department", "firm", "startup", "agency", "university", "institute"]

    async def create_entity(self, db: AsyncIOMotorDatabase, user_id: str, name: str, entity_type: str = "concept", attributes: Dict = None, source_text: str = "") -> dict:
        embedding = await embedding_service.embed(f"{name} {source_text}")
        entity = {
            "entity_id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": name,
            "type": entity_type,
            "aliases": [],
            "embedding": embedding,
            "attributes": attributes or {},
            "confidence": 1.0,
            "mention_count": 1,
            "first_seen": datetime.utcnow(),
            "last_seen": datetime.utcnow(),
            "decay_rate": 0.05,
            "is_forgotten": False,
        }
        result = await db[self.COLLECTION].insert_one(entity)
        entity["_id"] = str(result.inserted_id)
        logger.info("entity_created", entity_id=entity["entity_id"], name=name, type=entity_type)
        return entity

    async def resolve_entity(self, db: AsyncIOMotorDatabase, user_id: str, reference_text: str, context: str = "", similarity_threshold: float = 0.72) -> Optional[dict]:
        query_text = f"{reference_text} {context}"
        query_embedding = await embedding_service.embed(query_text)
        candidates = await db[self.COLLECTION].find({"user_id": user_id, "is_forgotten": False}).to_list(length=500)
        if not candidates:
            return None
        similar = await embedding_service.find_most_similar(query_embedding, candidates, embedding_field="embedding", top_k=3, threshold=similarity_threshold)
        if similar:
            best_match = similar[0]
            await db[self.COLLECTION].update_one(
                {"entity_id": best_match["entity_id"]},
                {"$set": {"last_seen": datetime.utcnow()}, "$inc": {"mention_count": 1}, "$addToSet": {"aliases": reference_text.lower().strip()}},
            )
            return best_match
        ref_lower = reference_text.lower()
        for candidate in candidates:
            name_lower = candidate["name"].lower()
            aliases_lower = [a.lower() for a in candidate.get("aliases", [])]
            if ref_lower in name_lower or name_lower in ref_lower:
                return candidate
            if any(ref_lower in alias or alias in ref_lower for alias in aliases_lower):
                return candidate
        return None

    async def get_or_create_entity(self, db: AsyncIOMotorDatabase, user_id: str, reference_text: str, context: str = "", entity_type: str = None) -> tuple[dict, bool]:
        existing = await self.resolve_entity(db, user_id, reference_text, context)
        if existing:
            return existing, False
        if not entity_type:
            entity_type = self._detect_entity_type(reference_text)
        new_entity = await self.create_entity(db, user_id, reference_text, entity_type, source_text=context)
        return new_entity, True

    def _detect_entity_type(self, text: str) -> str:
        lower = text.lower()
        if any(kw in lower for kw in self.PERSON_KEYWORDS):
            return "person"
        if any(kw in lower for kw in self.PLACE_KEYWORDS):
            return "place"
        if any(kw in lower for kw in self.ORGANIZATION_KEYWORDS):
            return "organization"
        return "concept"

    async def get_entity(self, db, user_id: str, entity_id: str) -> Optional[dict]:
        return await db[self.COLLECTION].find_one({"entity_id": entity_id, "user_id": user_id, "is_forgotten": False})

    async def list_entities(self, db, user_id: str, entity_type: str = None, skip: int = 0, limit: int = 50) -> List[dict]:
        q = {"user_id": user_id, "is_forgotten": False}
        if entity_type:
            q["type"] = entity_type
        return await db[self.COLLECTION].find(q).sort("last_seen", -1).skip(skip).limit(limit).to_list(length=limit)

    async def search_entities(self, db, user_id: str, query_text: str, top_k: int = 10) -> List[dict]:
        query_embedding = await embedding_service.embed(query_text)
        all_entities = await db[self.COLLECTION].find({"user_id": user_id, "is_forgotten": False}).to_list(length=1000)
        return await embedding_service.find_most_similar(query_embedding, all_entities, top_k=top_k, threshold=0.4)

    async def forget_entity(self, db, user_id: str, entity_id: str) -> bool:
        result = await db[self.COLLECTION].update_one({"entity_id": entity_id, "user_id": user_id}, {"$set": {"is_forgotten": True, "confidence": 0.0}})
        return result.modified_count > 0

    async def update_confidence(self, db, entity_id: str, new_confidence: float):
        await db[self.COLLECTION].update_one({"entity_id": entity_id}, {"$set": {"confidence": max(0.0, min(1.0, new_confidence))}})


entity_store = EntityStore()
