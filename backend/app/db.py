import os

_client = None


def get_db():
    """MongoDB Atlas si existe MONGODB_URI; si no, base en memoria (mongomock) para desarrollo/pruebas."""
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI")
        if uri:
            from pymongo import MongoClient

            _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        else:
            import mongomock

            _client = mongomock.MongoClient()
    return _client[os.environ.get("MONGODB_DB", "focustracker")]
