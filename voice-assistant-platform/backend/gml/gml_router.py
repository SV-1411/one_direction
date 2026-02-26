from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from database.mongo import get_database
from middleware.auth_middleware import get_current_user

from .entity_store import entity_store
from .event_store import event_store
from .memory_decay import memory_decay
from .memory_engine import memory_engine
from .relationship_store import relationship_store

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/gml", tags=["GML Memory"])


class RecallRequest(BaseModel):
    query: str
    top_k: int = 5


class MemoryQueryRequest(BaseModel):
    question: str


class CreateEntityRequest(BaseModel):
    name: str
    entity_type: str = "concept"
    attributes: dict = {}


class CreateRelationshipRequest(BaseModel):
    subject_entity_id: str
    predicate: str
    object_entity_id: str
    confidence: float = 0.9


class TextAnalyzeRequest(BaseModel):
    text: str
    session_id: str = "manual"


@router.get("/stats")
async def get_memory_stats(current_user=Depends(get_current_user), db=Depends(get_database)):
    return await memory_engine.get_stats(db, str(current_user["_id"]))


@router.post("/recall")
async def recall_memories(body: RecallRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await memory_engine.recall(db, str(current_user["_id"]), body.query, top_k=body.top_k)


@router.post("/query")
async def answer_memory_question(body: MemoryQueryRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    return await memory_engine.answer_memory_query(db, str(current_user["_id"]), body.question)


@router.post("/ingest")
async def ingest_text(body: TextAnalyzeRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    result = await memory_engine.ingest_session(db, str(current_user["_id"]), body.session_id, body.text)
    return {
        "ingested": True,
        "entities_created": len(result.get("entities", [])),
        "relationships_created": len(result.get("relationships", [])),
        "events_created": len(result.get("events", [])),
        "details": result,
    }


@router.get("/entities")
async def list_entities(entity_type: Optional[str] = None, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200), current_user=Depends(get_current_user), db=Depends(get_database)):
    entities = await entity_store.list_entities(db, str(current_user["_id"]), entity_type=entity_type, skip=skip, limit=limit)
    for e in entities:
        e.pop("embedding", None)
        if "_id" in e:
            e["_id"] = str(e["_id"])
    return {"entities": entities, "count": len(entities)}


@router.get("/entities/search")
async def search_entities(q: str = Query(..., min_length=1), current_user=Depends(get_current_user), db=Depends(get_database)):
    results = await entity_store.search_entities(db, str(current_user["_id"]), q, top_k=10)
    for e in results:
        e.pop("embedding", None)
        if "_id" in e:
            e["_id"] = str(e["_id"])
    return {"results": results, "query": q}


@router.get("/entities/{entity_id}")
async def get_entity(entity_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    entity = await entity_store.get_entity(db, str(current_user["_id"]), entity_id)
    if not entity:
        raise HTTPException(404, "Entity not found")
    entity.pop("embedding", None)
    entity["_id"] = str(entity.get("_id", ""))
    relationships = await relationship_store.get_relationships_for_entity(db, str(current_user["_id"]), entity_id)
    for r in relationships:
        r["_id"] = str(r.get("_id", ""))
    events = await event_store.get_events_for_entity(db, str(current_user["_id"]), entity_id)
    for e in events:
        e.pop("embedding", None)
        e["_id"] = str(e.get("_id", ""))
    return {"entity": entity, "relationships": relationships, "events": events}


@router.post("/entities")
async def create_entity(body: CreateEntityRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    entity, was_created = await entity_store.get_or_create_entity(db, str(current_user["_id"]), body.name, entity_type=body.entity_type)
    entity.pop("embedding", None)
    entity["_id"] = str(entity.get("_id", ""))
    return {"entity": entity, "was_created": was_created}


@router.delete("/entities/{entity_id}")
async def forget_entity(entity_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    success = await entity_store.forget_entity(db, str(current_user["_id"]), entity_id)
    if not success:
        raise HTTPException(404, "Entity not found or already forgotten")
    return {"forgotten": True, "entity_id": entity_id}


@router.get("/relationships")
async def get_relationships(entity_id: Optional[str] = None, predicate: Optional[str] = None, current_user=Depends(get_current_user), db=Depends(get_database)):
    if entity_id:
        rels = await relationship_store.get_relationships_for_entity(db, str(current_user["_id"]), entity_id)
    else:
        rels = await relationship_store.query_relationships(db, str(current_user["_id"]), predicate=predicate)
    for r in rels:
        r["_id"] = str(r.get("_id", ""))
    return {"relationships": rels, "count": len(rels)}


@router.get("/graph")
async def get_memory_graph(current_user=Depends(get_current_user), db=Depends(get_database)):
    return await relationship_store.get_graph_data(db, str(current_user["_id"]))


@router.post("/relationships")
async def create_relationship(body: CreateRelationshipRequest, current_user=Depends(get_current_user), db=Depends(get_database)):
    rel = await relationship_store.create_relationship(db, str(current_user["_id"]), body.subject_entity_id, body.predicate, body.object_entity_id, body.confidence)
    rel["_id"] = str(rel.get("_id", ""))
    return {"relationship": rel}


@router.delete("/relationships/{relationship_id}")
async def forget_relationship(relationship_id: str, current_user=Depends(get_current_user), db=Depends(get_database)):
    success = await relationship_store.forget_relationship(db, str(current_user["_id"]), relationship_id)
    return {"forgotten": success}


@router.get("/events")
async def get_event_timeline(limit: int = Query(50, ge=1, le=200), current_user=Depends(get_current_user), db=Depends(get_database)):
    events = await event_store.get_timeline(db, str(current_user["_id"]), limit=limit)
    for e in events:
        e.pop("embedding", None)
        e["_id"] = str(e.get("_id", ""))
    return {"events": events}


@router.get("/events/search")
async def search_events(q: str = Query(...), since_days: Optional[int] = None, current_user=Depends(get_current_user), db=Depends(get_database)):
    results = await event_store.search_events(db, str(current_user["_id"]), q, since_days=since_days)
    for e in results:
        e.pop("embedding", None)
        e["_id"] = str(e.get("_id", ""))
    return {"results": results, "query": q}


@router.post("/decay/run")
async def run_decay(current_user=Depends(get_current_user), db=Depends(get_database)):
    return await memory_decay.run_decay_cycle(db)


@router.delete("/memory/reset")
async def reset_all_memories(current_user=Depends(get_current_user), db=Depends(get_database)):
    user_id = str(current_user["_id"])
    await db["gml_entities"].delete_many({"user_id": user_id})
    await db["gml_relationships"].delete_many({"user_id": user_id})
    await db["gml_events"].delete_many({"user_id": user_id})
    await db["gml_memory_snapshots"].delete_many({"user_id": user_id})
    return {"reset": True, "user_id": user_id}


@router.get("/snapshots")
async def get_snapshots(current_user=Depends(get_current_user), db=Depends(get_database)):
    snapshots = await db["gml_memory_snapshots"].find({"user_id": str(current_user["_id"])}).sort("snapshot_date", -1).limit(10).to_list(10)
    for s in snapshots:
        s["_id"] = str(s.get("_id", ""))
    return {"snapshots": snapshots}
