from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas import BankProviderOut, BankSyncBody, BankSyncResult

router = APIRouter(prefix="/bank", tags=["bank"])

# Catalogue statique de démonstration. À terme : intégration Bridge/Powens/Plaid.
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
    current_user.bank_connected = True
    db.commit()
    return BankSyncResult(bank_connected=True, injected_subscriptions=[])
