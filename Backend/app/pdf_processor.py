import fitz  # PyMuPDF
import os
from .config import settings

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def save_uploaded_pdf(file, filename: str) -> str:
    """Save an uploaded PDF file and return its path."""
    file_path = os.path.join(settings.upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return file_path