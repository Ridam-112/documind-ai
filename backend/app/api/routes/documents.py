import os
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentPage
from app.schemas.document import DocumentResponse, DocumentStatusResponse, DocumentPageResponse
from app.services.storage_service import storage_service
from app.workers.document_processor import process_document_pipeline

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save file safely to disk
    storage_path, safe_filename, file_size = storage_service.save_upload(file, current_user.id)
    doc_title = title.strip() if title and title.strip() else file.filename

    doc = Document(
        user_id=current_user.id,
        title=doc_title,
        original_filename=file.filename or safe_filename,
        storage_path=storage_path,
        file_size=file_size,
        page_count=0,
        mime_type="application/pdf",
        processing_status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # In serverless environment, process document immediately so pages and vectors are ready
    try:
        await process_document_pipeline(doc.id)
    except Exception as e:
        logger.error(f"Error during document ingestion: {e}")

    db.refresh(doc)
    return DocumentResponse.model_validate(doc)

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if search:
        query = query.filter(Document.title.ilike(f"%{search}%"))
    docs = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return [DocumentResponse.model_validate(d) for d in docs]

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(doc)

@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentStatusResponse(
        id=doc.id,
        processing_status=doc.processing_status,
        page_count=doc.page_count,
        processing_error=doc.processing_error
    )

@router.get("/{document_id}/pages/{page_number}", response_model=DocumentPageResponse)
def get_document_page(
    document_id: str,
    page_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify ownership
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    page = db.query(DocumentPage).filter(
        DocumentPage.document_id == document_id,
        DocumentPage.page_number == page_number
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail=f"Page {page_number} not found")
    return DocumentPageResponse.model_validate(page)

@router.get("/{document_id}/file")
def get_document_file(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc or not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="Document file not found")
    return FileResponse(
        doc.storage_path,
        media_type="application/pdf",
        filename=doc.original_filename
    )

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete physical file
    storage_service.delete_file(doc.storage_path)

    # Delete from DB (cascades to pages, chunks, conversations, collection_documents)
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": document_id}
