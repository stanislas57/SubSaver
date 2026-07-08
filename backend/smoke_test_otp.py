"""Smoke test local pour le flux OTP complet, sans dépendance à PostgreSQL.

Utilise SQLite en mémoire + TestClient FastAPI pour valider bout-en-bout :
inscription -> génération OTP -> vérification -> JWT -> /users/me.

Usage: python3 smoke_test_otp.py
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./smoke_test.db"
os.environ["SMS_PROVIDER"] = "dev"
os.environ["ENVIRONMENT"] = "development"
os.environ["SECRET_KEY"] = "smoke-test-secret-key-not-for-production-use"

import re
import sys

captured_otp = {}


def _capture_send_otp_sms(phone, otp_code):
    print(f"  [SMS CAPTURÉ] -> {phone}: {otp_code}")
    captured_otp["code"] = otp_code


# Patch AVANT d'importer app.main (qui importe les routes -> sms_service)
import app.core.sms_service as sms_service
sms_service.send_otp_sms = _capture_send_otp_sms

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, engine
from app.models.user import User

# Nettoyage puis création du schéma SQLite (uniquement la table users : les
# autres modèles utilisent des types Postgres-only comme ARRAY, incompatibles
# SQLite et hors périmètre de ce smoke test OTP).
if os.path.exists("./smoke_test.db"):
    os.remove("./smoke_test.db")
Base.metadata.create_all(bind=engine, tables=[User.__table__])

client = TestClient(app)

PASS = "\033[92m✅"
FAIL = "\033[91m❌"
END = "\033[0m"

results = []


def check(label, condition, extra=""):
    status = f"{PASS}" if condition else f"{FAIL}"
    print(f"{status} {label}{(' — ' + extra) if extra and not condition else ''}{END}")
    results.append(condition)
    return condition


print("=" * 60)
print("SMOKE TEST — Flux OTP complet (SQLite in-memory)")
print("=" * 60)

# ---------------------------------------------------------------------------
# Test 1 : Inscription
# ---------------------------------------------------------------------------
print("\n[1] POST /api/v1/auth/register")
r = client.post(
    "/api/v1/auth/register",
    json={
        "email": "smoketest@example.com",
        "password": "SecureP@ss123",
        "first_name": "Jean",
        "phone": "+33612345678",
    },
)
print(f"  Status: {r.status_code}")
print(f"  Body: {r.json()}")
check("Statut 201 Created", r.status_code == 201, str(r.status_code))
body = r.json()
check("phone_masked présent", "phone_masked" in body)
check("phone_masked masque le numéro", body.get("phone_masked", "").startswith("+33"))
check("attempts_remaining == 3", body.get("attempts_remaining") == 3, str(body.get("attempts_remaining")))
check("Code OTP capturé depuis le service SMS", "code" in captured_otp)
otp_code = captured_otp.get("code", "000000")
check("Code OTP fait 6 chiffres", bool(re.match(r"^\d{6}$", otp_code)), otp_code)

# ---------------------------------------------------------------------------
# Test 2 : Email déjà utilisé
# ---------------------------------------------------------------------------
print("\n[2] POST /api/v1/auth/register (email dupliqué)")
r2 = client.post(
    "/api/v1/auth/register",
    json={
        "email": "smoketest@example.com",
        "password": "SecureP@ss123",
        "first_name": "Autre",
        "phone": "+33698765432",
    },
)
print(f"  Status: {r2.status_code} — {r2.json()}")
check("Rejet 400 pour email dupliqué", r2.status_code == 400, str(r2.status_code))

# ---------------------------------------------------------------------------
# Test 3 : Téléphone invalide
# ---------------------------------------------------------------------------
print("\n[3] POST /api/v1/auth/register (téléphone invalide)")
r3 = client.post(
    "/api/v1/auth/register",
    json={
        "email": "autretest@example.com",
        "password": "SecureP@ss123",
        "first_name": "Test",
        "phone": "0612345678",  # sans indicatif international
    },
)
print(f"  Status: {r3.status_code}")
check("Rejet 422 pour format téléphone invalide", r3.status_code == 422, str(r3.status_code))

# ---------------------------------------------------------------------------
# Test 4 : Vérification OTP avec mauvais code
# ---------------------------------------------------------------------------
print("\n[4] POST /api/v1/auth/verify-otp (code invalide)")
r4 = client.post(
    "/api/v1/auth/verify-otp",
    json={
        "email": "smoketest@example.com",
        "phone": "+33612345678",
        "otp_code": "000000",
    },
)
print(f"  Status: {r4.status_code} — {r4.json()}")
check("Rejet 400 pour code invalide", r4.status_code == 400, str(r4.status_code))
check("Message mentionne tentatives restantes", "tentative" in r4.json().get("detail", "").lower())

# ---------------------------------------------------------------------------
# Test 5 : Vérification OTP avec le bon code
# ---------------------------------------------------------------------------
print("\n[5] POST /api/v1/auth/verify-otp (code correct)")
r5 = client.post(
    "/api/v1/auth/verify-otp",
    json={
        "email": "smoketest@example.com",
        "phone": "+33612345678",
        "otp_code": otp_code,
    },
)
print(f"  Status: {r5.status_code}")
print(f"  Body: {r5.json()}")
check("Statut 200 OK", r5.status_code == 200, str(r5.status_code))
auth_body = r5.json()
check("access_token présent", bool(auth_body.get("access_token")))
check("user.phone == numéro inscrit", auth_body.get("user", {}).get("phone") == "+33612345678")
check("user.email correct", auth_body.get("user", {}).get("email") == "smoketest@example.com")
access_token = auth_body.get("access_token", "")

# ---------------------------------------------------------------------------
# Test 6 : Réutilisation du code déjà consommé
# ---------------------------------------------------------------------------
print("\n[6] POST /api/v1/auth/verify-otp (réutilisation du code consommé)")
r6 = client.post(
    "/api/v1/auth/verify-otp",
    json={
        "email": "smoketest@example.com",
        "phone": "+33612345678",
        "otp_code": otp_code,
    },
)
print(f"  Status: {r6.status_code} — {r6.json()}")
check("Rejet 400 (code déjà consommé)", r6.status_code == 400, str(r6.status_code))

# ---------------------------------------------------------------------------
# Test 7 : Accès à /users/me avec le token JWT obtenu
# ---------------------------------------------------------------------------
print("\n[7] GET /api/v1/users/me (avec token)")
r7 = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"})
print(f"  Status: {r7.status_code} — {r7.json()}")
check("Statut 200 OK", r7.status_code == 200, str(r7.status_code))
check("Email correspond à l'utilisateur créé", r7.json().get("email") == "smoketest@example.com")

# ---------------------------------------------------------------------------
# Test 8 : Login classique fonctionne toujours (non-régression)
# ---------------------------------------------------------------------------
print("\n[8] POST /api/v1/auth/login (non-régression)")
r8 = client.post(
    "/api/v1/auth/login",
    data={"username": "smoketest@example.com", "password": "SecureP@ss123"},
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
print(f"  Status: {r8.status_code}")
check("Login fonctionne après vérification OTP", r8.status_code == 200, str(r8.status_code))

# ---------------------------------------------------------------------------
# Test 9 : Trop de tentatives -> lockout
# ---------------------------------------------------------------------------
print("\n[9] Test lockout après 3 tentatives échouées (nouvel utilisateur)")
client.post(
    "/api/v1/auth/register",
    json={
        "email": "lockout@example.com",
        "password": "SecureP@ss123",
        "first_name": "Lockout",
        "phone": "+33611112222",
    },
)
last_status = None
for i in range(4):
    r_attempt = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": "lockout@example.com", "phone": "+33611112222", "otp_code": "999999"},
    )
    last_status = r_attempt.status_code
    print(f"  Tentative {i+1}: status={r_attempt.status_code} — {r_attempt.json().get('detail')}")
check("4e tentative renvoie 429 (lockout)", last_status == 429, str(last_status))

# ---------------------------------------------------------------------------
# Test 10 : Resend OTP réinitialise le compteur
# ---------------------------------------------------------------------------
print("\n[10] POST /api/v1/auth/resend-otp après lockout")
r10 = client.post("/api/v1/auth/resend-otp", json={"email": "lockout@example.com"})
print(f"  Status: {r10.status_code} — {r10.json()}")
check("Resend OTP renvoie 200", r10.status_code == 200, str(r10.status_code))
new_code = captured_otp.get("code")
r10b = client.post(
    "/api/v1/auth/verify-otp",
    json={"email": "lockout@example.com", "phone": "+33611112222", "otp_code": new_code},
)
print(f"  Vérif avec nouveau code: status={r10b.status_code}")
check("Nouveau code accepté après resend", r10b.status_code == 200, str(r10b.status_code))

# ---------------------------------------------------------------------------
# Nettoyage + résumé
# ---------------------------------------------------------------------------
if os.path.exists("./smoke_test.db"):
    os.remove("./smoke_test.db")

print("\n" + "=" * 60)
total = len(results)
passed = sum(results)
print(f"RÉSULTAT : {passed}/{total} assertions passées")
print("=" * 60)

sys.exit(0 if passed == total else 1)
