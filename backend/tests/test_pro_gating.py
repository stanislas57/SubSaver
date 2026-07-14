"""Tests de la garde Premium (get_current_premium_user) et des 3 outils
Espace Pro/BtoB (Extraction comptable, Récupération de TVA, Détection des
frais bancaires) -- cf. app/api/deps.py, app/core/pro_tools.py,
app/api/v1/pro.py.
"""

import uuid

from sqlalchemy import text

from app.db.session import SessionLocal


def _set_premium(user_id: str, premium: bool = True):
    db = SessionLocal()
    db.execute(text("UPDATE users SET is_premium = :premium WHERE id = :id"), {"premium": premium, "id": user_id})
    db.commit()
    db.close()


def _set_bank_connected(user_id: str, connected: bool = True):
    db = SessionLocal()
    db.execute(text("UPDATE users SET bank_connected = :connected WHERE id = :id"), {"connected": connected, "id": user_id})
    db.commit()
    db.close()


def _insert_bank_transaction(user_id: str, wording: str, value: float, date: str = "2026-06-15"):
    db = SessionLocal()
    db.execute(
        text(
            "INSERT INTO bank_transactions (id, user_id, powens_transaction_id, wording, value, date, transaction_type) "
            "VALUES (:id, :user_id, :tx_id, :wording, :value, :date, 'card')"
        ),
        {"id": str(uuid.uuid4()), "user_id": user_id, "tx_id": str(uuid.uuid4()), "wording": wording, "value": value, "date": date},
    )
    db.commit()
    db.close()


class TestPremiumGate:
    """Les 3 endpoints /pro/* doivent bloquer tout compte non-Premium avec un
    402, jamais laisser passer sur la seule foi du frontend."""

    def test_accounting_export_requires_premium(self, client, auth_headers):
        response = client.get("/api/v1/pro/accounting-export", headers=auth_headers)
        assert response.status_code == 402

    def test_vat_recovery_requires_premium(self, client, auth_headers):
        response = client.get("/api/v1/pro/vat-recovery", headers=auth_headers)
        assert response.status_code == 402

    def test_bank_fees_requires_premium(self, client, auth_headers):
        response = client.get("/api/v1/pro/bank-fees", headers=auth_headers)
        assert response.status_code == 402

    def test_pro_endpoints_require_auth(self, client):
        assert client.get("/api/v1/pro/accounting-export").status_code == 401
        assert client.get("/api/v1/pro/vat-recovery").status_code == 401
        assert client.get("/api/v1/pro/bank-fees").status_code == 401


class TestAccountingExport:
    def test_returns_french_formatted_csv(self, client, auth_headers, registered_user):
        _set_premium(registered_user["user_id"])
        client.post(
            "/api/v1/subscriptions",
            headers=auth_headers,
            json={"name": "Netflix", "price": 12.0, "category": "Streaming", "domain": "netflix.com", "billing_day": 5, "importance": 2},
        )

        response = client.get("/api/v1/pro/accounting-export", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/csv")
        body = response.text
        assert "Fournisseur;Catégorie;Montant TTC;Montant HT;TVA (20%)" in body
        # Formatage FR : décimales à la virgule, jamais au point.
        assert "10,00" in body
        assert "2,00" in body
        assert "12,00" not in body.split("\n")[0]  # pas dans l'en-tête


class TestVatRecovery:
    def test_computes_ttc_ht_vat_breakdown(self, client, auth_headers, registered_user):
        _set_premium(registered_user["user_id"])
        client.post(
            "/api/v1/subscriptions",
            headers=auth_headers,
            json={"name": "AWS", "price": 12.0, "category": "Autre", "domain": "aws.amazon.com", "billing_day": 1, "importance": 3},
        )

        response = client.get("/api/v1/pro/vat-recovery", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["vat_rate"] == 0.20
        assert len(data["lines"]) == 1
        line = data["lines"][0]
        assert line["price_ttc"] == 12.0
        assert line["price_ht"] == 10.0
        assert line["vat_amount"] == 2.0
        assert data["total_price_ttc"] == 12.0
        assert data["total_vat_amount"] == 2.0

    def test_empty_when_no_subscriptions(self, client, auth_headers, registered_user):
        _set_premium(registered_user["user_id"])
        response = client.get("/api/v1/pro/vat-recovery", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["lines"] == []
        assert data["total_vat_amount"] == 0.0


class TestBankFeesReport:
    def test_returns_empty_when_bank_not_connected(self, client, auth_headers, registered_user):
        _set_premium(registered_user["user_id"])
        response = client.get("/api/v1/pro/bank-fees", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["bank_connected"] is False
        assert data["fees"] == []

    def test_detects_one_off_incident_fee(self, client, auth_headers, registered_user):
        _set_premium(registered_user["user_id"])
        _set_bank_connected(registered_user["user_id"])
        _insert_bank_transaction(registered_user["user_id"], "COMMISSION D'INTERVENTION", -8.0)

        response = client.get("/api/v1/pro/bank-fees", headers=auth_headers)
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["bank_connected"] is True
        assert data["count"] == 1
        assert data["fees"][0]["label"] == "Commission d'intervention"
        assert data["fees"][0]["amount"] == 8.0
        assert data["total_amount"] == 8.0

    def test_ignores_credits_and_unrelated_debits(self, client, auth_headers, registered_user):
        _set_premium(registered_user["user_id"])
        _set_bank_connected(registered_user["user_id"])
        _insert_bank_transaction(registered_user["user_id"], "VIREMENT SALAIRE", 2000.0)
        _insert_bank_transaction(registered_user["user_id"], "CARREFOUR PARIS", -45.30)

        response = client.get("/api/v1/pro/bank-fees", headers=auth_headers)
        data = response.json()
        assert data["fees"] == []
        assert data["total_amount"] == 0.0
