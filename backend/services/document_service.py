"""Document management service — MongoDB + ChromaDB edition."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorDatabase

from auth.departments import can_access_department, get_accessible_departments
from auth.roles import Permission, has_permission
from core.config import get_settings
from core.exceptions import (
    DocumentProcessingError,
    DocumentTooLargeError,
    NotFoundError,
    PermissionDeniedError,
    UnsupportedFileTypeError,
    VectorStoreError,
)
from core.logging import get_logger
from models.document import Document
from models.user import User
from rag.loaders.document_loader import SUPPORTED_TYPES, extract_text, split_text
from rag.vectorstore.chroma_client import (
    add_chunks_to_collection,
    delete_document_vectors,
    get_or_create_collection,
)
from repositories.audit_repository import AuditRepository
from repositories.document_repository import DocumentRepository

logger = get_logger(__name__)
_settings = get_settings()


class DocumentService:
    """Handles document upload, ChromaDB ingestion, and management."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._repo = DocumentRepository(db)
        self._audit_repo = AuditRepository(db)

    def _validate_upload(
        self, filename: str, file_type: str, file_size_bytes: int
    ) -> None:
        ft = file_type.lower().lstrip(".")
        if ft not in SUPPORTED_TYPES:
            raise UnsupportedFileTypeError(filename=filename, file_type=ft)
        max_bytes = _settings.max_document_size_mb * 1024 * 1024
        if file_size_bytes > max_bytes:
            size_mb = file_size_bytes / (1024 * 1024)
            raise DocumentTooLargeError(
                filename=filename,
                size_mb=size_mb,
                max_size_mb=_settings.max_document_size_mb,
            )

    def _get_storage_path(self, document_id: str, filename: str) -> Path:
        storage_root = Path(_settings.document_storage_path)
        storage_root.mkdir(parents=True, exist_ok=True)
        return storage_root / f"{document_id}_{filename}"

    async def upload_document(
        self,
        content: bytes,
        filename: str,
        department: str,
        title: str,
        description: str | None,
        uploaded_by: User,
        ip_address: str | None = None,
    ) -> Document:
        """Upload, store, and ingest a document into ChromaDB.

        Args:
            content: Raw file bytes.
            filename: Original filename.
            department: Target department collection name.
            title: Human-readable document title.
            description: Optional description.
            uploaded_by: Authenticated uploader.
            ip_address: Client IP for audit logging.

        Returns:
            Document: The created document record.

        Raises:
            PermissionDeniedError: If the user cannot access the department.
            UnsupportedFileTypeError: If the file type is not supported.
            DocumentTooLargeError: If the file is too large.
            DocumentProcessingError: If extraction or ingestion fails.
        """
        if not can_access_department(uploaded_by.role, department):
            raise PermissionDeniedError(
                f"You do not have access to the '{department}' department."
            )

        file_ext = Path(filename).suffix.lower().lstrip(".")
        file_size = len(content)
        self._validate_upload(filename, file_ext, file_size)

        existing = await self._repo.find_duplicate(filename, department)
        if existing:
            raise DocumentProcessingError(
                f"A document named '{filename}' already exists in the '{department}' department.",
                filename=filename,
            )

        doc_id = str(uuid.uuid4())
        storage_path = self._get_storage_path(doc_id, filename)

        document = Document(
            filename=filename,
            file_type=file_ext,
            file_size_bytes=file_size,
            storage_path=str(storage_path),
            department=department,
            uploaded_by=str(uploaded_by.id),
            title=title,
            description=description,
            status="processing",
            chunk_count=0,
        )
        document = await self._repo.create(document)

        # Write file to disk
        try:
            with open(storage_path, "wb") as f:
                f.write(content)
        except OSError as exc:
            await self._repo.update(str(document.id), {"status": "failed", "processing_error": str(exc)})
            raise DocumentProcessingError(
                f"Failed to write document to storage: {exc}", filename=filename
            ) from exc

        # Ingest into ChromaDB
        try:
            chunk_count = await self._ingest_document(
                document_id=str(document.id),
                content=content,
                filename=filename,
                file_type=file_ext,
                department=department,
                storage_path=str(storage_path),
            )
            await self._repo.update(
                str(document.id), {"status": "indexed", "chunk_count": chunk_count}
            )
            document.status = "indexed"
            document.chunk_count = chunk_count
        except Exception as exc:
            await self._repo.update(
                str(document.id),
                {"status": "failed", "processing_error": str(exc)[:500]},
            )
            logger.exception("Document ingestion failed", filename=filename, doc_id=str(document.id))
            raise DocumentProcessingError(
                f"Document ingestion failed: {exc}", filename=filename
            ) from exc

        await self._audit_repo.log(
            action="document.upload",
            user_id=str(uploaded_by.id),
            resource_type="document",
            resource_id=str(document.id),
            ip_address=ip_address,
            status="success",
            detail={"filename": filename, "department": department, "file_type": file_ext},
        )
        logger.info(
            "Document uploaded and indexed",
            doc_id=str(document.id),
            filename=filename,
            department=department,
            chunks=document.chunk_count,
        )
        return document

    async def _ingest_document(
        self,
        document_id: str,
        content: bytes,
        filename: str,
        file_type: str,
        department: str,
        storage_path: str,
    ) -> int:
        """Extract text, embed chunks, and store in ChromaDB.

        Args:
            document_id: String document ID.
            content: Raw file bytes.
            filename: Original filename.
            file_type: File extension.
            department: Department collection name.
            storage_path: On-disk file path (used as metadata source).

        Returns:
            int: Number of chunks indexed.
        """
        import asyncio

        # Extract text
        text = extract_text(content, file_type, filename)
        if not text.strip():
            raise DocumentProcessingError(
                "Document contains no extractable text.", filename=filename
            )

        # Split into chunks
        chunks = split_text(
            text=text,
            document_id=document_id,
            filename=filename,
            department=department,
            source=storage_path,
        )
        if not chunks:
            raise DocumentProcessingError(
                "Document produced no text chunks after splitting.", filename=filename
            )

        # Generate embeddings (local HuggingFace — no API key required)
        from rag.embeddings.hf_embeddings import get_embedding_model

        embed_model = get_embedding_model()
        texts = [chunk.page_content for chunk in chunks]
        embeddings: list[list[float]] = await embed_model.aembed_documents(texts)

        # Build ChromaDB inputs
        chunk_ids = [f"{document_id}_{i}" for i in range(len(chunks))]
        metadatas = [dict(chunk.metadata) for chunk in chunks]

        # Add to ChromaDB (sync call — run in thread pool)
        loop = asyncio.get_event_loop()
        collection_name = _settings.chroma.collection_name
        await loop.run_in_executor(
            None,
            lambda: add_chunks_to_collection(
                chunk_ids=chunk_ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                collection_name=collection_name,
            ),
        )

        logger.info(
            "Chunks indexed in ChromaDB",
            document_id=document_id,
            chunk_count=len(chunks),
        )
        return len(chunks)

    async def get_document(self, document_id: str, requesting_user: User) -> Document:
        """Fetch a document with department access enforcement.

        Args:
            document_id: String document ID.
            requesting_user: Authenticated user.

        Returns:
            Document: The document record.

        Raises:
            NotFoundError: If not found.
            PermissionDeniedError: If department access is denied.
        """
        doc = await self._repo.get_active_by_id(document_id)
        if not doc:
            raise NotFoundError("Document", document_id)
        if not can_access_department(requesting_user.role, doc.department):
            raise PermissionDeniedError(
                f"You do not have access to documents in the '{doc.department}' department."
            )
        return doc

    async def delete_document(
        self,
        document_id: str,
        requesting_user: User,
        ip_address: str | None = None,
    ) -> None:
        """Soft-delete a document and remove its vectors from ChromaDB.

        Args:
            document_id: String document ID.
            requesting_user: Authenticated user.
            ip_address: Client IP for audit logging.

        Raises:
            NotFoundError: If not found.
            PermissionDeniedError: If not owner and not admin.
        """
        doc = await self._repo.get_active_by_id(document_id)
        if not doc:
            raise NotFoundError("Document", document_id)

        is_owner = str(doc.uploaded_by) == str(requesting_user.id)
        is_admin = has_permission(requesting_user.role, Permission.DOCUMENT_DELETE)

        if not is_owner and not is_admin:
            raise PermissionDeniedError(
                "You can only delete documents you uploaded, unless you have admin privileges."
            )

        # Remove vectors from ChromaDB (sync in thread pool)
        import asyncio

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: delete_document_vectors(
                document_id, _settings.chroma.collection_name
            ),
        )

        # Remove file from disk
        try:
            if doc.storage_path and os.path.exists(doc.storage_path):
                os.remove(doc.storage_path)
        except OSError as exc:
            logger.warning("Failed to remove document file", path=doc.storage_path, error=str(exc))

        # Soft-delete in MongoDB
        await self._repo.soft_delete(document_id, str(requesting_user.id))

        await self._audit_repo.log(
            action="document.delete",
            user_id=str(requesting_user.id),
            resource_type="document",
            resource_id=document_id,
            ip_address=ip_address,
            status="success",
            detail={"filename": doc.filename, "department": doc.department},
        )
        logger.info("Document deleted", doc_id=document_id, deleted_by=str(requesting_user.id))

    async def list_documents(
        self,
        requesting_user: User,
        offset: int = 0,
        limit: int = 50,
        department: str | None = None,
        status: str | None = None,
        file_type: str | None = None,
        search: str | None = None,
    ) -> tuple[list[Document], int]:
        """List documents the requesting user is permitted to see.

        Args:
            requesting_user: Authenticated user.
            offset: Documents to skip.
            limit: Max documents to return.
            department: Optional department filter.
            status: Optional status filter.
            file_type: Optional file type filter.
            search: Optional title/filename search.

        Returns:
            tuple[list[Document], int]: Documents and total count.
        """
        accessible = get_accessible_departments(requesting_user.role)
        if department:
            if department not in accessible:
                raise PermissionDeniedError(
                    f"You do not have access to the '{department}' department."
                )
            departments_filter = [department]
        else:
            departments_filter = accessible

        docs = await self._repo.list_documents(
            offset=offset,
            limit=limit,
            departments=departments_filter,
            status=status,
            file_type=file_type,
            search=search,
        )
        total = await self._repo.count_documents(
            departments=departments_filter,
            status=status,
            file_type=file_type,
            search=search,
        )
        return docs, total
