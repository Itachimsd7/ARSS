"""
generate_sample_resume.py
=========================
Generates a sample PDF resume that is guaranteed to score QUALIFIED
by the ARSS AI pipeline.

WHAT THE PIPELINE CHECKS:
  1. Education   → must contain "b.tech" (case-insensitive keyword match)
  2. Skills      → must contain: python, machine learning, sql, nlp
                   (also packs bonus skills: data analysis, pandas, tensorflow, django, flask)
  3. Experience  → must match regex: "X years of experience" — we use 5 years (max score)
  4. Similarity  → TF-IDF cosine sim vs job description:
                     "Looking for a Python developer with knowledge in machine learning,
                      data analysis, and SQL. Experience with NLP is a plus."
                   We repeat every keyword from the JD multiple times to maximise TF-IDF score.
  5. Score       → (0.7 × similarity) + (0.3 × min(5/5, 1.0))
                   Target: similarity ≥ 0.80 → score ≥ 0.86 → QUALIFIED

Run:
    python generate_sample_resume.py
Output:
    data/resumes/arss_qualified_resume.pdf
"""

import fitz   # PyMuPDF — already installed in the venv
import os

# ── Output path ───────────────────────────────────────────────────────────────
OUTPUT_DIR  = os.path.join(os.path.dirname(__file__), "data", "resumes")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "arss_qualified_resume.pdf")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Resume text content ───────────────────────────────────────────────────────
# Every line is carefully crafted to trigger the extractors:
#
#  NAME        → "Arjun Sharma" — common English name, spaCy PERSON entity
#  EMAIL       → regex: word@domain.tld
#  PHONE       → regex: +91-XXX-XXX-XXXX
#  EDUCATION   → must contain "b.tech" literally (extractor keyword match)
#  EXPERIENCE  → must match "(\d+) years of experience" regex — we use "5 years of experience"
#  SKILLS      → must contain exact strings: "python", "machine learning", "sql", "nlp",
#                "data analysis", "pandas", "tensorflow", "django", "flask"
#  SIMILARITY  → repeat job-description keywords heavily so TF-IDF cosine sim is high:
#                python, machine learning, sql, nlp, data analysis, developer

RESUME_TEXT = """\
Arjun Sharma
Email: arjun.sharma@gmail.com  |  Phone: +91-987-654-3210
LinkedIn: linkedin.com/in/arjunsharma  |  GitHub: github.com/arjunsharma

OBJECTIVE
Python developer with 5 years of experience in machine learning, data analysis,
and SQL. Experience with NLP is a plus. Seeking a Python developer role that leverages
machine learning, data analysis, SQL, and NLP skills to deliver intelligent solutions.

EDUCATION
B.Tech in Computer Science and Engineering
ABC Institute of Technology, Pune — 2019
CGPA: 8.7 / 10

TECHNICAL SKILLS
Programming Languages : Python, Java, SQL, C++
Machine Learning      : machine learning, deep learning, NLP, natural language processing
Data and Analytics    : data analysis, pandas, numpy, matplotlib
Frameworks            : TensorFlow, Django, Flask, scikit-learn
Databases             : SQL, MySQL, PostgreSQL, MongoDB
Tools                 : Git, Docker, Jupyter Notebook

WORK EXPERIENCE

Senior Python Developer — DataSolve Pvt. Ltd., Pune (2021 – Present)
3 years of experience as Python developer focusing on machine learning and data analysis.
  • Built machine learning models for customer churn prediction using Python and scikit-learn.
  • Developed NLP pipelines for text classification and sentiment analysis, experience with NLP
    includes spaCy, NLTK, and transformer models for natural language processing.
  • Performed data analysis on large SQL databases using pandas and numpy.
  • Deployed machine learning APIs using Django and Flask on cloud infrastructure.
  • Wrote complex SQL queries and stored procedures for data extraction and reporting.
  • Python developer responsible for end-to-end machine learning pipeline development.
  • Used data analysis techniques to identify trends and improve business KPIs.

Python Developer — IntelliData Solutions, Pune (2019 – 2021)
2 years of experience as Python developer in machine learning and data analysis projects.
  • Developed Python scripts for automated data analysis and SQL-backed ETL pipelines.
  • Built NLP models for information extraction; experience with NLP tools including spaCy.
  • Used TensorFlow for deep learning and machine learning model training.
  • Maintained SQL databases and optimised slow queries improving performance by 40%.
  • Created data analysis dashboards using pandas and matplotlib.
  • Python developer working with SQL, machine learning, and NLP on a daily basis.

PROJECTS

1. Resume Screening System (Python, NLP, machine learning, SQL, data analysis)
   End-to-end Python application that uses NLP and machine learning to screen resumes.
   Python developer built TF-IDF and cosine similarity scoring with SQL database backend.
   Tech: Python, NLP, machine learning, pandas, data analysis, SQL, Flask.

2. Sales Forecasting (Python, machine learning, pandas, SQL, data analysis)
   Machine learning regression model in Python to forecast monthly sales figures.
   Pulled training data from SQL warehouse; used pandas for data analysis.
   Python developer used machine learning to reduce forecast error by 22%.
   Tech: Python, machine learning, SQL, pandas, TensorFlow, data analysis.

3. Sentiment Analysis API (Python, NLP, Django, machine learning)
   Django REST API with real-time NLP sentiment analysis endpoint.
   Experience with NLP includes training machine learning classifier on 50,000 samples.
   Python developer built complete NLP pipeline with data analysis and SQL logging.
   Tech: Python, NLP, machine learning, Django, pandas, data analysis.

CERTIFICATIONS
  • Google Professional Machine Learning Engineer
  • Python for Data Analysis and NLP — Coursera
  • SQL for Data Science — IBM (Coursera)
  • TensorFlow Developer Certificate — Google

SUMMARY
Python developer with 5 years of experience in machine learning, data analysis, and SQL.
Experience with NLP is a plus — extensive NLP work across all roles.
Core skills: Python, machine learning, SQL, NLP, data analysis, pandas, TensorFlow, Django, Flask.
Proven Python developer track record delivering machine learning and data analysis solutions
using SQL databases and NLP techniques. 5 years of experience total.

LANGUAGES: English (Fluent), Hindi (Native)
LOCATION: Pune, Maharashtra, India
"""

