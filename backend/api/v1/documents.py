"""Document management API endpoints — MongoDB + ChromaDB edition."""

from pathlib import Path

from fastapi import APIRouter, File, Form, Query, UploadFile, status

from core.dependencies import CurrentUserDep
from core.exceptions import UnsupportedFileTypeError
from database.mongo import MongoDep
from rag.loaders.document_loader import SUPPORTED_TYPES
from schemas.common import PaginatedResponse, SuccessResponse
from schemas.document import DocumentResponse, DocumentSummaryResponse
from services.document_service import DocumentService
from utils.pagination import calculate_total_pages

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=SuccessResponse[DocumentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload document",
    description="Upload a file for RAG ingestion into ChromaDB with department metadata filtering.",
)
async def upload_document(
    current_user: CurrentUserDep,
    db: MongoDep,
    file: UploadFile = File(...),
    department: str = Form(...),
    title: str = Form(..., min_length=1, max_length=512),
    description: str | None = Form(default=None),
) -> SuccessResponse[DocumentResponse]:
    filename = file.filename or "unknown"
    file_ext = Path(filename).suffix.lower().lstrip(".")
    if file_ext not in SUPPORTED_TYPES:
        raise UnsupportedFileTypeError(filename=filename, file_type=file_ext)

    content = await file.read()
    service = DocumentService(db)
    document = await service.upload_document(
        content=content,
        filename=filename,
        department=department.lower(),
        title=title,
        description=description,
        uploaded_by=current_user,
    )
    return SuccessResponse(
        data=DocumentResponse.from_document(document),
        message="Document uploaded and indexed successfully.",
    )


@router.get(
    "",
    response_model=PaginatedResponse[DocumentSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List documents",
    description="List documents accessible to the current user (RBAC-filtered by department).",
)
async def list_documents(
    current_user: CurrentUserDep,
    db: MongoDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    department: str | None = Query(default=None),
    status: str | None = Query(default=None),
    file_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
) -> PaginatedResponse[DocumentSummaryResponse]:
    service = DocumentService(db)
    offset = (page - 1) * page_size
    docs, total = await service.list_documents(
        requesting_user=current_user,
        offset=offset,
        limit=page_size,
        department=department,
        status=status,
        file_type=file_type,
        search=search,
    )
    return PaginatedResponse(
        data=[DocumentSummaryResponse.from_document(d) for d in docs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=calculate_total_pages(total, page_size),
    )


@router.get(
    "/{document_id}",
    response_model=SuccessResponse[DocumentResponse],
    status_code=status.HTTP_200_OK,
    summary="Get document",
    description="Retrieve full metadata for a specific document.",
)
async def get_document(
    document_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[DocumentResponse]:
    service = DocumentService(db)
    doc = await service.get_document(document_id, current_user)
    return SuccessResponse(data=DocumentResponse.from_document(doc))


@router.delete(
    "/{document_id}",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Delete document",
    description="Soft-delete a document and remove its vectors from ChromaDB.",
)
async def delete_document(
    document_id: str,
    current_user: CurrentUserDep,
    db: MongoDep,
) -> SuccessResponse[dict]:
    service = DocumentService(db)
    await service.delete_document(document_id, current_user)
    return SuccessResponse(data={}, message="Document deleted successfully.")
