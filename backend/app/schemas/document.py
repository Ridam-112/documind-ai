from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    original_filename: str
    file_size: int
    page_count: int
    mime_type: str
    processing_status: str
    processing_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentStatusResponse(BaseModel):
    id: str
    processing_status: str
    page_count: int
    processing_error: Optional[str] = None

class DocumentPageResponse(BaseModel):
    id: str
    document_id: str
    page_number: int
    extracted_text: str

    class Config:
        from_attributes = True
