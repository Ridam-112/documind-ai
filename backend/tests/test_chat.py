import asyncio
import pytest
from app.workers.document_processor import process_document_pipeline

def test_chat_with_document_and_citations(client, sample_pdf_bytes):
    reg = client.post("/api/auth/register", json={
        "name": "Chatter",
        "email": "chatter@example.com",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload document
    files = {"file": ("report.pdf", sample_pdf_bytes, "application/pdf")}
    upload_res = client.post("/api/documents/upload", files=files, headers=headers)
    doc_id = upload_res.json()["id"]

    # Process document
    asyncio.run(process_document_pipeline(doc_id))

    # Ask question
    chat_res = client.post(
        f"/api/documents/{doc_id}/chat",
        json={"message": "What is the document about?"},
        headers=headers
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "conversation_id" in chat_data
    conv_id = chat_data["conversation_id"]

    asst_msg = chat_data["message"]
    assert asst_msg["role"] == "assistant"
    assert len(asst_msg["content"]) > 0
    # Citations should be present
    assert len(asst_msg["sources"]) > 0
    source = asst_msg["sources"][0]
    assert source["document_id"] == doc_id
    assert source["page_number"] in [1, 2]
    assert len(source["source_excerpt"]) > 0

    # Test conversation history fetching
    conv_res = client.get(f"/api/conversations/{conv_id}", headers=headers)
    assert conv_res.status_code == 200
    conv_data = conv_res.json()
    assert len(conv_data["messages"]) == 2  # user + assistant

    # Test listing conversations
    list_res = client.get("/api/conversations", headers=headers)
    assert list_res.status_code == 200
    assert any(c["id"] == conv_id for c in list_res.json())

    # Delete conversation
    del_res = client.delete(f"/api/conversations/{conv_id}", headers=headers)
    assert del_res.status_code == 200

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "database" in data
