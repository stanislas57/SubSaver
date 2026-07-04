from urllib.parse import parse_qs, urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core import powens
from app.core.powens import PowensError
from app.core.security import create_powens_state, decode_powens_state
from app.core.subscription_detector import RawTransaction, detect_recurring_subscriptions
from app.db.session import get_db
from app.models.bank_transaction import BankTransaction
from app.models.user import User
from app.schemas import (
    BankCallbackBody,
    BankCallbackResult,
    BankConnectUrlOut,
    BankProviderOut,
    BankSyncBody,
    BankSyncResult,
    BankTransactionOut,
    BankTransactionsSyncResult,
    DetectedSubscriptionOut,
)

router = APIRouter(prefix="/bank", tags=["bank"])

# Nombre maximum de pages parcourues par synchronisation, en sécurité contre une pagination infinie.
MAX_SYNC_PAGES = 20
TRANSACTIONS_PAGE_SIZE = 100

# Catalogue statique de démonstration, conservé pour compatibilité avec l'existant.
BANK_PROVIDERS = [
    BankProviderOut(id="bnp", name="BNP Paribas", domain="bnpparibas.fr"),
    BankProviderOut(id="sg", name="Société Générale", domain="societegenerale.fr"),
    BankProviderOut(id="boursorama", name="Boursorama", domain="boursorama.com"),
    BankProviderOut(id="revolut", name="Revolut", domain="revolut.com"),
]


@router.get("/providers", response_model=list[BankProviderOut])
def list_bank_providers(current_user: User = Depends(get_current_user)):
    return BANK_PROVIDERS


@router.post("/sync", response_model=BankSyncResult)
def sync_bank(body: BankSyncBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Conservé pour compatibilité (ancien flow mocké). Le flow réel passe désormais
    par GET /bank/connect-url puis POST /bank/callback."""
    current_user.bank_connected = True
    db.commit()
    return BankSyncResult(bank_connected=True, injected_subscriptions=[])


@router.get("/connect-url", response_model=BankConnectUrlOut)
async def get_connect_url(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Étape 1 du flow réel : prépare et retourne l'URL de la Webview Powens
    vers laquelle le frontend doit rediriger l'utilisateur (redirection pleine page)."""
    try:
        if not current_user.powens_user_token:
            current_user.powens_user_token = await powens.init_user_token()
            db.commit()

        temporary_code = await powens.get_temporary_code(current_user.powens_user_token)
    except PowensError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Powens indisponible : {exc}",
        ) from exc

    state = create_powens_state(current_user.id)
    webview_url = powens.build_webview_url(temporary_code, state)
    return BankConnectUrlOut(webview_url=webview_url)


@router.post("/callback", response_model=BankCallbackResult)
def handle_callback(
    body: BankCallbackBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Étape 2 du flow réel : appelée par le frontend juste après que Powens ait
    redirigé l'utilisateur vers redirect_uri, avec les paramètres de la query string."""
    state_user_id = decode_powens_state(body.state)
    if state_user_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="State invalide ou expiré.")
    if state_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="State ne correspond pas à l'utilisateur.")

    if body.error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connexion bancaire annulée ou en erreur : {body.error_description or body.error}",
        )
    if not body.connection_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="connection_id manquant.")

    current_user.bank_connected = True
    current_user.powens_connection_id = body.connection_id
    db.commit()

    return BankCallbackResult(bank_connected=True, connection_id=body.connection_id)


def _extract_cursor(next_link: dict | None) -> str | None:
    """Extrait le paramètre `cursor` de _links.next.href renvoyé par Powens."""
    if not next_link or not next_link.get("href"):
        return None
    query = parse_qs(urlparse(next_link["href"]).query)
    values = query.get("cursor")
    return values[0] if values else None


@router.post("/transactions/sync", response_model=BankTransactionsSyncResult)
async def sync_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Récupère les transactions brutes depuis Powens (Bank API de base) et les stocke.
    Aucune catégorisation ni détection ici : c'est le rôle de l'algorithme F4, exécuté séparément
    sur les données stockées par cet endpoint.
    """
    if not current_user.bank_connected or not current_user.powens_user_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune banque connectée. Passe d'abord par /bank/connect-url.",
        )

    synced_count = 0
    cursor: str | None = None

    for _ in range(MAX_SYNC_PAGES):
        try:
            page = await powens.fetch_transactions_page(
                current_user.powens_user_token, cursor=cursor, limit=TRANSACTIONS_PAGE_SIZE
            )
        except PowensError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Powens indisponible : {exc}",
            ) from exc

        transactions = page.get("transactions", [])
        for tx in transactions:
            stmt = (
                pg_insert(BankTransaction)
                .values(
                    user_id=current_user.id,
                    powens_transaction_id=str(tx["id"]),
                    wording=tx.get("wording") or "",
                    value=tx["value"],
                    date=tx["date"],
                    transaction_type=tx.get("type"),
                )
                .on_conflict_do_nothing(constraint="uq_user_powens_transaction")
            )
            result = db.execute(stmt)
            synced_count += result.rowcount

        db.commit()

        cursor = _extract_cursor(page.get("_links", {}).get("next"))
        if not cursor or not transactions:
            break

    total_stored_count = len(
        db.execute(select(BankTransaction.id).where(BankTransaction.user_id == current_user.id)).all()
    )

    return BankTransactionsSyncResult(synced_count=synced_count, total_stored=total_stored_count)


@router.get("/transactions", response_model=list[BankTransactionOut])
def list_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Liste les transactions brutes stockées pour l'utilisateur (débogage / vérification)."""
    rows = db.execute(
        select(BankTransaction)
        .where(BankTransaction.user_id == current_user.id)
        .order_by(BankTransaction.date.desc())
    ).scalars().all()
    return [
        BankTransactionOut(
            id=row.id,
            wording=row.wording,
            value=row.value,
            date=row.date,
            transaction_type=row.transaction_type,
        )
        for row in rows
    ]


@router.get("/subscriptions/detect", response_model=list[DetectedSubscriptionOut])
def detect_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lance l'algorithme de détection sur les transactions déjà stockées (via /bank/transactions/sync).
    Ne crée aucun abonnement automatiquement : renvoie des candidats à valider par l'utilisateur (F5)."""
    rows = db.execute(
        select(BankTransaction).where(BankTransaction.user_id == current_user.id)
    ).scalars().all()

    raw = [RawTransaction(id=row.id, wording=row.wording, value=row.value, date=row.date) for row in rows]
    detected = detect_recurring_subscriptions(raw)

    return [
        DetectedSubscriptionOut(
            merchant=d.merchant,
            price=d.price,
            frequency=d.frequency,
            occurrences=d.occurrences,
            last_date=d.last_date,
            next_estimated_date=d.next_estimated_date,
            confidence=d.confidence,
            source_transaction_ids=d.source_transaction_ids,
        )
        for d in detected
    ]
