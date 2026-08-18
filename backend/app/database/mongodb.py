import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from app.utils.config import settings

logger = logging.getLogger("app.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected = False

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        # Verify connection
        await db_instance.client.admin.command('ping')
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        db_instance.is_connected = True
        logger.info(f"Connected to MongoDB database '{settings.DATABASE_NAME}' successfully!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.warning("Running in-memory/mock fallback mode for MongoDB persistence.")
        db_instance.is_connected = False
        db_instance.db = MockDatabase()

async def close_mongo_connection():
    if db_instance.client and db_instance.is_connected:
        db_instance.client.close()
        logger.info("Closed MongoDB connection.")

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = {}

    async def find_one(self, filter, projection=None):
        for item in self.data.values():
            if all(item.get(k) == v for k, v in filter.items()):
                return item
        return None

    def find(self, filter=None, projection=None):
        class MockCursor:
            def __init__(self, items):
                self.items = items
            def sort(self, *args, **kwargs):
                return self
            def limit(self, *args, **kwargs):
                return self
            async def to_list(self, length=None):
                return self.items

        filter = filter or {}
        results = []
        for item in self.data.values():
            if all(item.get(k) == v for k, v in filter.items()):
                results.append(item)
        return MockCursor(results)

    async def count_documents(self, filter):
        count = 0
        for item in self.data.values():
            if all(item.get(k) == v for k, v in filter.items()):
                count += 1
        return count

    async def insert_one(self, document):
        doc_id = document.get("id") or document.get("_id") or f"mock_{len(self.data)}"
        document["_id"] = doc_id
        if "id" not in document:
            document["id"] = doc_id
        self.data[doc_id] = document
        return document

    async def insert_many(self, documents):
        inserted_ids = []
        for document in documents:
            doc_id = document.get("id") or document.get("_id") or f"mock_{len(self.data)}"
            document["_id"] = doc_id
            if "id" not in document:
                document["id"] = doc_id
            self.data[doc_id] = document
            inserted_ids.append(doc_id)
        return inserted_ids

    async def update_one(self, filter, update, upsert=False):
        # Extremely basic mock update
        doc = await self.find_one(filter)
        if not doc and upsert:
            doc = filter.copy()
            await self.insert_one(doc)
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
            return doc
        return None

    async def delete_one(self, filter):
        doc = await self.find_one(filter)
        if doc:
            doc_id = doc.get("_id")
            if doc_id in self.data:
                del self.data[doc_id]
                return True
        return False

    async def delete_many(self, filter):
        keys_to_del = []
        for k, v in self.data.items():
            if all(v.get(fk) == fv for fk, fv in filter.items()):
                keys_to_del.append(k)
        for k in keys_to_del:
            del self.data[k]
        return len(keys_to_del)

class MockDatabase:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]
