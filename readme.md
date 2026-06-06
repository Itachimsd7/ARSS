# AI Resume Screening System (ARSS)

A Python-based automated resume screening system that parses resumes, extracts candidate information, evaluates job-description fit using TF-IDF cosine similarity, and classifies candidates into actionable hiring categories. Results are persisted in MongoDB for downstream retrieval and reporting.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Workflow](#5-workflow)
6. [Installation Guide](#6-installation-guide)
7. [Usage Instructions](#7-usage-instructions)
8. [MongoDB Setup Guide](#8-mongodb-setup-guide)
9. [Example Output](#9-example-output)
10. [Future Improvements](#10-future-improvements)
11. [Author](#11-author)

---

## 1. Project Overview

The **AI Resume Screening System (ARSS)** addresses one of the most time-consuming phases of recruitment: initial resume review. By combining natural language processing, rule-based information extraction, and vector-space similarity scoring, ARSS automatically ranks and classifies candidates against a given job description — reducing manual effort and introducing consistency into the screening process.

The system accepts resumes in PDF or DOCX format, processes them through a modular pipeline, and stores structured results (candidate profile, similarity score, classification label) in a MongoDB database.

> **Academic context:** This project was developed as a demonstration of applied NLP and information retrieval techniques in a real-world hiring automation scenario.

---

## 2. Features

- **Multi-format Resume Parsing** — Supports `.pdf` (via PyMuPDF) and `.docx` (via python-docx) input formats.
- **Structured Information Extraction** — Extracts candidate name, email address, phone number, skills, educational qualifications, and years of experience using spaCy and regex patterns.
- **Job Description Matching** — Computes TF-IDF vectors for resume and job description text, then calculates cosine similarity to produce a numerical fit score.
- **Candidate Scoring System** — Combines similarity score with heuristic rules (skill overlap, experience thresholds) into a single composite score.
- **Automated Classification** — Assigns each candidate one of three labels:
  - `REJECT` — Low fit; does not meet minimum criteria.
  - `SHORTLIST` — Moderate fit; warrants further review.
  - `QUALIFIED` — High fit; recommended for interview.
- **MongoDB Persistence** — Stores all extracted profiles, scores, and labels in a structured MongoDB collection.
- **Modular Architecture** — Each pipeline stage is an independent module, enabling isolated testing and easy replacement of components.

---

## 3. Tech Stack

| Category | Technology |
|---|---|
| Language | Python 3.9+ |
| Web / API Layer | Flask |
| Database | MongoDB (via PyMongo) |
| PDF Parsing | PyMuPDF (`fitz`) |
| DOCX Parsing | python-docx |
| NLP | spaCy (`en_core_web_sm`) |
| Pattern Matching | Python `re` (regex) |
| Similarity Scoring | scikit-learn (TF-IDF + cosine similarity) |
| Configuration | Python `configparser` / `.env` |

---

## 4. System Architecture

ARSS follows a **layered, modular architecture** organized into four logical tiers:

```
┌─────────────────────────────────────────────┐
│              Input Layer                    │
│   Resume files (PDF / DOCX) + Job desc.     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│           Processing Layer (modules/)       │
│                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
│  │  Parser  │→ │ Extractor │→ │ Matcher  │ │
│  └──────────┘  └───────────┘  └──────────┘ │
│                                    │        │
│                           ┌────────▼──────┐ │
│                           │  Classifier   │ │
│                           └───────────────┘ │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│           Data Layer (database/)            │
│         MongoDB — candidate collection      │
└─────────────────────────────────────────────┘
```

**Module responsibilities:**

- **Parser** — Reads raw binary (PDF/DOCX) and returns clean plain text.
- **Extractor** — Applies spaCy NER and regex to identify structured fields from plain text.
- **Matcher** — Builds TF-IDF representations of resume and job description; computes cosine similarity.
- **Classifier** — Applies threshold logic to similarity + heuristic scores to assign a classification label.
- **Database module** — Handles MongoDB connection, document insertion, and result queries.

---

## 5. Workflow

The system operates as a sequential pipeline:

```
Step 1: Load Configuration
        └── Read MongoDB URI, score thresholds, and model paths from config/

Step 2: Ingest Resume File
        └── Detect file type (.pdf or .docx)
        └── Invoke appropriate parser → raw text

Step 3: Extract Candidate Information
        └── Run spaCy NER → name, organizations, dates
        └── Apply regex patterns → email, phone, skills keywords
        └── Derive experience duration from date ranges

Step 4: Load Job Description
        └── Read JD text from data/ or passed as argument

Step 5: Compute Similarity Score
        └── Vectorize resume text + JD text with TF-IDF
        └── Calculate cosine similarity → float [0.0, 1.0]

Step 6: Classify Candidate
        └── score < 0.40            → REJECT
        └── 0.40 ≤ score < 0.70     → SHORTLIST
        └── score ≥ 0.70            → QUALIFIED

Step 7: Store Result in MongoDB
        └── Insert document: {name, email, skills, score, label, timestamp}

Step 8: Return / Display Output
        └── Print structured summary to console
        └── Optionally expose via Flask endpoint
```

---

## 6. Installation Guide

### Prerequisites

- Python 3.9 or higher
- MongoDB 6.0+ (local or Atlas)
- `pip` package manager

### Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/ai-resume-screening-system.git
cd ai-resume-screening-system
```

### Step 2 — Create and Activate a Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate — Linux / macOS
source venv/bin/activate

# Activate — Windows
venv\Scripts\activate
```

### Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Download spaCy Language Model

```bash
python -m spacy download en_core_web_sm
```

### Step 5 — Configure Environment

```bash
cp config/config.example.ini config/config.ini
```

Open `config/config.ini` and set your MongoDB connection URI and classification thresholds:

```ini
[database]
MONGO_URI = mongodb://localhost:27017/
DB_NAME   = arss_db
COLLECTION = candidates

[scoring]
REJECT_THRESHOLD     = 0.40
SHORTLIST_THRESHOLD  = 0.70
```

---

## 7. Usage Instructions

### Running the Matcher Directly

The primary entry point for testing the pipeline end-to-end is `test_matcher.py`, located in the `test_cases/` directory.

```bash
python test_cases/test_matcher.py \
  --resume   data/sample_resume.pdf \
  --jd       data/sample_job_description.txt
```

**Arguments:**

| Argument | Required | Description |
|---|---|---|
| `--resume` | Yes | Path to the resume file (`.pdf` or `.docx`) |
| `--jd` | Yes | Path to the job description text file |
| `--verbose` | No | Print detailed extraction output |

### Running via Flask API

```bash
flask --app app.py run --debug
```

Send a POST request to the `/screen` endpoint:

```bash
curl -X POST http://127.0.0.1:5000/screen \
  -F "resume=@data/sample_resume.pdf" \
  -F "jd=@data/sample_job_description.txt"
```

---

## 8. MongoDB Setup Guide

### Option A — Local MongoDB

1. Install MongoDB Community Edition from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service:

```bash
# Linux / macOS
sudo systemctl start mongod

# Windows (run as Administrator)
net start MongoDB
```

3. Verify connection:

```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

4. Set `MONGO_URI = mongodb://localhost:27017/` in `config/config.ini`.

### Option B — MongoDB Atlas (Cloud)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Whitelist your IP address under **Network Access**.
3. Create a database user under **Database Access**.
4. Copy the connection string and set it in `config/config.ini`:

```ini
MONGO_URI = mongodb+srv://<username>:<password>@cluster0.mongodb.net/
```

### Verifying Data Storage

After running the matcher, inspect stored records:

```bash
mongosh
use arss_db
db.candidates.find().pretty()
```

---

## 9. Example Output

Running `test_matcher.py` against a sample resume produces the following console output:

```
============================================================
 AI Resume Screening System — Result
============================================================
 Candidate Name   : Ananya Sharma
 Email            : ananya.sharma@email.com
 Phone            : +91-9876543210
 Skills Detected  : Python, Machine Learning, SQL, Flask, NLP
 Education        : B.Tech Computer Science — VTU (2022)
 Experience       : 2 years
------------------------------------------------------------
 Similarity Score : 0.7834
 Classification   : QUALIFIED
------------------------------------------------------------
 Record saved to MongoDB (ID: 664a2f3c1d4e7b0012abc123)
============================================================
```

**MongoDB document structure:**

```json
{
  "_id": "664a2f3c1d4e7b0012abc123",
  "name": "Ananya Sharma",
  "email": "ananya.sharma@email.com",
  "phone": "+91-9876543210",
  "skills": ["Python", "Machine Learning", "SQL", "Flask", "NLP"],
  "education": "B.Tech Computer Science",
  "experience_years": 2,
  "similarity_score": 0.7834,
  "classification": "QUALIFIED",
  "timestamp": "2024-11-10T14:32:07Z"
}
```

---

## 10. Future Improvements

- **Named Entity Recognition Fine-tuning** — Train a domain-specific spaCy model on annotated resumes for higher extraction accuracy.
- **Multi-language Support** — Extend parsing and extraction to handle resumes in Hindi, French, and other languages.
- **Web Dashboard** — Build a React or Jinja2-based UI to upload resumes, view candidate rankings, and export results.
- **Batch Processing** — Add support for bulk upload (ZIP folder of resumes) with parallel processing via `concurrent.futures`.
- **Bias Detection Module** — Introduce a fairness audit layer to flag potential demographic bias in scoring patterns.
- **REST API Expansion** — Expose full CRUD operations on candidate records via versioned Flask endpoints.
- **Integration with ATS** — Connect with Applicant Tracking Systems (e.g., Greenhouse, Lever) via webhook support.
- **Scoring Explainability** — Provide per-field score breakdown to justify classification decisions.

---

## Project Structure

```
ai-resume-screening-system/
│
├── modules/                    # Core pipeline modules
│   ├── parser.py               # PDF and DOCX text extraction
│   ├── extractor.py            # NLP-based information extraction
│   ├── matcher.py              # TF-IDF similarity computation
│   └── classifier.py           # Score-to-label classification logic
│
├── database/                   # Database layer
│   ├── mongo_client.py         # MongoDB connection handler
│   └── operations.py           # Insert, query, and update helpers
│
├── test_cases/                 # Test scripts
│   ├── test_parser.py          # Unit tests for parser module
│   ├── test_extractor.py       # Unit tests for extractor module
│   └── test_matcher.py         # End-to-end pipeline test (main entry point)
│
├── config/                     # Configuration files
│   ├── config.ini              # Active configuration (not committed)
│   └── config.example.ini      # Template configuration for onboarding
│
├── data/                       # Sample input files
│   ├── sample_resume.pdf       # Example resume for testing
│   └── sample_job_description.txt  # Example job description for testing
│
├── app.py                      # Flask application entry point
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation
```

---
Aditya Basavaraj,
CSE DEPARTMENT,
GM UNIVERSITY,
DAVANGERE
