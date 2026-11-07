import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
# Force mock provider and test sqlite db for tests
settings.LLM_PROVIDER = "mock"
settings.EMBEDDING_PROVIDER = "mock"
settings.DATABASE_URL = "sqlite:///./test_documind.db"
settings.UPLOAD_DIR = "test_uploads"

from app.core.database import Base, get_db
from app.main import app

engine = create_engine("sqlite:///./test_documind.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_documind.db"):
        try:
            os.remove("./test_documind.db")
        except Exception:
            pass

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_pdf_bytes():
    """Generates a small valid PDF document in memory using fitz"""
    import fitz
    doc = fitz.open()
    
    # Page 1
    p1 = doc.new_page()
    p1.insert_text((50, 100), "DocuMind AI Architecture. Chapter 1: Introduction to Document Intelligence.", fontsize=14)
    p1.insert_text((50, 150), "The system ingests PDFs and splits content into page-aware vector chunks.", fontsize=11)
    
    # Page 2
    p2 = doc.new_page()
    p2.insert_text((50, 100), "Chapter 2: Security and Citations.", fontsize=14)
    p2.insert_text((50, 150), "Every answer generated must include verifiable page citations like Page 2.", fontsize=11)

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes
