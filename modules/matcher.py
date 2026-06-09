"""
matcher.py — STEP 3 of the AI Pipeline: Compute similarity between resume and job description.
==============================================================================================

PURPOSE:
    Determines how closely a resume matches the job description using
    TF-IDF (Term Frequency-Inverse Document Frequency) and Cosine Similarity.

HOW TF-IDF WORKS:
    - TF (Term Frequency): How often a word appears in a document.
    - IDF (Inverse Document Frequency): How rare the word is across all documents.
    - Words that appear often in the resume but are rare overall (like "tensorflow")
      get high TF-IDF scores — these are the "important" words.
    - Common words like "the", "and", "is" get low scores — they are ignored.

HOW COSINE SIMILARITY WORKS:
    - Both texts are converted into numeric vectors (one number per unique word).
    - Cosine similarity measures the angle between these two vectors.
    - Score of 1.0 = identical content. Score of 0.0 = completely different.
    - A resume that uses many of the same keywords as the job description
      will have a high cosine similarity score.

PERFORMANCE OPTIMIZATION:
    - The job description vector is cached (_job_vector).
    - If the same job description is used multiple times (e.g., processing 100 resumes),
      we only vectorize the job description ONCE and reuse it.
    - The cache is invalidated when the job description changes.

CALLED BY:
    pipeline_runner.py → compute_similarity(resume_text, job_description)
"""

from sklearn.feature_extraction.text import TfidfVectorizer  # converts text to TF-IDF vectors
from sklearn.metrics.pairwise import cosine_similarity        # computes angle between vectors

# ── Module-level cache variables ──────────────────────────────────────────────
# These persist between calls within the same Python process (not across restarts).
_vectorizer   = TfidfVectorizer()  # the TF-IDF vectorizer instance, reused across calls
_job_vector   = None               # cached TF-IDF vector for the current job description
_last_job_desc = None              # the job description that produced _job_vector


def compute_similarity(resume_text, job_description):
    """
    Compute how similar a resume is to a job description.

    Uses TF-IDF vectorization + cosine similarity to produce a score
    between 0.0 (no match) and 1.0 (perfect match).

    PROCESS:
        1. Check if the job description has changed since last call.
           If yes, re-fit the vectorizer with both texts and cache the job vector.
           If no, just transform the new resume with the existing vectorizer.
        2. Compute cosine similarity between the job vector and resume vector.

    Args:
        resume_text (str): Full text extracted from the resume (from parser.py)
        job_description (str): The job description from the config

    Returns:
        float: Similarity score rounded to 4 decimal places (e.g. 0.7231)
               Returns 0.0 if either input is empty.
    """
    global _job_vector, _last_job_desc  # we modify these module-level variables

    # Edge case: if either text is empty/None, similarity is 0
    if not resume_text or not job_description:
        return 0.0

    # ── Cache check: did the job description change? ───────────────────────────
    if job_description != _last_job_desc:
        # Job description is new or changed — invalidate the cached vector
        _last_job_desc = job_description
        _job_vector = None  # force re-fit on next step

    if _job_vector is None:
        # First time with this job description:
        # Fit the vectorizer on BOTH texts together so the vocabulary
        # includes words from both the job description AND the resume.
        # Then transform both into TF-IDF vectors.
        combined = _vectorizer.fit_transform([job_description, resume_text])
        _job_vector = combined[0]    # cache the job description vector for reuse
        resume_vector = combined[1]  # the resume's vector
    else:
        # Same job description as before — just transform the new resume
        # using the already-fitted vectorizer (faster, no re-fitting)
        resume_vector = _vectorizer.transform([resume_text])[0]

    # ── Compute cosine similarity between the two vectors ─────────────────────
    # cosine_similarity returns a 2D array — we extract the single value [0][0]
    score = cosine_similarity(_job_vector, resume_vector)[0][0]

    return round(float(score), 4)  # e.g. 0.7231