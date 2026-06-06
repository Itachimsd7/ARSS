"""
pipeline_runner.py
Invoked by Node.js to run the full ARSS Python pipeline on a resume file.
Outputs a single JSON object to stdout.
"""

import sys
import json
import argparse
import yaml
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.parser import extract_text
from modules.extractor import extract_info
from modules.matcher import compute_similarity
from modules.scorer import calculate_score
from modules.classifier import classify_candidate


def load_config(config_arg: str) -> dict:
    """Load config from JSON string arg or fall back to requirements.yaml."""
    if config_arg:
        try:
            return json.loads(config_arg)
        except json.JSONDecodeError:
            pass

    yaml_path = Path(__file__).parent / "config" / "requirements.yaml"
    if yaml_path.exists():
        with open(yaml_path, "r") as f:
            return yaml.safe_load(f)

    return {
        "job_description": "Python developer with machine learning and SQL experience.",
        "skills": ["python", "machine learning", "sql", "nlp"],
        "min_experience": 1,
        "education": "btech",
    }


def build_suggestions(data: dict, missing_skills: list, score: float) -> list:
    suggestions = []
    if missing_skills:
        suggestions.append(
            f"Consider adding these missing skills: {', '.join(missing_skills)}."
        )
    if data.get("experience", 0) < 2:
        suggestions.append("Highlight more work experience or internships.")
    if score < 0.6:
        suggestions.append(
            "Tailor your resume keywords to better match the job description."
        )
    if not data.get("email"):
        suggestions.append("Add a professional email address to your resume.")
    suggestions.append("Quantify achievements with numbers and metrics.")
    return suggestions


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True, help="Path to resume file")
    parser.add_argument("--config", default="", help="JSON config string")
    args = parser.parse_args()

    config = load_config(args.config)

    # 1. Parse file → text
    try:
        text = extract_text(args.file)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    # 2. Extract structured info
    data = extract_info(text)

    # 3. Compute similarity
    job_desc = config.get("job_description", "")
    similarity = compute_similarity(text, job_desc) if job_desc else 0.0

    # 4. Score
    score = calculate_score(similarity, data.get("experience", 0))

    # 5. Classify
    required_edu = config.get("education", "")
    result = classify_candidate(score, data.get("education", ""), required_edu)

    # 6. Missing skills
    required_skills = [s.lower() for s in config.get("skills", [])]
    found_skills = [s.lower() for s in data.get("skills", [])]
    missing_skills = [s for s in required_skills if s not in found_skills]

    # 7. Strengths / weaknesses
    strengths = [f"Proficient in {s}" for s in data.get("skills", [])]
    weaknesses = [f"Missing skill: {s}" for s in missing_skills]
    if data.get("experience", 0) < 2:
        weaknesses.append("Limited work experience")

    output = {
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "skills": data.get("skills", []),
        "education": data.get("education", ""),
        "experience": data.get("experience", 0),
        "similarity": round(similarity, 4),
        "score": round(score, 4),
        "result": result,
        "missingSkills": missing_skills,
        "suggestions": build_suggestions(data, missing_skills, score),
        "strengths": strengths,
        "weaknesses": weaknesses,
    }

    print(json.dumps(output))


if __name__ == "__main__":
    main()
