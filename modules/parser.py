"""
parser.py — STEP 1 of the AI Pipeline: Extract raw text from resume files.
===========================================================================

PURPOSE:
    The AI pipeline can only work with plain text.
    This module's job is to open a PDF or DOCX file and extract all the text from it.
    The extracted text is then passed to extractor.py (Step 2).

LIBRARIES USED:
    - PyMuPDF (fitz): reads PDF files page by page
    - python-docx (Document): reads DOCX files paragraph by paragraph

CALLED BY:
    pipeline_runner.py → extract_text(file_path)
"""

import fitz  # PyMuPDF — a fast PDF reading library
from docx import Document  # python-docx — reads Microsoft Word files
from pathlib import Path    # used for cross-platform file path handling


def _extract_pdf(file_path: str) -> str:
    """
    Internal function to extract text from a PDF file.

    HOW IT WORKS:
        - Opens the PDF using PyMuPDF (fitz.open)
        - Iterates through every page in the document
        - Calls page.get_text() on each page to get the text content
        - Joins all pages with newlines into one big string

    Args:
        file_path: Full path to the PDF file

    Returns:
        All text from all pages as a single string

    Raises:
        fitz.FileDataError: If the PDF file is corrupted or unreadable
        Exception: For any other reading errors
    """
    try:
        doc = fitz.open(file_path)                          # open the PDF
        pages = [page.get_text() for page in doc]          # extract text from each page
        doc.close()                                         # always close the file handle
        return "\n".join(pages).strip()                    # combine all pages into one string
    except fitz.FileDataError as e:
        print(f"[parser] Corrupted PDF '{file_path}': {e}")
        raise
    except Exception as e:
        print(f"[parser] Failed to read PDF '{file_path}': {e}")
        raise


def _extract_docx(file_path: str) -> str:
    """
    Internal function to extract text from a DOCX (Word) file.

    HOW IT WORKS:
        - Opens the DOCX file using python-docx
        - Gets all paragraphs from the document
        - Filters out empty paragraphs (whitespace-only)
        - Joins the remaining paragraphs with newlines

    Args:
        file_path: Full path to the DOCX file

    Returns:
        All non-empty paragraph text as a single string

    Raises:
        Exception: If the file is corrupted or not a valid DOCX
    """
    try:
        doc = Document(file_path)  # open the Word document
        # Filter out empty/whitespace-only paragraphs, then join
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()
    except Exception as e:
        print(f"[parser] Failed to read DOCX '{file_path}': {e}")
        raise


def extract_text(file_path: str) -> str:
    """
    PUBLIC FUNCTION — Extract text from a PDF or DOCX resume file.

    This is the function called by pipeline_runner.py.
    It checks the file extension and routes to the correct reader.

    Args:
        file_path: Path to the resume file (.pdf or .docx)

    Returns:
        The full text content of the resume as a string

    Raises:
        FileNotFoundError: If the file doesn't exist at the given path
        ValueError: If the file format is not .pdf or .docx
        Exception: If the file exists but can't be read (corrupted, etc.)
    """
    path = Path(file_path)

    # Check that the file actually exists before trying to open it
    if not path.exists():
        print(f"[parser] File not found: '{file_path}'")
        raise FileNotFoundError(f"No such file: '{file_path}'")

    # Get the file extension in lowercase (e.g. ".pdf", ".docx")
    suffix = path.suffix.lower()

    # Route to the appropriate reader based on file type
    if suffix == ".pdf":
        return _extract_pdf(file_path)
    elif suffix == ".docx":
        return _extract_docx(file_path)
    else:
        # We don't support .doc, .txt, .jpg, etc.
        msg = f"Unsupported format '{suffix}'. Only .pdf and .docx supported."
        print(f"[parser] {msg}")
        raise ValueError(msg)


# ── Quick test: run this file directly to test parsing ───────────────────────
# Usage: python modules/parser.py data/resumes/sample_resume.pdf
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python parser.py <file.pdf|file.docx>")
        sys.exit(1)

    try:
        text = extract_text(sys.argv[1])
        print(text)  # prints the extracted text to terminal
    except Exception:
        sys.exit(1)