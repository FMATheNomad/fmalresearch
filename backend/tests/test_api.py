import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

BASE_URL = "http://test"

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url=BASE_URL) as c:
        yield c


@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "app" in data


@pytest.mark.asyncio
async def test_register_and_login(client):
    email = f"testuser_{__import__('time').time()}@test.com"
    reg = await client.post("/auth/register", json={
        "email": email, "name": "Test", "password": "StrongPass1"
    })
    assert reg.status_code == 200
    token = reg.json().get("access_token")
    assert token is not None

    login = await client.post("/auth/login", json={
        "email": email, "password": "StrongPass1"
    })
    assert login.status_code == 200
    assert login.json().get("access_token") is not None

    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email
    assert me.json()["balance"] >= 5.0


@pytest.mark.asyncio
async def test_register_weak_password(client):
    resp = await client.post("/auth/register", json={
        "email": "weak@test.com", "name": "Weak", "password": "short"
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_duplicate(client):
    resp = await client.post("/auth/register", json={
        "email": "duplicate@test.com", "name": "Dup", "password": "StrongPass1"
    })
    assert resp.status_code == 200
    resp2 = await client.post("/auth/register", json={
        "email": "duplicate@test.com", "name": "Dup", "password": "StrongPass1"
    })
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    resp = await client.post("/auth/login", json={
        "email": "nonexistent@test.com", "password": "wrong"
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_research_flow(client):
    reg = await client.post("/auth/register", json={
        "email": "researchflow@test.com", "name": "Flow", "password": "StrongPass1"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post("/research", json={
        "query": "Apa itu AI?", "mode": "fast"
    }, headers=headers)
    assert create.status_code == 200
    rid = create.json()["id"]
    assert create.json()["cost_estimate"] == 0.05

    get = await client.get(f"/research/{rid}", headers=headers)
    assert get.status_code == 200
    assert get.json()["status"] in ("pending", "running", "completed")


@pytest.mark.asyncio
async def test_research_list(client):
    reg = await client.post("/auth/register", json={
        "email": "researchlist@test.com", "name": "List", "password": "StrongPass1"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/research", json={"query": "Test 1", "mode": "fast"}, headers=headers)
    await client.post("/research", json={"query": "Test 2", "mode": "balanced"}, headers=headers)

    resp = await client.get("/research", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_research_search(client):
    reg = await client.post("/auth/register", json={
        "email": "researchsearch@test.com", "name": "Search", "password": "StrongPass1"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/research", json={"query": "Kecerdasan buatan", "mode": "fast"}, headers=headers)

    resp = await client.get("/research/search?q=Kecerdasan", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) > 0


@pytest.mark.asyncio
async def test_billing_balance(client):
    reg = await client.post("/auth/register", json={
        "email": "billing@test.com", "name": "Bill", "password": "StrongPass1"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/billing/balance", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["balance"] >= 5.0


@pytest.mark.asyncio
async def test_billing_top_up(client):
    reg = await client.post("/auth/register", json={
        "email": "topup@test.com", "name": "Top", "password": "StrongPass1"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/billing/top-up?amount=10", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["added"] == 10.0


@pytest.mark.asyncio
async def test_unauthorized_access(client):
    resp = await client.get("/research")
    assert resp.status_code == 403

    resp = await client.get("/billing/balance")
    assert resp.status_code == 403

    resp = await client.get("/auth/me")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_research_other_user_not_found(client):
    reg1 = await client.post("/auth/register", json={
        "email": "user1@test.com", "name": "U1", "password": "StrongPass1"
    })
    reg2 = await client.post("/auth/register", json={
        "email": "user2@test.com", "name": "U2", "password": "StrongPass1"
    })
    token1 = reg1.json()["access_token"]
    token2 = reg2.json()["access_token"]

    create = await client.post("/research", json={"query": "U1 research", "mode": "fast"},
                               headers={"Authorization": f"Bearer {token1}"})
    rid = create.json()["id"]

    get = await client.get(f"/research/{rid}", headers={"Authorization": f"Bearer {token2}"})
    assert get.status_code == 404
