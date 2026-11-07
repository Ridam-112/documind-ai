import uuid
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.document import Document, DocumentPage
from app.models.chunk import DocumentChunk
from app.services.pdf_service import pdf_service
from app.services.chunking_service import chunking_service
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

async def process_document_pipeline(document_id: str):
    """
    Background worker that runs the full ingestion pipeline:
    1. Extract page-by-page text
    2. Save document pages
    3. Chunk text preserving page boundaries
    4. Generate embeddings
    5. Store in vector database
    6. Update status to 'ready'
    """
    db: Session = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found for processing.")
            return

        # Step 1: Text extraction
        doc.processing_status = "extracting"
        db.commit()

        try:
            extraction_result = pdf_service.extract_text(doc.storage_path)
        except Exception as e:
            doc.processing_status = "failed"
            doc.processing_error = f"Extraction error: {str(e)}"
            db.commit()
            return

        pages_data = extraction_result["pages"]
        doc.page_count = extraction_result["page_count"]

        # Step 2: Save pages
        for page_item in pages_data:
            doc_page = DocumentPage(
                id=str(uuid.uuid4()),
                document_id=doc.id,
                page_number=page_item["page_number"],
                extracted_text=page_item["text"]
            )
            db.add(doc_page)
        db.commit()

        # Step 3: Chunking
        doc.processing_status = "chunking"
        db.commit()

        chunks_data = chunking_service.chunk_document_pages(pages_data)
        if not chunks_data:
            # Handle empty PDF or PDF with no extractable text
            doc.processing_status = "failed"
            doc.processing_error = "The PDF contains no extractable text. Scanned documents requiring OCR are not supported in this version."
            db.commit()
            return

        # Step 4: Embedding generation
        doc.processing_status = "embedding"
        db.commit()

        chunk_texts = [c["content"] for c in chunks_data]
        try:
            embeddings = await embedding_service.get_embeddings(chunk_texts)
        except Exception as e:
            doc.processing_status = "failed"
            doc.processing_error = f"Embedding error: {str(e)}"
            db.commit()
            return

        # Step 5: Store Chunks & Vectors
        for i, c in enumerate(chunks_data):
            emb = embeddings[i] if i < len(embeddings) else None
            chunk_record = DocumentChunk(
                id=str(uuid.uuid4()),
                document_id=doc.id,
                user_id=doc.user_id,
                page_start=c["page_start"],
                page_end=c["page_end"],
                chunk_index=c["chunk_index"],
                content=c["content"],
                embedding=emb,
                token_count=c["token_count"]
            )
            db.add(chunk_record)

        # Step 6: Ready
        doc.processing_status = "ready"
        doc.processing_error = None
        db.commit()
        logger.info(f"Successfully processed document {doc.id} ({doc.title}) with {len(chunks_data)} chunks.")

    except Exception as e:
        logger.exception(f"Unexpected error processing document {document_id}: {e}")
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.processing_status = "failed"
                doc.processing_error = f"Unexpected processing error: {str(e)}"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
