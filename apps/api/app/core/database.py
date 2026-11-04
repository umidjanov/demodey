import asyncio
import logging
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("quizora.database")


import json
from datetime import datetime
from pathlib import Path

class MongoEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return {"__oid__": str(obj)}
        if isinstance(obj, datetime):
            return {"__date__": obj.isoformat()}
        return super().default(obj)

def mongo_decoder(d):
    if "__oid__" in d:
        return ObjectId(d["__oid__"])
    if "__date__" in d:
        return datetime.fromisoformat(d["__date__"])
    return d


class AsyncMemoryCollection:
    """
    High-fidelity asynchronous in-memory MongoDB collection mock
    with automatic JSON disk persistence for seamless zero-dependency operation.
    """
    def __init__(self, name: str, db: Optional["AsyncMemoryDatabase"] = None):
        self.name = name
        self.db = db
        self._data: Dict[str, Dict[str, Any]] = {}

    def _notify_change(self):
        if self.db:
            self.db.save_to_disk()

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or":
                if not any(self._matches(doc, subq) for subq in v):
                    return False
                continue
            if k == "$and":
                if not all(self._matches(doc, subq) for subq in v):
                    return False
                continue

            doc_val = doc.get(k)

            if isinstance(v, dict):
                for op, op_val in v.items():
                    if op == "$in":
                        if doc_val not in op_val and str(doc_val) not in [str(x) for x in op_val]:
                            return False
                    elif op == "$nin":
                        if doc_val in op_val or str(doc_val) in [str(x) for x in op_val]:
                            return False
                    elif op == "$eq":
                        if str(doc_val) != str(op_val):
                            return False
                    elif op == "$ne":
                        if str(doc_val) == str(op_val):
                            return False
                    elif op == "$gt":
                        if doc_val is None or doc_val <= op_val:
                            return False
                    elif op == "$gte":
                        if doc_val is None or doc_val < op_val:
                            return False
                    elif op == "$lt":
                        if doc_val is None or doc_val >= op_val:
                            return False
                    elif op == "$lte":
                        if doc_val is None or doc_val > op_val:
                            return False
                    elif op == "$regex":
                        import re
                        flags = re.IGNORECASE if v.get("$options") == "i" else 0
                        if not doc_val or not re.search(op_val, str(doc_val), flags):
                            return False
            else:
                if str(doc_val) != str(v):
                    return False
        return True

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = ObjectId()
        doc_id = str(doc_copy["_id"])
        self._data[doc_id] = doc_copy
        self._notify_change()
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def insert_many(self, docs: List[Dict[str, Any]]):
        ids = []
        for d in docs:
            doc_copy = dict(d)
            if "_id" not in doc_copy:
                doc_copy["_id"] = ObjectId()
            doc_id = str(doc_copy["_id"])
            self._data[doc_id] = doc_copy
            ids.append(doc_copy["_id"])
        self._notify_change()
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult(ids)

    async def find_one(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        for doc in self._data.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        query = query or {}
        matched = [dict(d) for d in self._data.values() if self._matches(d, query)]
        return AsyncCursor(matched)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        existing = await self.find_one(query)
        if not existing:
            if upsert:
                new_doc = dict(query)
                if "$set" in update:
                    new_doc.update(update["$set"])
                res = await self.insert_one(new_doc)
                class UpsertResult:
                    matched_count = 0
                    modified_count = 1
                    upserted_id = res.inserted_id
                return UpsertResult()
            class NoopResult:
                matched_count = 0
                modified_count = 0
                upserted_id = None
            return NoopResult()

        doc_id = str(existing["_id"])
        target = self._data[doc_id]

        if "$set" in update:
            target.update(update["$set"])
        if "$inc" in update:
            for k, inc_val in update["$inc"].items():
                target[k] = target.get(k, 0) + inc_val
        if "$push" in update:
            for k, push_val in update["$push"].items():
                if k not in target or not isinstance(target[k], list):
                    target[k] = []
                target[k].append(push_val)
        if "$unset" in update:
            for k in update["$unset"]:
                target.pop(k, None)

        self._notify_change()
        class UpdateResult:
            matched_count = 1
            modified_count = 1
            upserted_id = None
        return UpdateResult()

    async def update_many(self, query: Dict[str, Any], update: Dict[str, Any]):
        count = 0
        for doc_id, doc in list(self._data.items()):
            if self._matches(doc, query):
                target = self._data[doc_id]
                if "$set" in update:
                    target.update(update["$set"])
                if "$inc" in update:
                    for k, inc_val in update["$inc"].items():
                        target[k] = target.get(k, 0) + inc_val
                count += 1
        if count > 0:
            self._notify_change()
        class UpdateManyResult:
            matched_count = count
            modified_count = count
        return UpdateManyResult()

    async def delete_one(self, query: Dict[str, Any]):
        for doc_id, doc in list(self._data.items()):
            if self._matches(doc, query):
                del self._data[doc_id]
                self._notify_change()
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResultZero:
            deleted_count = 0
        return DeleteResultZero()

    async def delete_many(self, query: Dict[str, Any]):
        count = 0
        for doc_id, doc in list(self._data.items()):
            if self._matches(doc, query):
                del self._data[doc_id]
                count += 1
        if count > 0:
            self._notify_change()
        class DeleteManyResult:
            deleted_count = count
        return DeleteManyResult()

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        count = 0
        for doc in self._data.values():
            if self._matches(doc, query):
                count += 1
        return count

    async def create_index(self, keys: Any, **kwargs):
        return "index_ok"

    def aggregate(self, pipeline: List[Dict[str, Any]]):
        data = [dict(d) for d in self._data.values()]
        for stage in pipeline:
            if "$match" in stage:
                data = [d for d in data if self._matches(d, stage["$match"])]
            elif "$sort" in stage:
                sort_keys = list(stage["$sort"].items())
                for k, direction in reversed(sort_keys):
                    data.sort(key=lambda x: x.get(k, 0) or 0, reverse=(direction == -1))
            elif "$skip" in stage:
                data = data[stage["$skip"]:]
            elif "$limit" in stage:
                data = data[:stage["$limit"]]
        return AsyncCursor(data)


class AsyncCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self._items = items
        self._idx = 0

    def sort(self, key_or_list: Any, direction: int = 1):
        if isinstance(key_or_list, str):
            self._items.sort(key=lambda x: x.get(key_or_list, 0) or 0, reverse=(direction == -1))
        elif isinstance(key_or_list, list):
            for k, dir_val in reversed(key_or_list):
                self._items.sort(key=lambda x: x.get(k, 0) or 0, reverse=(dir_val == -1))
        return self

    def skip(self, n: int):
        self._items = self._items[n:]
        return self

    def limit(self, n: int):
        self._items = self._items[:n]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return self._items[:length]
        return self._items

    def __aiter__(self):
        self._idx = 0
        return self

    async def __anext__(self):
        if self._idx < len(self._items):
            item = self._items[self._idx]
            self._idx += 1
            return item
        raise StopAsyncIteration


class AsyncMemoryDatabase:
    def __init__(self, name: str):
        self.name = name
        self._collections: Dict[str, AsyncMemoryCollection] = {}
        self._store_file = Path(__file__).resolve().parent.parent.parent / "quizora_store.json"
        self._load_from_disk()

    def _load_from_disk(self):
        if self._store_file.exists():
            try:
                with open(self._store_file, "r", encoding="utf-8") as f:
                    raw_data = json.load(f, object_hook=mongo_decoder)
                for col_name, col_data in raw_data.items():
                    col = self[col_name]
                    col._data = col_data
                logger.info(f"Loaded persistent data store with {len(self._collections)} collections from {self._store_file}")
            except Exception as e:
                logger.warning(f"Could not load persistent data store: {e}")

    def save_to_disk(self):
        try:
            dump_data = {}
            for col_name, col in self._collections.items():
                dump_data[col_name] = col._data
            tmp_file = self._store_file.with_suffix(".tmp")
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(dump_data, f, cls=MongoEncoder)
            tmp_file.replace(self._store_file)
        except Exception as e:
            logger.warning(f"Could not save persistent data store: {e}")

    def __getitem__(self, name: str) -> AsyncMemoryCollection:
        if name not in self._collections:
            self._collections[name] = AsyncMemoryCollection(name, db=self)
        return self._collections[name]

    def __getattr__(self, name: str) -> AsyncMemoryCollection:
        return self[name]


class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_fallback: bool = False

    async def connect(self):
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500
            )
            # Ping database
            await self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_fallback = False
            logger.info(f"Connected successfully to live MongoDB: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            logger.warning(
                f"Could not connect to external MongoDB ({e}). "
                "Enabling high-fidelity in-memory AsyncMongoDB engine for seamless development mode."
            )
            self.db = AsyncMemoryDatabase(settings.MONGODB_DB_NAME)
            self.is_fallback = True

    async def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB client disconnected.")

    def get_collection(self, name: str):
        return self.db[name]


db_manager = DatabaseManager()


def get_db():
    return db_manager.db
