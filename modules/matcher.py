from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_vectorizer = TfidfVectorizer()
_job_vector = None
_last_job_desc = None

def compute_similarity(resume_text, job_description):
    global _job_vector, _last_job_desc

    if not resume_text or not job_description:
        return 0.0

    if job_description != _last_job_desc:
        _last_job_desc = job_description
        _job_vector = None  # invalidate cache

    if _job_vector is None:
        combined = _vectorizer.fit_transform([job_description, resume_text])
        _job_vector = combined[0]
        resume_vector = combined[1]
    else:
        resume_vector = _vectorizer.transform([resume_text])[0]

    score = cosine_similarity(_job_vector, resume_vector)[0][0]
    return round(float(score), 4)