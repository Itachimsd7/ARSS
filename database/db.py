
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["arss_db"]
candidates = db["candidates"]


def insert_candidate(data, score, result):
    print("INSERT FUNCTION CALLED")
    document = {
        "name":       data.get("name", ""),
        "email":      data.get("email", ""),
        "phone":      data.get("phone", ""),
        "skills":     data.get("skills", []),
        "education":  data.get("education", ""),
        "experience": data.get("experience", 0),
        "score":      score,
        "result":     result,
    }
    candidates.insert_one(document)