# ── Build the PDF using PyMuPDF ───────────────────────────────────────────────
def generate_pdf(text: str, output_path: str):
    doc  = fitz.open()                         # create a new empty PDF
    page = doc.new_page(width=595, height=842)  # A4 size in points (210×297mm)

    x       = 50    # left margin
    y       = 50    # starting Y position from top
    max_y   = 800   # bottom margin — add a new page if we go past this
    size_h  = 12    # font size for headings
    size_n  = 10    # font size for normal text
    line_h  = 14    # line height (pixels between lines)

    lines = text.split("\n")

    for line in lines:
        # If we've gone past the bottom margin, add a new page
        if y > max_y:
            page = doc.new_page(width=595, height=842)
            y = 50

        stripped = line.strip()

        # Section headings (ALL CAPS lines) get bigger font + bold effect
        if stripped.isupper() and len(stripped) > 3:
            size = size_h
        else:
            size = size_n

        # insert_text writes actual selectable/extractable text into the PDF
        page.insert_text(
            fitz.Point(x, y),
            line,
            fontsize=size,
            fontname="helv",   # Helvetica — standard built-in PDF font
            color=(0, 0, 0),
        )
        y += line_h

    doc.save(output_path)
    doc.close()
    print(f"[✓] Resume saved to: {output_path}")


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    generate_pdf(RESUME_TEXT, OUTPUT_FILE)

    # Quick verification — read the PDF back and show what will be extracted
    print("\n--- Verifying extraction ---")
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from modules.parser     import extract_text
    from modules.extractor  import extract_info
    from modules.matcher    import compute_similarity
    from modules.scorer     import calculate_score
    from modules.classifier import classify_candidate
    import yaml

    with open(os.path.join(os.path.dirname(__file__), "config", "requirements.yaml")) as f:
        config = yaml.safe_load(f)

    text       = extract_text(OUTPUT_FILE)
    info       = extract_info(text)
    similarity = compute_similarity(text, config["job_description"])
    score      = calculate_score(similarity, info["experience"])
    result     = classify_candidate(score, info["education"], config["education"])

    print(f"  Name       : {info['name']}")
    print(f"  Email      : {info['email']}")
    print(f"  Phone      : {info['phone']}")
    print(f"  Education  : {info['education']}")
    print(f"  Experience : {info['experience']} years")
    print(f"  Skills     : {info['skills']}")
    print(f"  Similarity : {similarity}")
    print(f"  Score      : {score}  ({round(score*100)}%)")
    print(f"  Result     : {result}")
