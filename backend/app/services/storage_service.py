import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageService:
    def __init__(self, base_dir: str = None):
        if base_dir is None:
            if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
                base_dir = "/tmp/uploads"
            else:
                base_dir = settings.UPLOAD_DIR
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(self, file: UploadFile) -> None:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename cannot be empty")
        
        # Check extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext != ".pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Check MIME type
        if file.content_type and "pdf" not in file.content_type.lower() and file.content_type != "application/octet-stream":
            raise HTTPException(status_code=400, detail=f"Invalid content type: {file.content_type}. Expected PDF.")

    def save_upload(self, file: UploadFile, user_id: str) -> tuple[str, str, int]:
        """
        Saves file safely to disk. Returns (storage_path, safe_filename, file_size).
        """
        self.validate_file(file)
        
        user_dir = self.base_dir / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}.pdf"
        target_path = user_dir / safe_filename
        
        # Read and check size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        size = 0
        
        with open(target_path, "wb") as buffer:
            while chunk := file.file.read(1024 * 64):  # 64KB chunks
                size += len(chunk)
                if size > max_bytes:
                    target_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
                    )
                buffer.write(chunk)
        
        # Validate that it starts with %PDF magic header
        is_pdf_header = False
        with open(target_path, "rb") as f:
            header = f.read(5)
            is_pdf_header = header.startswith(b"%PDF-")

        if not is_pdf_header:
            target_path.unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail="File is not a valid PDF document (missing PDF header).")

        return str(target_path), safe_filename, size

    def delete_file(self, storage_path: str) -> None:
        try:
            path = Path(storage_path)
            if path.exists() and path.is_file():
                path.unlink(missing_ok=True)
        except Exception:
            pass

storage_service = StorageService()
