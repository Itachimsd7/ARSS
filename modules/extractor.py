"""
extractor.py — STEP 2 of the AI Pipeline: Extract structured data from resume text.
====================================================================================

PURPOSE:
    Takes the raw text string from parser.py and extracts specific structured fields:
    name, email, phone number, skills, education level, and years of experience.

    This converts an unstructured wall of text into a clean dictionary that the rest
    of the pipeline (matcher, scorer, classifier) can work with.

TECHNIQUES USED:
    - spaCy NLP (Named Entity Recognition): finds the candidate's name
    - Regular Expressions (regex): finds email, phone, and experience years
    - Keyword Matching: finds skills and education level from predefined lists

CALLED BY:
    pipeline_runner.py → extract_info(text)
"""

import re

# ── spaCy NLP Model Setup ─────────────────────────────────────────────────────
# spaCy is a Natural Language Processing library.
# 'en_core_web_sm' is a small pre-trained English language model.
# It's loaded ONCE here at module import time (not inside any function)
# because loading takes ~1 second — we don't want to reload it for every resume.
import spacy
nlp = spacy.load("en_core_web_sm")


# ── Predefined Skill Keywords ─────────────────────────────────────────────────
# These are the skills the extractor knows how to detect.
# If a resume contains any of these (case-insensitive), it will be detected.
# Admin can set different required skills in config, but detection uses this list.
SKILLS = [
    "python", "java", "c++", "sql",
    "machine learning", "deep learning",
    "nlp", "data analysis", "pandas",
    "tensorflow", "django", "flask"
]

# ── Education Level Keywords ──────────────────────────────────────────────────
# If any of these strings appear in the resume text, we capture the education level.
EDUCATION_KEYWORDS = ["b.tech", "b.e", "m.tech", "mca", "bsc", "msc", "phd", "b.sc", "m.sc"]


def extract_name(doc):
    """
    Extract the candidate's name using spaCy Named Entity Recognition (NER).

    HOW IT WORKS:
        spaCy's NER model reads the text and identifies "entities" — things like
        people, organizations, places, dates, etc.
        We look for the FIRST entity labeled as "PERSON" and return it as the name.

    LIMITATION:
        If the name is not recognized as a PERSON entity (e.g., very unusual names
        or poorly formatted resumes), this returns an empty string.

    Args:
        doc: A spaCy Doc object (already processed text)

    Returns:
        The first recognized person name, or empty string if not found
    """
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    return ""  # fallback if no person entity is found


def extract_email(text):
    """
    Extract email address using a regular expression.

    REGEX PATTERN EXPLAINED:
        [a-zA-Z0-9._%+\-]+   → one or more valid email username characters
        @                     → literal @ symbol
        [a-zA-Z0-9.\-]+       → domain name (e.g. gmail, yahoo)
        \.                    → literal dot
        [a-zA-Z]{2,}          → top-level domain (e.g. com, org, in)

    Example match: john.doe@gmail.com

    Args:
        text: Raw resume text string

    Returns:
        The first email address found, or empty string if none
    """
    pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    match = re.search(pattern, text)
    return match.group(0) if match else ""


def extract_phone(text):
    """
    Extract phone number using a regular expression.

    REGEX PATTERN EXPLAINED:
        (\+?\d{1,3}[\s\-]?)?  → optional country code (e.g. +91, +1)
        (\(?\d{3}\)?[\s\-]?)? → optional area code (e.g. 800, (800))
        \d{3}[\s\-]?\d{4}     → 7-digit number with optional separator

    Matches formats like: +91-800-555-1234, 800 555 1234, 8005551234

    Args:
        text: Raw resume text string

    Returns:
        The first phone number found (stripped), or empty string if none
    """
    pattern = r"(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?\d{3}[\s\-]?\d{4}"
    match = re.search(pattern, text)
    return match.group(0).strip() if match else ""


def extract_skills(text):
    """
    Extract skills by checking if predefined skill keywords appear in the resume text.

    HOW IT WORKS:
        - Converts the entire resume text to lowercase
        - Checks if each skill from the SKILLS list appears anywhere in the text
        - Returns all skills that were found

    This is simple substring matching — not AI-based.
    The advantage is speed and 100% predictability.

    Args:
        text: Raw resume text string

    Returns:
        List of skill strings that were found in the text
    """
    text_lower = text.lower()
    return [skill for skill in SKILLS if skill in text_lower]


def extract_education(text):
    """
    Detect the highest education level by looking for keyword matches.

    HOW IT WORKS:
        Checks if any education keyword (b.tech, m.sc, phd, etc.)
        appears in the resume text. Returns the FIRST match found.

    Note: Returns the keyword in UPPERCASE for consistency (e.g. "B.TECH").

    Args:
        text: Raw resume text string

    Returns:
        Education level string in uppercase, or empty string if not detected
    """
    text_lower = text.lower()
    for keyword in EDUCATION_KEYWORDS:
        if keyword in text_lower:
            return keyword.upper()  # e.g. "b.tech" → "B.TECH"
    return ""  # no education level detected


def extract_experience(text):
    """
    Extract years of work experience using a regular expression.

    REGEX PATTERN EXPLAINED:
        (\d+)                        → capture one or more digits (the number of years)
        \+?                          → optional plus sign (e.g. "5+" years)
        \s*                          → optional whitespace
        (?:years?|yrs?)              → matches "year", "years", "yr", "yrs"
        (?:\s+of)?\s+experience      → matches "of experience" or just "experience"

    Matches phrases like:
        "5 years of experience"
        "3+ years experience"
        "2 yrs experience"

    Args:
        text: Raw resume text string

    Returns:
        Number of years as an integer, or 0 if not found
    """
    pattern = r"(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return int(match.group(1))  # return the captured number
    return 0  # default to 0 years if no experience phrase found


def extract_info(text):
    """
    PUBLIC FUNCTION — Extract all structured fields from resume text.

    This is the main function called by pipeline_runner.py.
    It calls each individual extractor and bundles the results into a dictionary.

    HOW IT WORKS:
        1. Validates input (must be a non-empty string)
        2. Runs the text through spaCy's NLP pipeline to get a Doc object
        3. Calls each extractor with the text or doc object
        4. Returns a dictionary with all extracted fields

    Args:
        text: Raw text extracted from the resume file (from parser.py)

    Returns:
        Dictionary with keys:
            - name (str): Candidate's full name
            - email (str): Email address
            - phone (str): Phone number
            - skills (list): List of detected skill strings
            - education (str): Highest education level detected
            - experience (int): Years of work experience
    """
    # Guard clause: return empty defaults if input is invalid
    if not text or not isinstance(text, str):
        return {
            "name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "education": "",
            "experience": 0
        }

    # Process the text through spaCy NLP — this creates a Doc object with
    # tokens, named entities, part-of-speech tags, etc.
    doc = nlp(text)

    # Extract each field using its dedicated function
    return {
        "name":       extract_name(doc),        # uses spaCy NER
        "email":      extract_email(text),       # uses regex
        "phone":      extract_phone(text),       # uses regex
        "skills":     extract_skills(text),      # uses keyword matching
        "education":  extract_education(text),   # uses keyword matching
        "experience": extract_experience(text)   # uses regex
    }


# ── Quick smoke test ──────────────────────────────────────────────────────────
# Run this file directly to test extraction on sample text:
#   python modules/extractor.py
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