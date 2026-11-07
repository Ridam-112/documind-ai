from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.chat import (
    ChatRequest,
    MessageResponse,
    ConversationResponse,
    ConversationSummary,
    SourceCitation,
)
from app.services.chat_service import chat_service
from app.services.llm_service import LLMConfigurationError, LLMGenerationError

router = APIRouter()

@router.post("/documents/{document_id}/chat", response_model=dict)
async def chat_with_document(
    document_id: str,
    chat_in: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = await chat_service.process_chat(
            db=db,
            user_id=current_user.id,
            document_id=document_id,
            user_message_text=chat_in.message,
            conversation_id=chat_in.conversation_id
        )
        return {
            "conversation_id": result["conversation_id"],
            "message": result["message"]
        }
    except LLMConfigurationError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except LLMGenerationError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Chat processing error: {str(e)}")

@router.get("/conversations", response_model=List[ConversationSummary])
def list_conversations(
    document_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if document_id:
        query = query.filter(Conversation.document_id == document_id)
    conversations = query.order_by(Conversation.updated_at.desc()).all()
    return [ConversationSummary.model_validate(c) for c in conversations]

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    formatted_messages = []
    for msg in messages:
        sources = [
            SourceCitation(
                document_id=s.document_id,
                document_title=conv.document.title if conv.document else "",
                page_number=s.page_number,
                source_excerpt=s.source_excerpt
            )
            for s in msg.sources
        ]
        formatted_messages.append(
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at,
                sources=sources
            )
        )

    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        document_id=conv.document_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=formatted_messages
    )

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    result = []
    for msg in messages:
        sources = [
            SourceCitation(
                document_id=s.document_id,
                document_title=conv.document.title if conv.document else "",
                page_number=s.page_number,
                source_excerpt=s.source_excerpt
            )
            for s in msg.sources
        ]
        result.append(
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at,
                sources=sources
            )
        )
    return result

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully", "id": conversation_id}
