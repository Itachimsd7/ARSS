"""
db.py — MongoDB connection and operations for ARSS (Python side).
==================================================================

IMPORTANT NOTE:
    Direct database writes from Python are DISABLED.
    All saving of candidate records is handled by the Node.js backend
    (server/routes/resumes.js and server/services/emailService.js).

WHY?
    The pipeline_runner.py script is spawned as a child process by Node.js.
    If Python also wrote to the database, the same candidate could be saved TWICE
    (once by Python, once by Node.js) — creating duplicate records.

    To prevent this, Python's insert function raises NotImplementedError.
    Python ONLY returns JSON to stdout. Node.js reads it and saves to DB.

WHAT THIS FILE IS USED FOR:
    - Reference/documentation of the MongoDB structure
    - The find_by_email and find_by_hash functions can be used for
      direct Python lookups if ever needed in future scripts or tests.
"""

from pymongo import MongoClient

# ── Database Connection ───────────────────────────────────────────────────────
# Connects to MongoDB running locally on the default port
# The database name is 'arss_db'
client = MongoClient("mongodb://localhost:27017/")
db = client["arss_db"]

# The 'candidates' collection stores all processed resume records
candidates = db["candidates"]


def insert_candidate(data, score, result):
    """
    DEPRECATED / DISABLED — Do NOT call this function.

    This function is intentionally broken to prevent accidental duplicate inserts.
    All candidate inserts are handled by Node.js (server/routes/resumes.js).

    If you call this, it raises NotImplementedError with an explanation.

    Previously (before Node.js backend was added), this was the way to save
    candidates from the test scripts. Kept here only for reference.
    """
    raise NotImplementedError(
        "Direct Python inserts are disabled. "
        "Use the Node.js API (POST /api/resumes/upload) instead."
    )


def find_by_email(email: str):
    """
    Find a candidate record by their email address.

    Searches the 'candidates' MongoDB collection for a document
    where the 'email' field matches the given email.

    Args:
        email (str): The candidate's email address to search for

    Returns:
        dict: The candidate MongoDB document if found, or None if not found

    Example:
        record = find_by_email("john@example.com")
        if record:
            print(record['name'], record['score'])
    """
    return candidates.find_one({"email": email})


def find_by_hash(file_hash: str):
    """
    Find a candidate record by the SHA-256 hash of their resume file.

    This is used for deduplication — if a candidate uploads the exact same
    resume file again, the hash will match and we return the existing record
    instead of processing and saving a duplicate.

    Args:
        file_hash (str): SHA-256 hex string of the resume file content

    Returns:
        dict: The candidate MongoDB document if found, or None if not found

    Example:
        hash_str = "a3f1d2c4..."
        existing = find_by_hash(hash_str)
        if existing:
            print("This resume was already submitted")
    """
    return candidates.find_one({"fileHash": file_hash})
