import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db.session import Base, SessionLocal, engine
from app.main import app
from app.models.user import User


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def _clean_db():
    """Vide les tables entre chaque test pour garantir l'isolation."""
    yield
    db = SessionLocal()
    db.execute(text("TRUNCATE TABLE bank_transactions, subscriptions, family_members, users CASCADE"))
    db.commit()
    db.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    """Crée un utilisateur de test, passe l'étape de vérification email (le code
    est lu directement en base, un vrai email n'est jamais envoyé en test),
    et renvoie (token, user_id, email)."""
    email = f"e2e-{uuid.uuid4().hex[:10]}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Test1234!", "first_name": "E2E"},
    )
    assert response.status_code == 201, response.text

    db = SessionLocal()
    code = db.query(User).filter(User.email == email).first().verification_code
    db.close()

    verify_response = client.post("/api/v1/auth/verify-email", json={"email": email, "code": code})
    assert verify_response.status_code == 200, verify_response.text
    data = verify_response.json()
    return {"token": data["access_token"], "user_id": data["user"]["id"], "email": email}


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}
