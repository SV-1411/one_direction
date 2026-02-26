import uuid
from datetime import datetime
from typing import List, Optional

import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = structlog.get_logger(__name__)


class RelationshipStore:
    COLLECTION = "gml_relationships"

    PREDICATE_SYNONYMS = {
        "met": ["encountered", "saw", "visited", "ran into"],
        "liked": ["loved", "enjoyed", "appreciated", "fond of", "cared about"],
        "disliked": ["hated", "despised", "annoyed by", "bothered by"],
        "worked_with": ["collaborated with", "partnered with", "teamed with"],
        "talked_about": ["mentioned", "discussed", "referenced", "spoke about"],
        "knows": ["familiar with", "acquainted with"],
        "related_to": ["connected to", "associated with", "linked to"],
    }

    def _normalize_predicate(self, predicate: str) -> str:
        pred_lower = predicate.lower().strip()
        for canonical, synonyms in self.PREDICATE_SYNONYMS.items():
            if pred_lower == canonical or pred_lower in synonyms:
                return canonical
        return pred_lower.replace(" ", "_")

    async def create_relationship(self, db: AsyncIOMotorDatabase, user_id: str, subject_entity_id: str, predicate: str, object_entity_id: str, confidence: float = 0.9, evidence_session_id: str = None) -> dict:
        normalized_pred = self._normalize_predicate(predicate)
        existing = await db[self.COLLECTION].find_one({"user_id": user_id, "subject_entity_id": subject_entity_id, "predicate": normalized_pred, "object_entity_id": object_entity_id, "is_forgotten": False})
        if existing:
            update = {"$set": {"updated_at": datetime.utcnow(), "confidence": min(1.0, existing["confidence"] + 0.1), "strength": min(1.0, existing.get("strength", 0.5) + 0.15)}}
            if evidence_session_id:
                update["$addToSet"] = {"evidence": evidence_session_id}
            await db[self.COLLECTION].update_one({"_id": existing["_id"]}, update)
            existing["confidence"] = min(1.0, existing["confidence"] + 0.1)
            return existing
        relationship = {
            "relationship_id": str(uuid.uuid4()),
            "user_id": user_id,
            "subject_entity_id": subject_entity_id,
            "predicate": normalized_pred,
            "object_entity_id": object_entity_id,
            "strength": confidence,
            "confidence": confidence,
            "evidence": [evidence_session_id] if evidence_session_id else [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_forgotten": False,
        }
        result = await db[self.COLLECTION].insert_one(relationship)
        relationship["_id"] = str(result.inserted_id)
        return relationship

    async def get_relationships_for_entity(self, db: AsyncIOMotorDatabase, user_id: str, entity_id: str, direction: str = "both") -> List[dict]:
        if direction == "both":
            q = {"user_id": user_id, "is_forgotten": False, "$or": [{"subject_entity_id": entity_id}, {"object_entity_id": entity_id}]}
        elif direction == "subject":
            q = {"user_id": user_id, "subject_entity_id": entity_id, "is_forgotten": False}
        else:
            q = {"user_id": user_id, "object_entity_id": entity_id, "is_forgotten": False}
        return await db[self.COLLECTION].find(q).sort("strength", -1).to_list(length=200)

    async def query_relationships(self, db: AsyncIOMotorDatabase, user_id: str, subject_entity_id: str = None, predicate: str = None, object_entity_id: str = None) -> List[dict]:
        q = {"user_id": user_id, "is_forgotten": False}
        if subject_entity_id:
            q["subject_entity_id"] = subject_entity_id
        if predicate:
            q["predicate"] = self._normalize_predicate(predicate)
        if object_entity_id:
            q["object_entity_id"] = object_entity_id
        return await db[self.COLLECTION].find(q).sort("strength", -1).to_list(length=100)

    async def get_graph_data(self, db, user_id: str) -> dict:
        from .entity_store import entity_store

        entities = await entity_store.list_entities(db, user_id, limit=200)
        relationships = await db[self.COLLECTION].find({"user_id": user_id, "is_forgotten": False}).to_list(length=500)
        nodes = [{"id": e["entity_id"], "label": e["name"], "type": e["type"], "confidence": e["confidence"], "mention_count": e.get("mention_count", 1)} for e in entities]
        edges = [{"id": r["relationship_id"], "source": r["subject_entity_id"], "target": r["object_entity_id"], "label": r["predicate"], "strength": r["strength"]} for r in relationships]
        return {"nodes": nodes, "edges": edges}

    async def forget_relationship(self, db, user_id: str, relationship_id: str) -> bool:
        result = await db[self.COLLECTION].update_one({"relationship_id": relationship_id, "user_id": user_id}, {"$set": {"is_forgotten": True}})
        return result.modified_count > 0


relationship_store = RelationshipStore()
