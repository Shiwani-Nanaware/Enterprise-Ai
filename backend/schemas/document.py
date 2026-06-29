"""Document Pydantic v2 schemas — MongoDB edition."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    """Full document response schema."""
    id: str
    title: str
    filename: str
    file_type: str
    file_size_bytes: int
    status: str
    chunk_count: int
    department: str
    uploaded_by: str
    description: str | None
    tags: list[Any]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_document(cls, doc: "Document") -> "DocumentResponse":  # type: ignore[name-defined]  # noqa: F821
        """Build from a Document dataclass."""
        return cls(
            id=str(doc.id),
            title=doc.title,
            filename=doc.filename,
            file_type=doc.file_type,
            file_size_bytes=doc.file_size_bytes,
            status=doc.status,
            chunk_count=doc.chunk_count,
            department=doc.department,
            uploaded_by=doc.uploaded_by,
            description=doc.description,
            tags=doc.tags or [],
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )


class DocumentSummaryResponse(BaseModel):
    """Compact document summary for listing views."""
    id: str
    title: str
    filename: str
    file_type: str
    file_size_bytes: int
    status: str
    chunk_count: int
    department: str
    created_at: datetime

    @classmethod
    def from_document(cls, doc: "Document") -> "DocumentSummaryResponse":  # type: ignore[name-defined]  # noqa: F821
        """Build from a Document dataclass."""
        return cls(
            id=str(doc.id),
            title=doc.title,
            filename=doc.filename,
            file_type=doc.file_type,
            file_size_bytes=doc.file_size_bytes,
            status=doc.status,
            chunk_count=doc.chunk_count,
            department=doc.department,
            created_at=doc.created_at,
        )


class DocumentUpdateRequest(BaseModel):
    """Schema for updating document metadata."""
    title: str | None = Field(default=None, min_length=1, max_length=512)
    description: str | None = Field(default=None)
    tags: list[str] | None = Field(default=None)
