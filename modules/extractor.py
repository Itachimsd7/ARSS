import re
# TOP OF extractor.py — outside any function
import spacy
nlp = spacy.load("en_core_web_sm")  # loaded ONCE when module is first imported

def extract_info(text):
    doc = nlp(text)  # reuse the already-loaded model
    ...

# Predefined skill list
SKILLS = [
    "python", "java", "c++", "sql",
    "machine learning", "deep learning",
    "nlp", "data analysis", "pandas",
    "tensorflow", "django", "flask"
]

# Education keywords
EDUCATION_KEYWORDS = ["b.tech", "b.e", "m.tech", "mca", "bsc", "msc", "phd", "b.sc", "m.sc"]


def extract_name(doc):
    """Extract first PERSON entity from spaCy NER."""
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    return ""


def extract_email(text):
    """Extract email using regex."""
    pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    match = re.search(pattern, text)
    return match.group(0) if match else ""


def extract_phone(text):
    """Extract phone number using regex."""
    pattern = r"(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?\d{3}[\s\-]?\d{4}"
    match = re.search(pattern, text)
    return match.group(0).strip() if match else ""


def extract_skills(text):
    """Match skills from predefined list (case-insensitive)."""
    text_lower = text.lower()
    return [skill for skill in SKILLS if skill in text_lower]


def extract_education(text):
    """Detect education level from keywords."""
    text_lower = text.lower()
    for keyword in EDUCATION_KEYWORDS:
        if keyword in text_lower:
            return keyword.upper()
    return ""


def extract_experience(text):
    """Extract years of experience using regex."""
    pattern = r"(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 0


def extract_info(text):
    """
    Extract structured info from resume/bio text.

    Args:
        text (str): Raw input text.

    Returns:
        dict: Extracted fields.
    """
    if not text or not isinstance(text, str):
        return {
            "name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "education": "",
            "experience": 0
        }

    doc = nlp(text)

    return {
        "name": extract_name(doc),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
        "education": extract_education(text),
        "experience": extract_experience(text)
    }


# ── Quick smoke test ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = """
    John Doe
    Email: john.doe@example.com | Phone: +1-800-555-1234
    B.Tech in Computer Science, XYZ University
    5 years of experience in software development.
    Skills: Python, SQL, Machine Learning, TensorFlow, Django
    """

    result = extract_info(sample)
    for key, val in result.items():
        print(f"{key}: {val}")