from typing import List

import structlog

from .embedding_service import embedding_service
from .entity_store import entity_store
from .event_store import event_store
from .memory_decay import memory_decay
from .memory_summarizer import memory_summarizer
from .relationship_store import relationship_store

logger = structlog.get_logger(__name__)


class MemoryEngine:
    async def initialize(self):
        await embedding_service.load()
        logger.info("gml_memory_engine_initialized", embedding_model=embedding_service.MODEL_NAME, available=embedding_service.available)

    async def ingest_session(self, db, user_id: str, session_id: str, transcript: str) -> dict:
        return await memory_summarizer.summarize_session_memories(db, user_id, session_id, transcript)

    async def recall(self, db, user_id: str, query: str, context: str = "", top_k: int = 5) -> dict:
        relevant_entities = await entity_store.search_entities(db, user_id, query, top_k=top_k)
        relevant_events = await event_store.search_events(db, user_id, query, top_k=top_k)
        relevant_relationships = []
        seen = set()
        for entity in relevant_entities[:3]:
            rels = await relationship_store.get_relationships_for_entity(db, user_id, entity["entity_id"], direction="both")
            for rel in rels:
                if rel["relationship_id"] not in seen:
                    relevant_relationships.append(rel)
                    seen.add(rel["relationship_id"])
        memory_context = await self._format_memory_context(db, user_id, relevant_entities, relevant_relationships, relevant_events)
        return {
            "relevant_entities": relevant_entities,
            "relevant_events": relevant_events,
            "relevant_relationships": relevant_relationships,
            "memory_context": memory_context,
            "total_matches": len(relevant_entities) + len(relevant_events),
        }

    async def _format_memory_context(self, db, user_id: str, entities: List[dict], relationships: List[dict], events: List[dict]) -> str:
        if not entities and not events:
            return ""
        lines = ["[MEMORY CONTEXT - what I remember about this user:]"]
        entity_name_map = {e["entity_id"]: e["name"] for e in entities}
        if entities:
            lines.append("Known entities:")
            for e in entities[:5]:
                line = f"  - {e['name']} ({e['type']})"
                if e.get("attributes"):
                    attrs = ", ".join(f"{k}={v}" for k, v in list(e["attributes"].items())[:3])
                    line += f": {attrs}"
                lines.append(line)
        if relationships:
            lines.append("Known relationships:")
            for r in relationships[:5]:
                subj_name = entity_name_map.get(r["subject_entity_id"], r["subject_entity_id"])
                obj_name = entity_name_map.get(r["object_entity_id"], r["object_entity_id"])
                if not entity_name_map.get(r["object_entity_id"]):
                    obj_entity = await entity_store.get_entity(db, user_id, r["object_entity_id"])
                    if obj_entity:
                        obj_name = obj_entity["name"]
                lines.append(f"  - {subj_name} {r['predicate']} {obj_name} (confidence: {r['confidence']:.1f})")
        if events:
            lines.append("Relevant past events:")
            from datetime import datetime

            for e in events[:3]:
                days_ago = (datetime.utcnow() - e["timestamp"]).days
                lines.append(f"  - {e['description']} ({'today' if days_ago == 0 else f'{days_ago} day(s) ago'})")
        lines.append("[END MEMORY CONTEXT]")
        return "\n".join(lines)

    async def answer_memory_query(self, db, user_id: str, question: str) -> dict:
        recall_result = await self.recall(db, user_id, question, top_k=10)
        if not recall_result["total_matches"]:
            return {"answer": "I don't have any memories related to that yet.", "confidence": 0.0, "supporting_memories": []}
        from models.ollama_service import ollama_service

        answer = await ollama_service.chat(
            f'''{recall_result["memory_context"]}\n\nBased on this memory context, answer:\n"{question}"\nBe specific and cite memory evidence.''',
            [],
            "You are a memory-aware AI assistant.",
        )
        return {
            "answer": answer,
            "confidence": min(1.0, recall_result["total_matches"] * 0.2),
            "supporting_memories": {
                "entities": [{"name": e["name"], "type": e["type"]} for e in recall_result["relevant_entities"][:3]],
                "events": [{"description": e["description"]} for e in recall_result["relevant_events"][:3]],
                "relationships": [{"predicate": r["predicate"], "strength": r["strength"]} for r in recall_result["relevant_relationships"][:3]],
            },
        }

    async def get_stats(self, db, user_id: str) -> dict:
        entity_count = await db["gml_entities"].count_documents({"user_id": user_id, "is_forgotten": False})
        forgotten_count = await db["gml_entities"].count_documents({"user_id": user_id, "is_forgotten": True})
        rel_count = await db["gml_relationships"].count_documents({"user_id": user_id, "is_forgotten": False})
        event_count = await db["gml_events"].count_documents({"user_id": user_id})
        type_breakdown = await db["gml_entities"].aggregate([{"$match": {"user_id": user_id, "is_forgotten": False}}, {"$group": {"_id": "$type", "count": {"$sum": 1}}}]).to_list(20)
        return {
            "active_entities": entity_count,
            "forgotten_entities": forgotten_count,
            "active_relationships": rel_count,
            "total_events": event_count,
            "entity_types": {item["_id"]: item["count"] for item in type_breakdown},
            "embedding_model": embedding_service.MODEL_NAME,
            "embedding_dimensions": embedding_service.DIMENSIONS,
        }


memory_engine = MemoryEngine()
