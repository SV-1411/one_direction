from datetime import datetime, timedelta

import structlog

logger = structlog.get_logger(__name__)


class MemorySummarizer:
    async def summarize_session_memories(self, db, user_id: str, session_id: str, transcript: str) -> dict:
        from .entity_store import entity_store
        from .event_store import event_store
        from .relationship_store import relationship_store
        from models.ollama_service import ollama_service

        if not transcript or len(transcript.strip()) < 10:
            return {"entities": [], "relationships": [], "events": []}

        extraction_prompt = f'''Analyze this conversation transcript and extract memory elements.\n\nTranscript: "{transcript}"\n\nExtract and return ONLY a JSON object with this exact structure:\n{{\n  "entities": [{{"name": "entity name", "type": "person|place|concept|object|organization", "context": "brief context"}}],\n  "relationships": [{{"subject": "entity name", "predicate": "relationship verb", "object": "entity name", "confidence": 0.0-1.0}}],\n  "events": [{{"description": "what happened", "participants": ["entity names"]}}]\n}}\n\nReturn valid JSON only, no explanation.'''

        try:
            response_text = await ollama_service.chat(extraction_prompt, [], "You are a memory extraction AI. Return only valid JSON.")
            import json
            import re

            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if not json_match:
                return {"entities": [], "relationships": [], "events": []}
            extracted = json.loads(json_match.group())

            created_entities = {}
            created_relationships = []
            created_events = []

            for ent_data in extracted.get("entities", []):
                entity, _ = await entity_store.get_or_create_entity(db=db, user_id=user_id, reference_text=ent_data["name"], context=ent_data.get("context", ""), entity_type=ent_data.get("type", "concept"))
                created_entities[ent_data["name"].lower()] = entity

            for rel_data in extracted.get("relationships", []):
                subj_name = rel_data.get("subject", "").lower()
                obj_name = rel_data.get("object", "").lower()
                subj_entity = created_entities.get(subj_name) or await entity_store.resolve_entity(db, user_id, subj_name)
                obj_entity = created_entities.get(obj_name) or await entity_store.resolve_entity(db, user_id, obj_name)
                if subj_entity and obj_entity:
                    rel = await relationship_store.create_relationship(db=db, user_id=user_id, subject_entity_id=subj_entity["entity_id"], predicate=rel_data.get("predicate", "related_to"), object_entity_id=obj_entity["entity_id"], confidence=rel_data.get("confidence", 0.8), evidence_session_id=session_id)
                    created_relationships.append(rel)

            for evt_data in extracted.get("events", []):
                participant_ids = []
                for p_name in evt_data.get("participants", []):
                    entity = created_entities.get(p_name.lower())
                    if entity:
                        participant_ids.append(entity["entity_id"])
                event = await event_store.record_event(db=db, user_id=user_id, session_id=session_id, description=evt_data["description"], participants=participant_ids, entities_mentioned=[e["entity_id"] for e in created_entities.values()], source_transcript=transcript[:300])
                created_events.append(event)

            return {"entities": list(created_entities.values()), "relationships": created_relationships, "events": created_events}
        except Exception as e:
            logger.error("memory_extraction_failed", error=str(e), session_id=session_id)
            return {"entities": [], "relationships": [], "events": []}

    async def create_weekly_snapshot(self, db, user_id: str) -> dict:
        from models.ollama_service import ollama_service

        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_events = await db["gml_events"].find({"user_id": user_id, "timestamp": {"$gte": week_ago}}).sort("timestamp", 1).to_list(length=100)
        if not recent_events:
            return {}
        events_text = "\n".join(f"- {e['description']}" for e in recent_events[:30])
        summary_text = await ollama_service.chat(f"Summarize these memory events into 2-3 concise sentences:\n{events_text}", [], "You are a memory summarizer. Be concise.")
        entity_count = await db["gml_entities"].count_documents({"user_id": user_id, "is_forgotten": False})
        rel_count = await db["gml_relationships"].count_documents({"user_id": user_id, "is_forgotten": False})
        snapshot = {"user_id": user_id, "snapshot_date": datetime.utcnow(), "summary": summary_text, "entity_count": entity_count, "relationship_count": rel_count, "events_summarized": len(recent_events)}
        await db["gml_memory_snapshots"].insert_one(snapshot)
        return snapshot


memory_summarizer = MemorySummarizer()
