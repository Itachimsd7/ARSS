def calculate_score(similarity, experience):
    normalized_experience = min(experience / 5, 1.0)
    score = (0.7 * similarity) + (0.3 * normalized_experience)
    return round(float(score), 4)