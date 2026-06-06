"""
db.py — MongoDB operations for ARSS.

NOTE: Direct DB writes from Python are DISABLED.
All persistence is handled by the Node.js backend (server/routes/resumes.js)
to prevent duplicate entries. The pipeline_runner.py only returns JSON to stdout;
Node.js saves the result.

This module is kept for reference and potential future direct-Python use cases.
"""

from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["arss_db"]
candidates = db["candidates"]


def insert_candidate(data, score, result):
    """
    DEPRECATED — inserts are now handled by Node.js to prevent duplicates.
    Calling this directly will create duplicate records.
    Left here for reference only.
    """
    raise NotImplementedError(
        "Direct Python inserts are disabled. "
        "Use the Node.js API (POST /api/resumes/upload) instead."
    )


def find_by_email(email: str):
    """Find a candidate by email address."""
    return candidates.find_one({"email": email})


def find_by_hash(file_hash: str):
    """Find a candidate by file SHA-256 hash."""
    return candidates.find_one({"fileHash": file_hash})
