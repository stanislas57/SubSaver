"""Client Powens (Open Banking, Bank API) - flux Webview (mode redirect).

Ce module implémente uniquement les 2 premiers appels du protocole Powens :
1. /auth/init      : crée un token utilisateur permanent (1 utilisateur SubSaver = 1 utilisateur Powens)
2. /auth/token/code: échange le token permanent contre un code temporaire à usage unique,
   nécessaire pour ouvrir la Webview en toute sécurité.

Référence : https://docs.powens.com/documentation/integration-guides/quick-start/add-a-first-user-and-connection
"""

import httpx

from app.core.config import settings


class PowensError(Exception):
    """Levée si l'API Powens répond en erreur."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def _base_url() -> str:
    return f"https://{settings.POWENS_DOMAIN}/2.0"


async def init_user_token() -> str:
    """Crée un nouvel utilisateur Powens et retourne son token d'accès permanent.

    À appeler une seule fois par utilisateur SubSaver (au premier lien bancaire),
    puis le token doit être stocké (User.powens_user_token) et réutilisé.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{_base_url()}/auth/init",
            json={
                "client_id": settings.POWENS_CLIENT_ID,
                "client_secret": settings.POWENS_CLIENT_SECRET,
            },
        )
    if response.status_code != 200:
        raise PowensError(f"Échec auth/init Powens : {response.text}", response.status_code)
    data = response.json()
    token = data.get("auth_token")
    if not token:
        raise PowensError("Réponse Powens auth/init sans auth_token")
    return token


async def get_temporary_code(user_token: str) -> str:
    """Échange le token permanent contre un code temporaire (usage unique, ~30 min)
    nécessaire pour sécuriser l'ouverture de la Webview.

    Type 'singleAccess' car le code n'est utilisé qu'une seule fois par la Webview.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{_base_url()}/auth/token/code",
            headers={"Authorization": f"Bearer {user_token}"},
            params={"type": "singleAccess"},
        )
    if response.status_code != 200:
        raise PowensError(f"Échec auth/token/code Powens : {response.text}", response.status_code)
    data = response.json()
    code = data.get("code")
    if not code:
        raise PowensError("Réponse Powens auth/token/code sans code")
    return code


def build_webview_url(temporary_code: str, state: str) -> str:
    """Construit l'URL de la Webview Powens (mode connect) vers laquelle rediriger l'utilisateur."""
    params = (
        f"domain={settings.POWENS_DOMAIN}"
        f"&client_id={settings.POWENS_CLIENT_ID}"
        f"&redirect_uri={settings.POWENS_REDIRECT_URI}"
        f"&code={temporary_code}"
        f"&state={state}"
    )
    return f"{settings.POWENS_WEBVIEW_BASE_URL}?{params}"


async def fetch_transactions_page(user_token: str, cursor: str | None = None, limit: int = 100) -> dict:
    """Récupère une page de transactions brutes (GET /users/me/transactions).
    Utilise l'Authorization Bearer du token utilisateur permanent (Bank API de base, pas d'Insights).
    """
    params: dict[str, str | int] = {"limit": limit}
    if cursor:
        params["cursor"] = cursor
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{_base_url()}/users/me/transactions",
            headers={"Authorization": f"Bearer {user_token}"},
            params=params,
        )
    if response.status_code != 200:
        raise PowensError(f"Échec users/me/transactions Powens : {response.text}", response.status_code)
    return response.json()


async def fetch_connection(user_token: str, connection_id: str) -> dict:
    """Récupère les détails d'une connexion bancaire (GET
    /users/me/connections/{id}?expand=connector), utilisé uniquement pour en
    extraire le nom de l'établissement (connector.name) à afficher à
    l'utilisateur -- cf. app/api/v1/bank.py::handle_callback, qui absorbe
    toute PowensError ici : ne jamais faire échouer la connexion bancaire
    elle-même pour un simple affichage cosmétique.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{_base_url()}/users/me/connections/{connection_id}",
            headers={"Authorization": f"Bearer {user_token}"},
            params={"expand": "connector"},
        )
    if response.status_code != 200:
        raise PowensError(f"Échec users/me/connections/{connection_id} Powens : {response.text}", response.status_code)
    return response.json()
