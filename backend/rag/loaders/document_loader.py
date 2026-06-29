"""Document loader — loads and splits documents into chunks.

Supports PDF, DOCX, TXT, CSV, and Markdown formats.
Uses LangChain's RecursiveCharacterTextSplitter for consistent chunking.
"""

import csv
import io
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LangChainDocument

from core.config import get_settings
from core.exceptions import DocumentProcessingError, UnsupportedFileTypeError
from core.logging import get_logger

logger = get_logger(__name__)

_settings = get_settings()

SUPPORTED_TYPES = {"pdf", "docx", "txt", "md", "csv", "markdown"}


def _get_splitter() -> RecursiveCharacterTextSplitter:
    """Return a configured text splitter.

    Returns:
        RecursiveCharacterTextSplitter: Configured with settings chunk size/overlap.
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=100,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def load_pdf(content: bytes, filename: str) -> str:
    """Extract text from a PDF file.

    Args:
        content: Raw PDF bytes.
        filename: The filename for error context.

    Returns:
        str: Extracted text content.

    Raises:
        DocumentProcessingError: If PDF parsing fails.
    """
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)
    except Exception as exc:
        raise DocumentProcessingError(
            f"Failed to parse PDF: {exc}", filename=filename
        ) from exc


def load_docx(content: bytes, filename: str) -> str:
    """Extract text from a DOCX file.

    Args:
        content: Raw DOCX bytes.
        filename: The filename for error context.

    Returns:
        str: Extracted text content.

    Raises:
        DocumentProcessingError: If DOCX parsing fails.
    """
    try:
        from docx import Document as DocxDocument

        doc = DocxDocument(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as exc:
        raise DocumentProcessingError(
            f"Failed to parse DOCX: {exc}", filename=filename
        ) from exc


def load_txt(content: bytes, filename: str) -> str:
    """Extract text from a plain text or Markdown file.

    Args:
        content: Raw file bytes.
        filename: The filename for error context.

    Returns:
        str: Decoded text content.

    Raises:
        DocumentProcessingError: If decoding fails.
    """
    try:
        import chardet

        detected = chardet.detect(content)
        encoding = detected.get("encoding") or "utf-8"
        return content.decode(encoding, errors="replace")
    except Exception as exc:
        raise DocumentProcessingError(
            f"Failed to read text file: {exc}", filename=filename
        ) from exc


def load_csv(content: bytes, filename: str) -> str:
    """Extract text from a CSV file by converting rows to readable lines.

    Args:
        content: Raw CSV bytes.
        filename: The filename for error context.

    Returns:
        str: Human-readable text representation of CSV content.

    Raises:
        DocumentProcessingError: If CSV parsing fails.
    """
    try:
        import chardet

        detected = chardet.detect(content)
        encoding = detected.get("encoding") or "utf-8"
        text = content.decode(encoding, errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        rows = []
        for row in reader:
            row_text = " | ".join(f"{k}: {v}" for k, v in row.items() if v)
            rows.append(row_text)
        return "\n".join(rows)
    except Exception as exc:
        raise DocumentProcessingError(
            f"Failed to parse CSV: {exc}", filename=filename
        ) from exc


def extract_text(content: bytes, file_type: str, filename: str) -> str:
    """Extract text from file bytes based on file type.

    Args:
        content: Raw file bytes.
        file_type: The file extension (pdf, docx, txt, md, csv).
        filename: The original filename.

    Returns:
        str: Extracted plain text.

    Raises:
        UnsupportedFileTypeError: If the file type is not supported.
        DocumentProcessingError: If extraction fails.
    """
    ft = file_type.lower().lstrip(".")

    if ft not in SUPPORTED_TYPES:
        raise UnsupportedFileTypeError(filename=filename, file_type=ft)

    if ft == "pdf":
        return load_pdf(content, filename)
    if ft == "docx":
        return load_docx(content, filename)
    if ft in ("txt", "md", "markdown"):
        return load_txt(content, filename)
    if ft == "csv":
        return load_csv(content, filename)

    raise UnsupportedFileTypeError(filename=filename, file_type=ft)


def split_text(
    text: str,
    document_id: str,
    filename: str,
    department: str,
    source: str,
) -> list[LangChainDocument]:
    """Split extracted text into chunks with metadata.

    Args:
        text: The full extracted document text.
        document_id: UUID string of the database document record.
        filename: Original filename.
        department: Department collection this document belongs to.
        source: Original source path/URL.

    Returns:
        list[LangChainDocument]: List of text chunks with metadata.
    """
    from datetime import UTC, datetime

    splitter = _get_splitter()
    chunks = splitter.create_documents([text])

    enriched = []
    for i, chunk in enumerate(chunks):
        chunk.metadata = {
            "document_id": document_id,
            "filename": filename,
            "department": department,
            "source": source,
            "chunk_id": i,
            "chunk_total": len(chunks),
            "created_at": datetime.now(UTC).isoformat(),
        }
        enriched.append(chunk)

    logger.debug(
        "Document split into chunks",
        document_id=document_id,
        filename=filename,
        chunk_count=len(enriched),
    )
    return enriched
