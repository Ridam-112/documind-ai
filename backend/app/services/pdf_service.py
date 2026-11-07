import logging
import re
from typing import List, Dict, Any

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except Exception:
    PYMUPDF_AVAILABLE = False
    fitz = None

try:
    import pypdf
    PYPDF_AVAILABLE = True
except Exception:
    PYPDF_AVAILABLE = False
    pypdf = None

logger = logging.getLogger(__name__)

class PdfExtractionError(Exception):
    pass

def clean_extracted_text(text: str) -> str:
    """
    Cleans raw PDF text:
    - fixes ligatures (fi, fl, ffi)
    - replaces private-use unicode bullets/icons
    - separates numbered items & headings with proper linebreaks
    """
    if not text:
        return ""

    replacements = {
        '\uf071': '⚠️ ',
        '\uf0b7': '• ',
        '\uf00c': '✓ ',
        '\uf0ae': '→ ',
        '\uf005': '• ',
        '\uf002': '• ',
        '\uf084': '• ',
        '\uf303': '📝 ',
        '\uf111': '• ',
        '▮': '\n\n',
        'õnd': 'find',
        'õrst': 'first',
        'õ': 'fi',
        'Ý': 'fi',
        '\u200b': '',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)

    # Clean bullet glyphs
    text = re.sub(r'[\u25a0\u25ae\u25af\u2588]', '\n\n', text)

    # Ensure headings and numbered lists have paragraph separation
    text = re.sub(r'(\n|^)(\d+\.\s+)', r'\n\n\2', text)
    text = re.sub(r'(\n|^)([A-Z]\.\s+)', r'\n\n\2', text)
    text = re.sub(r'(\n|^)([•\-\*]\s+)', r'\n\n\2', text)

    # Clean runs of blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

class PdfService:
    def extract_text(self, file_path: str) -> Dict[str, Any]:
        if PYMUPDF_AVAILABLE and fitz is not None:
            try:
                return self._extract_with_fitz(file_path)
            except Exception as e:
                logger.warning(f"PyMuPDF failed, falling back to pypdf: {e}")

        if PYPDF_AVAILABLE and pypdf is not None:
            return self._extract_with_pypdf(file_path)

        raise PdfExtractionError("No PDF extraction library available (neither PyMuPDF nor pypdf).")

    def _extract_with_fitz(self, file_path: str) -> Dict[str, Any]:
        try:
            doc = fitz.open(file_path)
        except Exception as e:
            logger.error(f"Failed to open PDF at {file_path}: {e}")
            raise PdfExtractionError(f"Failed to open PDF document: {str(e)}")

        try:
            if doc.is_encrypted:
                unlocked = doc.authenticate("")
                if not unlocked:
                    raise PdfExtractionError("PDF is password-protected and cannot be read.")

            page_count = len(doc)
            if page_count == 0:
                raise PdfExtractionError("The uploaded PDF contains 0 pages.")

            pages_data: List[Dict[str, Any]] = []
            total_extracted_chars = 0

            for i in range(page_count):
                page_num = i + 1
                try:
                    page = doc.load_page(i)
                    raw_text = page.get_text("text")
                    cleaned = clean_extracted_text(raw_text)

                    pages_data.append({
                        "page_number": page_num,
                        "text": cleaned
                    })
                    total_extracted_chars += len(cleaned)
                except Exception as page_err:
                    logger.warning(f"Failed to extract text from page {page_num}: {page_err}")
                    pages_data.append({
                        "page_number": page_num,
                        "text": ""
                    })

            metadata = {
                "title": doc.metadata.get("title") or "",
                "author": doc.metadata.get("author") or "",
                "page_count": page_count,
                "total_chars": total_extracted_chars,
            }

            return {
                "page_count": page_count,
                "pages": pages_data,
                "metadata": metadata
            }
        finally:
            doc.close()

    def _extract_with_pypdf(self, file_path: str) -> Dict[str, Any]:
        try:
            reader = pypdf.PdfReader(file_path)
            page_count = len(reader.pages)
            if page_count == 0:
                raise PdfExtractionError("The uploaded PDF contains 0 pages.")

            pages_data: List[Dict[str, Any]] = []
            total_extracted_chars = 0

            for i, page in enumerate(reader.pages):
                page_num = i + 1
                try:
                    raw_text = page.extract_text() or ""
                    cleaned = clean_extracted_text(raw_text)
                    pages_data.append({
                        "page_number": page_num,
                        "text": cleaned
                    })
                    total_extracted_chars += len(cleaned)
                except Exception as page_err:
                    logger.warning(f"Failed to extract page {page_num} with pypdf: {page_err}")
                    pages_data.append({
                        "page_number": page_num,
                        "text": ""
                    })

            meta = reader.metadata or {}
            metadata = {
                "title": getattr(meta, "title", "") or "",
                "author": getattr(meta, "author", "") or "",
                "page_count": page_count,
                "total_chars": total_extracted_chars,
            }
            return {
                "page_count": page_count,
                "pages": pages_data,
                "metadata": metadata
            }
        except Exception as e:
            raise PdfExtractionError(f"Failed to extract PDF with pypdf: {str(e)}")


pdf_service = PdfService()
