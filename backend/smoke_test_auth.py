"""Smoke test local pour le flux d'inscription simplifié (sans vérification),
sans dépendance à PostgreSQL. Utilise SQLite en mémoire + TestClient FastAPI.

Usage: python3 smoke_test_auth.py
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./smoke_test_auth.db"
os.environ["ENVIRONMENT"] = "development"
os.environ["SECRET_KEY"] = "smoke-test-secret-not-for-production-use"

import sys

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, engine
from app.models.user import User

if os.path.exists("./smoke_test_auth.db"):
    os.remove("./smoke_test_auth.db")
Base.metadata.create_all(bind=engine, tables=[User.__table__])

client = TestClient(app)

results = []


def check(label, condition, extra=""):
    status = "\033[92m✅" if condition else "\033[91m❌"
    print(f"{status} {label}{(' - ' + extra) if extra and not condition else ''}\033[0m")
    results.append(condition)


print("=" * 60)
print("SMOKE TEST - Inscription simplifiée (sans vérification)")
print("=" * 60)

print("\n[1] POST /api/v1/auth/register")
r = client.post(
    "/api/v1/auth/register",
    json={"email": "smoketest@example.com", "password": "SecureP@ss123", "first_name": "Jean"},
)
print(f"  Status: {r.status_code} - {r.json()}")
check("Statut 201 Created", r.status_code == 201, str(r.status_code))
check("Message de succès renvoyé", "message" in r.json())

print("\n[2] POST /api/v1/auth/login (immédiatement après inscription, sans vérification)")
r2 = client.post(
    "/api/v1/auth/login",
    data={"username": "smoketest@example.com", "password": "SecureP@ss123"},
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
print(f"  Status: {r2.status_code}")
check("Login réussi sans étape de vérification", r2.status_code == 200, str(r2.status_code))
auth_body = r2.json()
check("access_token présent", bool(auth_body.get("access_token")))
access_token = auth_body.get("access_token", "")

print("\n[3] GET /api/v1/users/me (avec token)")
r3 = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"})
print(f"  Status: {r3.status_code} - {r3.json()}")
check("Statut 200 OK", r3.status_code == 200, str(r3.status_code))
check("Email correspond", r3.json().get("email") == "smoketest@example.com")

print("\n[4] POST /api/v1/auth/register (email dupliqué)")
r4 = client.post(
    "/api/v1/auth/register",
    json={"email": "smoketest@example.com", "password": "SecureP@ss123", "first_name": "Autre"},
)
print(f"  Status: {r4.status_code} - {r4.json()}")
check("Rejet 400 pour email dupliqué", r4.status_code == 400, str(r4.status_code))

print("\n[5] POST /api/v1/auth/login (mauvais mot de passe)")
r5 = client.post(
    "/api/v1/auth/login",
    data={"username": "smoketest@example.com", "password": "wrong"},
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
print(f"  Status: {r5.status_code}")
check("Rejet 401 pour mot de passe incorrect", r5.status_code == 401, str(r5.status_code))

if os.path.exists("./smoke_test_auth.db"):
    os.remove("./smoke_test_auth.db")

print("\n" + "=" * 60)
total = len(results)
passed = sum(results)
print(f"RÉSULTAT : {passed}/{total} assertions passées")
print("=" * 60)

sys.exit(0 if passed == total else 1)
