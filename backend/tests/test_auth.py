import pytest

def test_register_and_login(client):
    # Register user
    reg_res = client.post("/api/auth/register", json={
        "name": "Alice Tester",
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"

    # Duplicate registration fails
    dup_res = client.post("/api/auth/register", json={
        "name": "Alice Tester",
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert dup_res.status_code == 400

    # Login with valid credentials
    login_res = client.post("/api/auth/login", json={
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Access /api/auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alice@example.com"

def test_unauthenticated_access_denied(client):
    # Protected endpoint without token should return 401
    res = client.get("/api/documents")
    assert res.status_code == 401

def test_invalid_login(client):
    res = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
