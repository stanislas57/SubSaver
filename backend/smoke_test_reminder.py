"""Smoke test local pour la relance de paiement Abonnement partagé
(POST /family/debts/remind), sans dépendance à PostgreSQL. Utilise SQLite en
mémoire + TestClient FastAPI ; l'envoi d'e-mail est capturé (SMTP_HOST vide
en dev -> send_email logge au lieu d'envoyer réellement).

Usage: python3 smoke_test_reminder.py
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./smoke_test_reminder.db"
os.environ["ENVIRONMENT"] = "development"
os.environ["SECRET_KEY"] = "smoke-test-secret-not-for-production-use"

import sys

captured_emails = []


def _capture_send_email(to, subject, html_body, reply_to=None):
    print(f"  [EMAIL CAPTURÉ] -> {to} | Sujet: {subject}")
    captured_emails.append({"to": to, "subject": subject, "html_body": html_body})


import app.core.email_service as email_service
email_service.send_email = _capture_send_email

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, engine
from app.models.user import User
from app.models.family_member import FamilyMember
from app.models.subscription import Subscription
from app.models.subscription_split import SubscriptionSplit
from app.models.settlement import Settlement

if os.path.exists("./smoke_test_reminder.db"):
    os.remove("./smoke_test_reminder.db")
# Uniquement les tables nécessaires : market_offers utilise un type Postgres
# ARRAY, incompatible SQLite et hors périmètre de ce test.
Base.metadata.create_all(
    bind=engine,
    tables=[User.__table__, FamilyMember.__table__, Subscription.__table__, SubscriptionSplit.__table__, Settlement.__table__],
)

client = TestClient(app)
results = []


def check(label, condition, extra=""):
    status = "\033[92m✅" if condition else "\033[91m❌"
    print(f"{status} {label}{(' — ' + extra) if extra and not condition else ''}\033[0m")
    results.append(condition)


print("=" * 60)
print("SMOKE TEST — Relance de paiement (Abonnement partagé)")
print("=" * 60)

print("\n[Setup] Inscription + connexion du propriétaire")
client.post("/api/v1/auth/register", json={"email": "owner@example.com", "password": "Test1234!", "first_name": "Alice"})
login = client.post(
    "/api/v1/auth/login",
    data={"username": "owner@example.com", "password": "Test1234!"},
    headers={"Content-Type": "application/x-www-form-urlencoded"},
).json()
headers = {"Authorization": f"Bearer {login['access_token']}"}

print("\n[1] POST /api/v1/family/members (avec email)")
r1 = client.post("/api/v1/family/members", headers=headers, json={"name": "Charles", "email": "charles@example.com"})
check("Statut 201", r1.status_code == 201, str(r1.status_code))
charles_id = r1.json()["id"]

print("\n[2] POST /api/v1/family/members (sans email)")
r2 = client.post("/api/v1/family/members", headers=headers, json={"name": "SansEmail"})
sans_email_id = r2.json()["id"]

print("\n[3] POST /api/v1/subscriptions + partage")
sub = client.post(
    "/api/v1/subscriptions",
    headers=headers,
    json={"name": "Netflix", "price": 5.98, "category": "Streaming", "domain": "netflix.com", "billing_day": 5, "importance": 2},
).json()
client.put("/api/v1/family/shared-subscriptions", headers=headers, json={"subscription_ids": [sub["id"]]})

print("\n[4] GET /api/v1/family/debts")
debts = client.get("/api/v1/family/debts", headers=headers).json()
print(f"  Dettes: {debts}")
check("Au moins une dette générée", len(debts) > 0)

print("\n[5] POST /api/v1/family/debts/remind (Charles, montant valide)")
r5 = client.post("/api/v1/family/debts/remind", headers=headers, json={"member_id": charles_id, "amount": 2.99})
print(f"  Status: {r5.status_code} — {r5.json()}")
check("Statut 200", r5.status_code == 200, str(r5.status_code))
check("Email envoyé à charles@example.com", any(e["to"] == "charles@example.com" for e in captured_emails))
if captured_emails:
    check("Montant formaté présent dans l'email", "2,99 €" in captured_emails[-1]["html_body"])
    check("Sujet mentionne le montant", "2,99" in captured_emails[-1]["subject"])

print("\n[6] POST /api/v1/family/debts/remind (membre sans email -> 400)")
r6 = client.post("/api/v1/family/debts/remind", headers=headers, json={"member_id": sans_email_id, "amount": 1.0})
print(f"  Status: {r6.status_code} — {r6.json()}")
check("Rejet 400 (pas d'email)", r6.status_code == 400, str(r6.status_code))

print("\n[7] POST /api/v1/family/debts/remind (membre introuvable -> 404)")
r7 = client.post("/api/v1/family/debts/remind", headers=headers, json={"member_id": "nope", "amount": 1.0})
check("Rejet 404 (membre introuvable)", r7.status_code == 404, str(r7.status_code))

print("\n[8] POST /api/v1/family/debts/remind (montant négatif -> 400)")
r8 = client.post("/api/v1/family/debts/remind", headers=headers, json={"member_id": charles_id, "amount": -5})
check("Rejet 400 (montant négatif)", r8.status_code == 400, str(r8.status_code))

print("\n[9] POST /api/v1/family/debts/remind (relance à soi-même -> 400)")
group = client.get("/api/v1/family/group", headers=headers).json()
owner_id = next(m["id"] for m in group["members"] if m["is_owner"])
r9 = client.post("/api/v1/family/debts/remind", headers=headers, json={"member_id": owner_id, "amount": 1.0})
check("Rejet 400 (auto-relance)", r9.status_code == 400, str(r9.status_code))

if os.path.exists("./smoke_test_reminder.db"):
    os.remove("./smoke_test_reminder.db")

print("\n" + "=" * 60)
total = len(results)
passed = sum(results)
print(f"RÉSULTAT : {passed}/{total} assertions passées")
print("=" * 60)
sys.exit(0 if passed == total else 1)
