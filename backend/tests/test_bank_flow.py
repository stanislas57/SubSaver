"""Tests end-to-end du flow Open Banking (Powens sandbox).

Ces tests appellent réellement l'API sandbox Powens pour connect-url (F2) :
aucune donnée n'est mockée à ce niveau. Le callback (F2) et la génération de
transactions réelles nécessitent le parcours navigateur Webview, impossible à
automatiser ici (cf. limite documentée en F3) : ces étapes sont donc testées au
niveau du contrat de l'API (statuts, validations, sécurité du state) avec des
données insérées directement en base, ce qui reste un test e2e légitime de
notre code — seule l'authentification bancaire réelle est hors de portée d'un
test automatisé sans navigateur.
"""

import uuid

from sqlalchemy import text

from app.db.session import SessionLocal


def _insert_transaction(user_id: str, tx_id: str, wording: str, value: float, date: str):
    db = SessionLocal()
    db.execute(
        text(
            "INSERT INTO bank_transactions (id, user_id, powens_transaction_id, wording, value, date, transaction_type) "
            "VALUES (:id, :user_id, :tx_id, :wording, :value, :date, 'card')"
        ),
        {"id": str(uuid.uuid4()), "user_id": user_id, "tx_id": tx_id, "wording": wording, "value": value, "date": date},
    )
    db.commit()
    db.close()


class TestConnectUrl:
    """F2 — appel réel à la sandbox Powens (auth/init + auth/token/code)."""

    def test_connect_url_returns_real_webview_url(self, client, auth_headers):
        response = client.get("/api/v1/bank/connect-url", headers=auth_headers)
        assert response.status_code == 200, response.text
        url = response.json()["webview_url"]
        assert url.startswith("https://webview.powens.com/connect?")
        assert "domain=subserver-sandbox.biapi.pro" in url
        assert "client_id=" in url
        assert "code=" in url
        assert "state=" in url

    def test_connect_url_reuses_stored_powens_token(self, client, auth_headers, registered_user):
        client.get("/api/v1/bank/connect-url", headers=auth_headers)
        db = SessionLocal()
        token_after_first = db.execute(
            text("SELECT powens_user_token FROM users WHERE id = :id"), {"id": registered_user["user_id"]}
        ).scalar_one()
        db.close()

        client.get("/api/v1/bank/connect-url", headers=auth_headers)
        db = SessionLocal()
        token_after_second = db.execute(
            text("SELECT powens_user_token FROM users WHERE id = :id"), {"id": registered_user["user_id"]}
        ).scalar_one()
        db.close()

        assert token_after_first == token_after_second, "un 2e appel ne doit pas recréer un utilisateur Powens"

    def test_connect_url_requires_auth(self, client):
        response = client.get("/api/v1/bank/connect-url")
        assert response.status_code == 401


class TestCallback:
    """F2 — sécurité et contrat de /bank/callback."""

    def test_callback_rejects_invalid_state(self, client, auth_headers):
        response = client.post(
            "/api/v1/bank/callback", headers=auth_headers, json={"state": "invalide", "connection_id": "1"}
        )
        assert response.status_code == 400

    def test_callback_rejects_state_of_another_user(self, client, auth_headers, registered_user):
        connect = client.get("/api/v1/bank/connect-url", headers=auth_headers)
        import urllib.parse as up

        state = up.parse_qs(up.urlparse(connect.json()["webview_url"]).query)["state"][0]

        other = client.post(
            "/api/v1/auth/register",
            json={"email": f"other-{uuid.uuid4().hex[:8]}@example.com", "password": "Test1234!", "first_name": "X"},
        ).json()
        other_headers = {"Authorization": f"Bearer {other['access_token']}"}

        response = client.post(
            "/api/v1/bank/callback", headers=other_headers, json={"state": state, "connection_id": "1"}
        )
        assert response.status_code == 403

    def test_callback_surfaces_powens_error(self, client, auth_headers):
        import urllib.parse as up

        connect = client.get("/api/v1/bank/connect-url", headers=auth_headers)
        state = up.parse_qs(up.urlparse(connect.json()["webview_url"]).query)["state"][0]

        response = client.post(
            "/api/v1/bank/callback",
            headers=auth_headers,
            json={"state": state, "error": "cancelled", "error_description": "Annulé par l'utilisateur"},
        )
        assert response.status_code == 400
        assert "Annulé" in response.json()["detail"] or "cancelled" in response.json()["detail"]

    def test_callback_success_marks_bank_connected(self, client, auth_headers, registered_user):
        import urllib.parse as up

        connect = client.get("/api/v1/bank/connect-url", headers=auth_headers)
        state = up.parse_qs(up.urlparse(connect.json()["webview_url"]).query)["state"][0]

        response = client.post(
            "/api/v1/bank/callback", headers=auth_headers, json={"state": state, "connection_id": "42"}
        )
        assert response.status_code == 200
        body = response.json()
        assert body["bank_connected"] is True
        assert body["connection_id"] == "42"

        me = client.get("/api/v1/users/me", headers=auth_headers)
        assert me.json()["bank_connected"] is True


