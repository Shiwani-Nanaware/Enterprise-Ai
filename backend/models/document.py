"""Document model — MongoDB edition.

Represents an uploaded enterprise document stored in the ``documents``
collection. No SQLAlchemy. Maps directly to MongoDB BSON documents.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class Document:
    """Enterprise document record in MongoDB.

    Attributes:
        id: MongoDB ObjectId string.
        title: Human-readable title.
        filename: Original filename.
        file_type: Extension (pdf, docx, etc.).
        file_size_bytes: Raw size in bytes.
        storage_path: Path to the file on disk.
        status: Processing status (pending / processing / indexed / failed).
        chunk_count: Number of vector chunks indexed.
        department: Department collection this document belongs to.
        uploaded_by: ID string of the uploading user.
        description: Optional description.
        tags: Optional list of tags.
        metadata: Extra metadata dict.
        processing_error: Error message if ingestion failed.
        is_deleted: Soft-delete flag.
        deleted_at: Timestamp of soft-deletion.
        deleted_by: Who deleted the document.
        created_at: Record creation timestamp.
        updated_at: Last update timestamp.
    """

    filename: str
    file_type: str
    file_size_bytes: int
    storage_path: str
    department: str
    uploaded_by: str
    title: str = ""
    status: str = "pending"
    chunk_count: int = 0
    description: str | None = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    processing_error: str | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Serialise to a MongoDB-ready dictionary.

        Returns:
            dict: BSON-compatible document.
        """
        return {
            "title": self.title,
            "filename": self.filename,
            "file_type": self.file_type,
            "file_size_bytes": self.file_size_bytes,
            "storage_path": self.storage_path,
            "department": self.department,
            "uploaded_by": self.uploaded_by,
            "status": self.status,
            "chunk_count": self.chunk_count,
            "description": self.description,
            "tags": self.tags,
            "metadata": self.metadata,
            "processing_error": self.processing_error,
            "is_deleted": self.is_deleted,
            "deleted_at": self.deleted_at,
            "deleted_by": self.deleted_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Document":
        """Deserialise a MongoDB document into a Document instance.

        Args:
            data: Raw MongoDB document.

        Returns:
            Document: Populated Document dataclass.
        """
        doc_id = data.get("_id") or data.get("id")
        return cls(
            id=str(doc_id) if doc_id is not None else None,
            title=data.get("title", ""),
            filename=data.get("filename", ""),
            file_type=data.get("file_type", ""),
            file_size_bytes=data.get("file_size_bytes", 0),
            storage_path=data.get("storage_path", ""),
            department=data.get("department", ""),
            uploaded_by=data.get("uploaded_by", ""),
            status=data.get("status", "pending"),
            chunk_count=data.get("chunk_count", 0),
            description=data.get("description"),
            tags=data.get("tags") or [],
            metadata=data.get("metadata") or {},
            processing_error=data.get("processing_error"),
            is_deleted=data.get("is_deleted", False),
            deleted_at=data.get("deleted_at"),
            deleted_by=data.get("deleted_by"),
            created_at=data.get("created_at", datetime.now(UTC)),
            updated_at=data.get("updated_at", datetime.now(UTC)),
        )
