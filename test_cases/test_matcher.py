import database.db as db
import inspect

import os
import yaml

from modules.parser import extract_text
from modules.extractor import extract_info
from modules.matcher import compute_similarity
from modules.scorer import calculate_score
from modules.classifier import classify_candidate


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, "config", "requirements.yaml")
RESUMES_DIR = os.path.join(BASE_DIR, "data", "resumes")

with open(CONFIG_PATH, "r") as f:
    config = yaml.safe_load(f)

job_description = config["job_description"]
education = config["education"]

for filename in os.listdir(RESUMES_DIR):
    filepath = os.path.join(RESUMES_DIR, filename)
    
    resume_text = extract_text(filepath)
    
    info = extract_info(resume_text)
   
    similarity = compute_similarity(resume_text, job_description)
    
    score = calculate_score(similarity, info["experience"])
    
    result = classify_candidate(score, info["education"], education)
    db.insert_candidate(info, score, result)

    print(f"File       : {filename}")
    print(f"Similarity : {similarity}")
    print(f"Final Score: {score}")
    print(f"Result     : {result}")
    print("-" * 40)