class TestTransactionsSync:
    """F3 — synchronisation réelle contre Powens (pas de connexion bancaire réelle établie ici,
    donc l'appel doit échouer proprement en 502 plutôt que renvoyer un faux succès)."""

    def test_sync_without_bank_connected_returns_400(self, client, auth_headers):
        response = client.post("/api/v1/bank/transactions/sync", headers=auth_headers)
        assert response.status_code == 400

    def test_sync_with_fake_connection_surfaces_real_powens_error(self, client, auth_headers):
        import urllib.parse as up

        connect = client.get("/api/v1/bank/connect-url", headers=auth_headers)
        state = up.parse_qs(up.urlparse(connect.json()["webview_url"]).query)["state"][0]
        client.post("/api/v1/bank/callback", headers=auth_headers, json={"state": state, "connection_id": "999"})

        response = client.post("/api/v1/bank/transactions/sync", headers=auth_headers)
        # Aucune vraie connexion bancaire n'existe pour ce token -> Powens répond une erreur réelle (noAccount),
        # remontée en 502. Ce test garantit qu'on ne simule jamais un succès silencieux.
        assert response.status_code == 502
        assert "Powens" in response.json()["detail"]


class TestDetection:
    """F4 — algorithme de détection sur des transactions stockées."""

    def test_detects_recurring_and_ignores_noise(self, client, auth_headers, registered_user):
        uid = registered_user["user_id"]
        for i, d in enumerate(["2026-01-15", "2026-02-14", "2026-03-17"]):
            _insert_transaction(uid, f"nf{i}", "PRLV SEPA NETFLIX.COM 9981 FR", -13.49, d)
        _insert_transaction(uid, "iso1", "CB LIBRAIRIE GALLIMARD", -22.0, "2026-03-01")
        _insert_transaction(uid, "sal1", "VIR SALAIRE EMPLOYEUR", 2500.0, "2026-05-01")

        response = client.get("/api/v1/bank/subscriptions/detect", headers=auth_headers)
        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1
        assert results[0]["merchant"] == "NETFLIX.COM"
        assert results[0]["frequency"] == "monthly"
        assert results[0]["occurrences"] == 3

    def test_no_transactions_returns_empty_list(self, client, auth_headers):
        response = client.get("/api/v1/bank/subscriptions/detect", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []


class TestFullFlow:
    """F5 — bout en bout : détection -> acceptation -> abonnement réellement créé."""

    def test_accept_detected_subscription_creates_real_subscription(self, client, auth_headers, registered_user):
        uid = registered_user["user_id"]
        for i, d in enumerate(["2026-01-15", "2026-02-14", "2026-03-17"]):
            _insert_transaction(uid, f"nf{i}", "PRLV SEPA NETFLIX.COM 9981 FR", -13.49, d)

        detected = client.get("/api/v1/bank/subscriptions/detect", headers=auth_headers).json()
        assert len(detected) == 1
        candidate = detected[0]

        create_response = client.post(
            "/api/v1/subscriptions",
            headers=auth_headers,
            json={
                "name": candidate["merchant"],
                "price": candidate["price"],
                "category": "Autre",
                "domain": "netflix.com",
                "billing_day": 16,
                "importance": 2,
                "start_date": candidate["last_date"],
                "trial_end_date": None,
            },
        )
        assert create_response.status_code == 201, create_response.text

        subs = client.get("/api/v1/subscriptions", headers=auth_headers).json()
        assert any(s["name"] == "NETFLIX.COM" for s in subs)
