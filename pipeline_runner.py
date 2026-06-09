"""
pipeline_runner.py
==================
This is the MAIN ENTRY POINT for the Python AI pipeline.

MODES OF OPERATION:
  1. SERVER MODE (default):
     Starts a persistent HTTP server on localhost. Heavy ML libraries
     (spaCy, sklearn) are loaded ONCE at startup. Each resume is processed
     via HTTP POST in ~200-500ms instead of ~15s.

     Usage:  python pipeline_runner.py --serve --port 5001

  2. CLI MODE (legacy / testing):
     Processes a single resume and prints JSON to stdout, then exits.
     Useful for manual testing from the terminal.

     Usage:  python pipeline_runner.py --file /path/to/resume.pdf --config '{"job_description":"..."}'

HOW IT WORKS (Server Mode):
  - Node.js (server/services/pythonPipeline.js) starts this server once on boot.
  - For each resume, Node.js sends an HTTP POST with { "file": "...", "config": {...} }.
  - This server runs the 5-step AI pipeline: parse → extract → match → score → classify.
  - It returns the result as JSON in the HTTP response.

WHY THIS IS FAST:
  - spaCy model (~12MB) is loaded once into memory, not per-resume.
  - scikit-learn / numpy C extensions are loaded once, not per-resume.
  - PyMuPDF is loaded once, not per-resume.
  - The TF-IDF vectorizer cache actually works across requests now.
"""

import sys
import json
import argparse
import yaml
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import time

# Add the project root directory to Python's module search path
# This allows us to import from the 'modules' and 'database' folders
sys.path.insert(0, str(Path(__file__).parent))

# ── Import each step of the AI pipeline from the modules folder ──────────────
# These imports trigger the heavy library loads (spaCy, sklearn, fitz).
# In server mode, this happens ONCE at startup. In CLI mode, once per run.
from modules.parser import extract_text        # Step 1: PDF/DOCX → raw text
from modules.extractor import extract_info     # Step 2: raw text → structured data
from modules.matcher import compute_similarity # Step 3: text vs job description → similarity score
from modules.scorer import calculate_score     # Step 4: similarity + experience → final score
from modules.classifier import classify_candidate  # Step 5: score → QUALIFIED/SHORTLIST/REJECT


def load_config(config_arg) -> dict:
    """
    Load job requirements configuration.

    Priority order:
    1. Dict or JSON string passed via argument (sent by Node.js from MongoDB)
    2. config/requirements.yaml file (static fallback)
    3. Hardcoded default values (last resort)

    Args:
        config_arg: Dict, JSON string, or empty string

    Returns:
        dict with keys: job_description, skills, min_experience, education
    """
    # If it's already a dict (from HTTP JSON body), use it directly
    if isinstance(config_arg, dict) and config_arg:
        return config_arg

    # If it's a JSON string (from CLI --config), parse it
    if isinstance(config_arg, str) and config_arg:
        try:
            return json.loads(config_arg)
        except json.JSONDecodeError:
            pass  # If JSON is malformed, fall through to YAML

    # Second try: read the YAML config file from disk
    yaml_path = Path(__file__).parent / "config" / "requirements.yaml"
    if yaml_path.exists():
        with open(yaml_path, "r") as f:
            return yaml.safe_load(f)

    # Last resort: hardcoded default config so the pipeline never crashes
    return {
        "job_description": "Python developer with machine learning and SQL experience.",
        "skills": ["python", "machine learning", "sql", "nlp"],
        "min_experience": 1,
        "education": "btech",
    }


def build_suggestions(data: dict, missing_skills: list, score: float) -> list:
    """
    Generate actionable improvement suggestions for the candidate.

    These are shown on the results page to help the candidate improve their resume.

    Args:
        data: Extracted resume data (name, skills, experience, etc.)
        missing_skills: Skills that are required but not found in the resume
        score: Final ATS score (0.0 to 1.0)

    Returns:
        List of suggestion strings
    """
    suggestions = []

    # Tell the candidate which skills they are missing
    if missing_skills:
        suggestions.append(
            f"Consider adding these missing skills: {', '.join(missing_skills)}."
        )

    # Encourage candidates with little experience to highlight what they have
    if data.get("experience", 0) < 2:
        suggestions.append("Highlight more work experience or internships.")

    # Low score means the resume text doesn't match the job description well
    if score < 0.6:
        suggestions.append(
            "Tailor your resume keywords to better match the job description."
        )

    # Missing email means the extractor couldn't find one — important for contact
    if not data.get("email"):
        suggestions.append("Add a professional email address to your resume.")

    # Universal advice that applies to all resumes
    suggestions.append("Quantify achievements with numbers and metrics.")
    return suggestions


