import re
import uuid
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.conversation import Conversation, Message, MessageSource
from app.models.document import Document
from app.services.embedding_service import embedding_service
from app.services.retrieval_service import retrieval_service
from app.services.llm_service import llm_service
from app.schemas.chat import MessageResponse, SourceCitation

logger = logging.getLogger(__name__)

class ChatService:
    async def process_chat(
        self,
        db: Session,
        user_id: str,
        document_id: str,
        user_message_text: str,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Verify document ownership
        doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
        if not doc:
            raise ValueError("Document not found or access denied")

        if doc.processing_status != "ready":
            raise ValueError(f"Document is not ready for chat. Current status: {doc.processing_status}")

        # 2. Get or create conversation
        if conversation_id:
            conv = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            if not conv:
                raise ValueError("Conversation not found")
        else:
            # Auto-title conversation using first 50 chars of query
            title = user_message_text.strip()[:60]
            conv = Conversation(
                id=str(uuid.uuid4()),
                user_id=user_id,
                document_id=document_id,
                title=title
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

        # 3. Save user message
        user_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            role="user",
            content=user_message_text
        )
        db.add(user_msg)
        db.commit()

        # 4. Generate query embedding
        query_emb = await embedding_service.get_embedding(user_message_text)

        # 5. Retrieve top K relevant chunks
        relevant_chunks = retrieval_service.retrieve_relevant_chunks(
            db=db,
            user_id=user_id,
            document_id=document_id,
            query_embedding=query_emb,
            top_k=5
        )

        # Fetch recent conversation history
        past_msgs = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in past_msgs[:-1]]

        # 6. Call LLM
        assistant_content = await llm_service.generate_response(
            prompt=user_message_text,
            context_chunks=relevant_chunks,
            conversation_history=history
        )

        # 7. Save assistant message
        asst_msg = Message(
            id=str(uuid.uuid4()),
            conversation_id=conv.id,
            role="assistant",
            content=assistant_content
        )
        db.add(asst_msg)
        db.commit()
        db.refresh(asst_msg)

        # 8. Record citations / message sources
        # Inspect assistant content for page numbers or match from top retrieved chunks
        sources_to_save: List[SourceCitation] = []
        if relevant_chunks and "I couldn't find sufficient information" not in assistant_content:
            # Identify which pages were cited in the text, e.g. [Page 4]
            cited_pages = set()
            matches = re.findall(r"\[Page\s*(\d+)\]", assistant_content, re.IGNORECASE)
            for m in matches:
                try:
                    cited_pages.add(int(m))
                except ValueError:
                    pass

            for chunk in relevant_chunks:
                # If specific page cited or chunk was relevant
                page_start = chunk.get("page_start", 1)
                is_cited = page_start in cited_pages or not cited_pages
                
                if is_cited:
                    excerpt = chunk.get("content", "").strip()
                    # Truncate excerpt if overly long
                    if len(excerpt) > 300:
                        excerpt = excerpt[:297] + "..."

                    source_record = MessageSource(
                        id=str(uuid.uuid4()),
                        message_id=asst_msg.id,
                        chunk_id=chunk.get("id"),
                        document_id=document_id,
                        page_number=page_start,
                        source_excerpt=excerpt
                    )
                    db.add(source_record)
                    sources_to_save.append(SourceCitation(
                        document_id=document_id,
                        document_title=doc.title,
                        page_number=page_start,
                        source_excerpt=excerpt
                    ))

            db.commit()

        return {
            "conversation_id": conv.id,
            "message": MessageResponse(
                id=asst_msg.id,
                role=asst_msg.role,
                content=asst_msg.content,
                created_at=asst_msg.created_at,
                sources=sources_to_save
            )
        }

chat_service = ChatService()
