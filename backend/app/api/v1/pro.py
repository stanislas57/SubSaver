import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_premium_user
from app.core.pro_tools import VAT_RATE_STANDARD, build_accounting_rows, detect_hidden_bank_fees
from app.core.subscription_detector import RawTransaction
from app.db.session import get_db
from app.models.bank_transaction import BankTransaction
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas import BankFeeOut, BankFeeReportOut, VatRecoveryLineOut, VatRecoveryReportOut

router = APIRouter(prefix="/pro", tags=["pro"])


def _user_subscriptions(current_user: User, db: Session) -> list[Subscription]:
    return db.query(Subscription).filter(Subscription.user_id == current_user.id).order_by(Subscription.name).all()


@router.get("/accounting-export")
def export_accounting(
    current_user: User = Depends(get_current_premium_user), db: Session = Depends(get_db)
):
    """Extraction comptable (Espace Pro/BtoB, Premium) : CSV au format
    français -- séparateur ';', décimales à la virgule -- prêt à être remis à
    un comptable ou importé dans un logiciel comptable français. Distinct du
    CSV générique GET /subscriptions/export (séparateur ',', décimales au
    point, pensé pour un usage personnel dans un tableur, pas pour un import
    comptable FR), et de l'export Excel Premium (classeur multi-onglets
    personnel/partage) : celui-ci se concentre sur la ventilation TTC/HT/TVA
    par fournisseur, la donnée qu'un comptable attend réellement."""
    rows = build_accounting_rows(_user_subscriptions(current_user, db))

    def fmt(n: float) -> str:
        return f"{n:.2f}".replace(".", ",")

    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(
        ["Fournisseur", "Catégorie", "Montant TTC", "Montant HT", "TVA (20%)", "Coût annuel TTC", "Jour de prélèvement"]
    )
    for r in rows:
        writer.writerow(
            [r.display_name, r.category, fmt(r.price_ttc), fmt(r.price_ht), fmt(r.vat_amount), fmt(r.annual_ttc), r.billing_day]
        )
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=subsaver-extraction-comptable.csv"},
    )


@router.get("/vat-recovery", response_model=VatRecoveryReportOut)
def vat_recovery_report(current_user: User = Depends(get_current_premium_user), db: Session = Depends(get_db)):
    """Récupération de TVA (Espace Pro/BtoB, Premium) : estimation de la TVA
    récupérable sur les abonnements, au taux standard français (20%), en
    supposant que le prix stocké est TTC. Ne connaît pas l'usage réel
    (personnel/professionnel) d'un abonnement -- il n'existe pas de champ
    dédié sur Subscription -- l'estimation couvre donc TOUS les abonnements ;
    le choix des lignes réellement professionnelles et déductibles reste à
    l'utilisateur/son comptable (cf. disclaimer affiché côté frontend)."""
    rows = build_accounting_rows(_user_subscriptions(current_user, db))
    lines = [
        VatRecoveryLineOut(
            subscription_id=r.subscription_id,
            display_name=r.display_name,
            category=r.category,
            price_ttc=r.price_ttc,
            price_ht=r.price_ht,
            vat_amount=r.vat_amount,
        )
        for r in rows
    ]
    return VatRecoveryReportOut(
        vat_rate=VAT_RATE_STANDARD,
        lines=lines,
        total_price_ttc=round(sum(l.price_ttc for l in lines), 2),
        total_vat_amount=round(sum(l.vat_amount for l in lines), 2),
    )


@router.get("/bank-fees", response_model=BankFeeReportOut)
def bank_fees_report(current_user: User = Depends(get_current_premium_user), db: Session = Depends(get_db)):
    """Détection des frais bancaires cachés (Espace Pro/BtoB, Premium) : scanne
    l'historique brut des transactions synchronisées -- pas seulement les
    récurrences déjà remontées comme abonnements -- à la recherche de
    libellés de frais/commissions connus, y compris les frais d'incident
    ponctuels (agios, rejets, commissions d'intervention) qu'une seule
    occurrence suffit à signaler, cf. app/core/pro_tools.py. Vide (jamais une
    erreur) si la banque n'est pas connectée -- même convention que le reste
    de l'app, cf. _last_bank_activity_by_merchant_key dans subscriptions.py."""
    if not current_user.bank_connected:
        return BankFeeReportOut(bank_connected=False, fees=[], total_amount=0.0, count=0)

    txs = db.query(BankTransaction).filter(BankTransaction.user_id == current_user.id).all()
    raw = [RawTransaction(id=t.id, wording=t.wording, value=t.value, date=t.date) for t in txs]
    detected = detect_hidden_bank_fees(raw)
    fees = [BankFeeOut(transaction_id=d.transaction_id, label=d.label, date=d.date, amount=d.amount) for d in detected]
    return BankFeeReportOut(
        bank_connected=True, fees=fees, total_amount=round(sum(f.amount for f in fees), 2), count=len(fees)
    )