def process_resume(file_path: str, config_arg) -> dict:
    """
    Process a single resume through the full 5-step AI pipeline.

    This is the core function used by both server mode and CLI mode.

    Args:
        file_path: Path to the resume file (PDF or DOCX)
        config_arg: Job requirements config (dict, JSON string, or empty)

    Returns:
        dict with all extracted and scored candidate data
    """
    # Load the job requirements (from arg, YAML, or defaults)
    config = load_config(config_arg)

    # ── STEP 1: Parse the resume file into raw text ───────────────────────────
    text = extract_text(file_path)

    # ── STEP 2: Extract structured information from the raw text ──────────────
    # Returns a dict: { name, email, phone, skills, education, experience }
    data = extract_info(text)

    # ── STEP 3: Compute similarity between resume and job description ─────────
    # Uses TF-IDF vectorization and cosine similarity (0.0 = no match, 1.0 = perfect)
    job_desc = config.get("job_description", "")
    similarity = compute_similarity(text, job_desc) if job_desc else 0.0

    # ── STEP 4: Calculate the final ATS score ────────────────────────────────
    # Formula: (0.7 × similarity) + (0.3 × min(experience/5, 1.0))
    score = calculate_score(similarity, data.get("experience", 0))

    # ── STEP 5: Classify the candidate ───────────────────────────────────────
    # QUALIFIED (score >= 0.75), SHORTLIST (0.40–0.74), REJECT (< 0.40 or wrong education)
    required_edu = config.get("education", "")
    result = classify_candidate(score, data.get("education", ""), required_edu)

    # ── STEP 6: Find missing skills ───────────────────────────────────────────
    required_skills = [s.lower() for s in config.get("skills", [])]
    found_skills    = [s.lower() for s in data.get("skills", [])]
    missing_skills  = [s for s in required_skills if s not in found_skills]

    # ── STEP 7: Build strengths and weaknesses ────────────────────────────────
    strengths = [f"Proficient in {s}" for s in data.get("skills", [])]
    weaknesses = [f"Missing skill: {s}" for s in missing_skills]
    if data.get("experience", 0) < 2:
        weaknesses.append("Limited work experience")

    # ── Build and return the result dictionary ────────────────────────────────
    return {
        "name":         data.get("name", ""),
        "email":        data.get("email", ""),
        "phone":        data.get("phone", ""),
        "skills":       data.get("skills", []),
        "education":    data.get("education", ""),
        "experience":   data.get("experience", 0),
        "similarity":   round(similarity, 4),
        "score":        round(score, 4),
        "result":       result,
        "missingSkills": missing_skills,
        "suggestions":  build_suggestions(data, missing_skills, score),
        "strengths":    strengths,
        "weaknesses":   weaknesses,
    }


# ── HTTP Server for persistent mode ──────────────────────────────────────────

class PipelineHandler(BaseHTTPRequestHandler):
    """
    HTTP request handler for the persistent pipeline server.

    Endpoints:
        POST /           — Process a resume. Body: { "file": "...", "config": {...} }
        GET  /health     — Health check. Returns { "status": "ok" }
    """

    def do_POST(self):
        """Handle POST request — process a resume."""
        content_length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_length))

        file_path = body.get("file", "")
        config = body.get("config", {})

        t0 = time.time()

        try:
            result = process_resume(file_path, config)
            elapsed = round(time.time() - t0, 3)
            result["_processingTimeMs"] = int(elapsed * 1000)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

            print(f"[pipeline] Processed in {elapsed}s: {result.get('name', 'Unknown')}", flush=True)

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
            print(f"[pipeline] Error: {e}", flush=True)

    def do_GET(self):
        """Handle GET request — health check."""
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())

    def log_message(self, format, *args):
        """Suppress default request logging to keep stdout clean."""
        pass


def run_server(port: int):
    """Start the persistent HTTP server on the given port."""
    server = HTTPServer(("127.0.0.1", port), PipelineHandler)

    # Print a readiness signal that Node.js watches for
    print(json.dumps({"status": "ready", "port": port}), flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[pipeline] Shutting down...", flush=True)
        server.shutdown()


def run_cli(file_path: str, config_arg: str):
    """
    Legacy CLI mode — process a single resume, print JSON to stdout, exit.

    This is the original behavior. Kept for backward compatibility and testing.
    """
    try:
        output = process_resume(file_path, config_arg)
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


def main():
    """
    Main function — decides between server mode and CLI mode.

    Server mode (default for Node.js):
        python pipeline_runner.py --serve --port 5001

    CLI mode (legacy):
        python pipeline_runner.py --file /path/to/resume.pdf --config '{"job_description":"..."}'
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true", help="Run as persistent HTTP server")
    parser.add_argument("--port", type=int, default=5001, help="Port for HTTP server (default: 5001)")
    parser.add_argument("--file", default="", help="Path to resume file (CLI mode)")
    parser.add_argument("--config", default="", help="Job requirements as JSON string (CLI mode)")
    args = parser.parse_args()

    if args.serve:
        # Server mode: start persistent HTTP server
        run_server(args.port)
    elif args.file:
        # CLI mode: process one file and exit
        run_cli(args.file, args.config)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
