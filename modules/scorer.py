"""
scorer.py — STEP 4 of the AI Pipeline: Calculate the final ATS score.
=======================================================================

PURPOSE:
    Combines the similarity score (how well the resume matches the job description)
    and the candidate's years of experience into one final score between 0.0 and 1.0.

FORMULA:
    score = (0.7 × similarity) + (0.3 × normalized_experience)

    Where:
        - similarity: float 0.0–1.0 from matcher.py (TF-IDF cosine similarity)
        - normalized_experience: experience years capped at 5, divided by 5
          so 5+ years = 1.0, 2.5 years = 0.5, 0 years = 0.0

WEIGHTS EXPLAINED:
    - 70% similarity: The resume's keyword match to the job description is the
      most important factor. A resume with all the right skills and keywords scores high.
    - 30% experience: Experience matters but shouldn't override skill relevance.
      Capped at 5 years so a 10-year veteran doesn't score double a 5-year veteran.

EXAMPLE:
    similarity = 0.80, experience = 3 years
    normalized_experience = min(3/5, 1.0) = 0.60
    score = (0.7 × 0.80) + (0.3 × 0.60) = 0.56 + 0.18 = 0.74

CALLED BY:
    pipeline_runner.py → calculate_score(similarity, experience)
"""


def calculate_score(similarity, experience):
    """
    Calculate the final ATS score from similarity and experience.

    Args:
        similarity (float): TF-IDF cosine similarity score (0.0 to 1.0)
        experience (int/float): Years of work experience from the resume

    Returns:
        float: Final score between 0.0 and 1.0, rounded to 4 decimal places.
               This score is then used by classifier.py to determine QUALIFIED/SHORTLIST/REJECT.
    """
    # Normalize experience: cap at 5 years max (so 5 years = 1.0, 3 years = 0.6, etc.)
    normalized_experience = min(experience / 5, 1.0)

    # Weighted combination: similarity is more important (70%) than experience (30%)
    score = (0.7 * similarity) + (0.3 * normalized_experience)

    return round(float(score), 4)  # e.g. 0.7450