"""
parser.py — Extract text from PDF and DOCX files.
"""

import fitz  # PyMuPDF
from docx import Document
from pathlib import Path


def _extract_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF."""
    try:
        doc = fitz.open(file_path)
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n".join(pages).strip()
    except fitz.FileDataError as e:
        print(f"[parser] Corrupted PDF '{file_path}': {e}")
        raise
    except Exception as e:
        print(f"[parser] Failed to read PDF '{file_path}': {e}")
        raise


def _extract_docx(file_path: str) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()
    except Exception as e:
        print(f"[parser] Failed to read DOCX '{file_path}': {e}")
        raise


def extract_text(file_path: str) -> str:
    """
    Extract text from a PDF or DOCX file.

    Args:
        file_path: Path to the file (.pdf or .docx).

    Returns:
        Extracted text as a clean string.

    Raises:
        ValueError: Unsupported file extension.
        FileNotFoundError: File does not exist.
        Exception: Corrupted or unreadable file.
    """
    path = Path(file_path)

    if not path.exists():
        print(f"[parser] File not found: '{file_path}'")
        raise FileNotFoundError(f"No such file: '{file_path}'")

    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(file_path)
    elif suffix == ".docx":
        return _extract_docx(file_path)
    else:
        msg = f"Unsupported format '{suffix}'. Only .pdf and .docx supported."
        print(f"[parser] {msg}")
        raise ValueError(msg)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python parser.py <file.pdf|file.docx>")
        sys.exit(1)

    try:
        text = extract_text(sys.argv[1])
        print(text)
    except Exception:
        sys.exit(1)