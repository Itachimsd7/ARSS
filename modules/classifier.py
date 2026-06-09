"""
classifier.py — STEP 5 of the AI Pipeline: Classify the candidate.
====================================================================

PURPOSE:
    Takes the final ATS score and education level and makes a decision:
    QUALIFIED, SHORTLIST, or REJECT.

    This is the last step in the pipeline. After this, pipeline_runner.py
    packages everything and returns it to Node.js.

CLASSIFICATION RULES (in priority order):
    1. Education mismatch → REJECT immediately (hard requirement)
    2. Score < 0.40       → REJECT (too low to be considered)
    3. Score 0.40–0.74    → SHORTLIST (decent match, needs human review)
    4. Score >= 0.75      → QUALIFIED (strong match, recommended)

WHY EDUCATION IS A HARD GATE:
    If the job requires B.Tech and the candidate has M.Sc, they are rejected
    regardless of their score. This is configurable via the job requirements
    in the admin dashboard (config/requirements.yaml or MongoDB config).

CALLED BY:
    pipeline_runner.py → classify_candidate(score, education, required_education)
"""


def classify_candidate(score, education, required_education):
    """
    Classify a candidate based on their ATS score and education.

    Args:
        score (float): Final ATS score from scorer.py (0.0 to 1.0)
        education (str): Education level extracted from the resume (e.g. "B.TECH")
        required_education (str): Education level required by the job (e.g. "btech")

    Returns:
        str: One of "QUALIFIED", "SHORTLIST", or "REJECT"

    Decision Logic:
        - Education mismatch (case-insensitive compare) → "REJECT"
        - score < 0.40  → "REJECT"
        - score < 0.75  → "SHORTLIST"
        - score >= 0.75 → "QUALIFIED"
    """
    # GATE 1: Check education requirement (case-insensitive comparison)
    # e.g. "B.TECH" vs "btech" — both stripped and lowercased before comparing
    if education.strip().lower() != required_education.strip().lower():
        return "REJECT"  # wrong education level — immediate rejection

    # GATE 2: Score too low — not enough skill/experience match
    if score < 0.4:
        return "REJECT"

    # GATE 3: Decent score but not outstanding — needs human review
    if score < 0.75:
        return "SHORTLIST"

    # GATE 4: Strong match — highly recommended candidate
    return "QUALIFIED"