import logging
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import tiktoken
    encoder = tiktoken.get_encoding("cl100k_base")
except Exception:
    encoder = None

def count_tokens(text: str) -> int:
    if encoder:
        try:
            return len(encoder.encode(text))
        except Exception:
            pass
    # Approximate 1 token = 4 characters
    return max(1, len(text) // 4)

class ChunkingService:
    def __init__(
        self,
        chunk_size_tokens: int = settings.CHUNK_SIZE_TOKENS,
        chunk_overlap_tokens: int = settings.CHUNK_OVERLAP_TOKENS,
    ):
        self.chunk_size_tokens = chunk_size_tokens
        self.chunk_overlap_tokens = chunk_overlap_tokens

    def chunk_document_pages(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes page objects with page_number and text, and yields chunks
        preserving exact page start and end.
        """
        chunks: List[Dict[str, Any]] = []
        chunk_index = 0

        for page in pages:
            page_num = page["page_number"]
            text = (page.get("text") or "").strip()
            if not text:
                continue

            page_tokens = count_tokens(text)

            # If page fits in a chunk, keep it as single page chunk
            if page_tokens <= self.chunk_size_tokens:
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_start": page_num,
                    "page_end": page_num,
                    "content": text,
                    "token_count": page_tokens
                })
                chunk_index += 1
            else:
                # Split large page into overlapping windows
                paragraphs = text.split("\n\n")
                current_chunk_parts = []
                current_tokens = 0

                for para in paragraphs:
                    para = para.strip()
                    if not para:
                        continue
                    para_tokens = count_tokens(para)

                    if current_tokens + para_tokens > self.chunk_size_tokens and current_chunk_parts:
                        chunk_text = "\n\n".join(current_chunk_parts)
                        chunks.append({
                            "chunk_index": chunk_index,
                            "page_start": page_num,
                            "page_end": page_num,
                            "content": chunk_text,
                            "token_count": current_tokens
                        })
                        chunk_index += 1

                        # Keep overlap from end
                        overlap_parts = []
                        overlap_tokens = 0
                        for part in reversed(current_chunk_parts):
                            p_tok = count_tokens(part)
                            if overlap_tokens + p_tok <= self.chunk_overlap_tokens:
                                overlap_parts.insert(0, part)
                                overlap_tokens += p_tok
                            else:
                                break
                        current_chunk_parts = overlap_parts
                        current_tokens = overlap_tokens

                    current_chunk_parts.append(para)
                    current_tokens += para_tokens

                if current_chunk_parts:
                    chunk_text = "\n\n".join(current_chunk_parts)
                    chunks.append({
                        "chunk_index": chunk_index,
                        "page_start": page_num,
                        "page_end": page_num,
                        "content": chunk_text,
                        "token_count": current_tokens
                    })
                    chunk_index += 1

        return chunks

chunking_service = ChunkingService()
