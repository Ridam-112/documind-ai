from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class SourceCitation(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    source_excerpt: str

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    sources: List[SourceCitation] = []

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    document_id: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageResponse]] = None

    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    id: str
    user_id: str
    document_id: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
