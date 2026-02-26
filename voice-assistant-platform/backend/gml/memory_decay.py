import asyncio
from datetime import datetime

import structlog

logger = structlog.get_logger(__name__)


class MemoryDecayService:
    MIN_CONFIDENCE = 0.15
    DEFAULT_DECAY_RATE = 0.05
    PROTECTED_TYPES = ["person"]

    async def run_decay_cycle(self, db) -> dict:
        now = datetime.utcnow()
        stats = {"entities_decayed": 0, "entities_forgotten": 0, "relationships_decayed": 0, "relationships_forgotten": 0}

        entities = await db["gml_entities"].find({"is_forgotten": False}).to_list(length=10000)
        for entity in entities:
            last_seen = entity.get("last_seen", entity.get("first_seen", now))
            days_elapsed = (now - last_seen).total_seconds() / 86400
            if days_elapsed < 1:
                continue
            decay_rate = entity.get("decay_rate", self.DEFAULT_DECAY_RATE)
            if entity.get("type") in self.PROTECTED_TYPES:
                decay_rate *= 0.3
            mention_factor = min(1.0, 1.0 / (1 + entity.get("mention_count", 1) * 0.1))
            effective_decay = decay_rate * mention_factor
            new_confidence = max(0.0, min(1.0, entity["confidence"] * ((1 - effective_decay) ** days_elapsed)))
            if new_confidence < self.MIN_CONFIDENCE:
                await db["gml_entities"].update_one({"_id": entity["_id"]}, {"$set": {"is_forgotten": True, "confidence": 0.0}})
                stats["entities_forgotten"] += 1
            else:
                await db["gml_entities"].update_one({"_id": entity["_id"]}, {"$set": {"confidence": round(new_confidence, 4)}})
                stats["entities_decayed"] += 1

        relationships = await db["gml_relationships"].find({"is_forgotten": False}).to_list(length=10000)
        for rel in relationships:
            last_updated = rel.get("updated_at", rel.get("created_at", now))
            days_elapsed = (now - last_updated).total_seconds() / 86400
            if days_elapsed < 1:
                continue
            evidence_factor = min(1.0, 1.0 / (1 + len(rel.get("evidence", [])) * 0.2))
            effective_decay = self.DEFAULT_DECAY_RATE * evidence_factor
            new_confidence = max(0.0, min(1.0, rel["confidence"] * ((1 - effective_decay) ** days_elapsed)))
            if new_confidence < self.MIN_CONFIDENCE:
                await db["gml_relationships"].update_one({"_id": rel["_id"]}, {"$set": {"is_forgotten": True, "confidence": 0.0}})
                stats["relationships_forgotten"] += 1
            else:
                await db["gml_relationships"].update_one({"_id": rel["_id"]}, {"$set": {"confidence": round(new_confidence, 4)}})
                stats["relationships_decayed"] += 1

        logger.info("decay_cycle_complete", **stats)
        return stats

    async def reinforce_entity(self, db, entity_id: str, boost: float = 0.2):
        entity = await db["gml_entities"].find_one({"entity_id": entity_id})
        if entity:
            new_conf = min(1.0, entity["confidence"] + boost)
            await db["gml_entities"].update_one({"entity_id": entity_id}, {"$set": {"confidence": new_conf, "last_seen": datetime.utcnow()}, "$inc": {"mention_count": 1}})

    async def schedule_decay_loop(self, db, interval_hours: int = 24):
        while True:
            await asyncio.sleep(interval_hours * 3600)
            try:
                await self.run_decay_cycle(db)
            except Exception as e:
                logger.error("decay_cycle_error", error=str(e))


memory_decay = MemoryDecayService()
