def classify_candidate(score, education, required_education):
    if education.strip().lower() != required_education.strip().lower():
        return "REJECT"
    if score < 0.4:
        return "REJECT"
    if score < 0.75:
        return "SHORTLIST"
    return "QUALIFIED"