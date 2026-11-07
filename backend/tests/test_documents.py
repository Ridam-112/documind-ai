import io
import pytest
from app.workers.document_processor import process_document_pipeline

def test_upload_and_process_pdf(client, sample_pdf_bytes):
    # Register and get auth token
    reg = client.post("/api/auth/register", json={
        "name": "Doc Uploader",
        "email": "uploader@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload valid PDF
    files = {"file": ("sample.pdf", sample_pdf_bytes, "application/pdf")}
    upload_res = client.post("/api/documents/upload", files=files, headers=headers)
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    assert doc_data["title"] == "sample.pdf"

    # Run processing pipeline synchronously to test completion
    import asyncio
    asyncio.run(process_document_pipeline(doc_id))

    # Check status is ready
    status_res = client.get(f"/api/documents/{doc_id}/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["processing_status"] == "ready"
    assert status_data["page_count"] == 2

    # Verify page text endpoint
    page1_res = client.get(f"/api/documents/{doc_id}/pages/1", headers=headers)
    assert page1_res.status_code == 200
    assert "DocuMind AI Architecture" in page1_res.json()["extracted_text"]

    page2_res = client.get(f"/api/documents/{doc_id}/pages/2", headers=headers)
    assert page2_res.status_code == 200
    assert "Chapter 2: Security and Citations" in page2_res.json()["extracted_text"]

def test_invalid_file_type_rejected(client):
    reg = client.post("/api/auth/register", json={
        "name": "Malicious User",
        "email": "baduser@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try uploading a text file
    files = {"file": ("malicious.txt", b"plain text", "text/plain")}
    res = client.post("/api/documents/upload", files=files, headers=headers)
    assert res.status_code == 400

    # Try uploading fake pdf with wrong header
    files = {"file": ("fake.pdf", b"not a real pdf content", "application/pdf")}
    res = client.post("/api/documents/upload", files=files, headers=headers)
    assert res.status_code == 400

def test_multi_tenant_isolation(client, sample_pdf_bytes):
    # User 1 uploads a doc
    reg1 = client.post("/api/auth/register", json={
        "name": "User One",
        "email": "user1@example.com",
        "password": "Password123!"
    })
    token1 = reg1.json()["access_token"]

    files = {"file": ("secret.pdf", sample_pdf_bytes, "application/pdf")}
    upload_res = client.post("/api/documents/upload", files=files, headers={"Authorization": f"Bearer {token1}"})
    doc_id = upload_res.json()["id"]

    # User 2 logs in and tries to access User 1's doc
    reg2 = client.post("/api/auth/register", json={
        "name": "User Two",
        "email": "user2@example.com",
        "password": "Password123!"
    })
    token2 = reg2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 cannot get doc details
    res_get = client.get(f"/api/documents/{doc_id}", headers=headers2)
    assert res_get.status_code == 404

    # User 2 cannot see it in doc list
    res_list = client.get("/api/documents", headers=headers2)
    docs_user2 = res_list.json()
    assert not any(d["id"] == doc_id for d in docs_user2)

    # User 2 cannot delete it
    res_del = client.delete(f"/api/documents/{doc_id}", headers=headers2)
    assert res_del.status_code == 404
