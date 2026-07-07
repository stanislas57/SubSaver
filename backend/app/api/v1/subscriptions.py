import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.transaction_analyzer import display_merchant_name
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas import CancellableSubscriptionOut, SubscriptionInput, SubscriptionOut

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("", response_model=list[SubscriptionOut])
def list_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Subscription).filter(Subscription.user_id == current_user.id).order_by(Subscription.name).all()


@router.get("/cancellation-candidates", response_model=list[CancellableSubscriptionOut])
def list_cancellation_candidates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Utilisé par la Lettre de résiliation : passe chaque nom d'abonnement
    dans le moteur Clé Marchand (`match_whitelist`) pour obtenir un nom propre
    ("EDF" au lieu de "EDF CLIENTS PARTICULIERS +REPRESENTATION..."), puis
    déduplique par ce nom normalisé -- les abonnements hors liste blanche
    (ajoutés manuellement) gardent simplement leur nom tel quel."""
    subs = (
        db.query(Subscription).filter(Subscription.user_id == current_user.id).order_by(Subscription.name).all()
    )
    seen_keys: set[str] = set()
    candidates: list[CancellableSubscriptionOut] = []
    for sub in subs:
        display_name = display_merchant_name(sub.name)
        key = display_name.strip().casefold()
        if key in seen_keys:
            continue
        seen_keys.add(key)
        candidates.append(
            CancellableSubscriptionOut(id=sub.id, display_name=display_name, price=sub.price, domain=sub.domain)
        )
    return candidates


@router.post("", response_model=SubscriptionOut, status_code=201)
def create_subscription(
    body: SubscriptionInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    sub = Subscription(user_id=current_user.id, **body.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.put("/{sub_id}", response_model=SubscriptionOut)
def update_subscription(
    sub_id: str,
    body: SubscriptionInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement introuvable.")
    for field, value in body.model_dump().items():
        setattr(sub, field, value)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{sub_id}", status_code=204)
def delete_subscription(
    sub_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == current_user.id).delete()
    db.commit()
    return None


@router.get("/export")
def export_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Subscription).filter(Subscription.user_id == current_user.id).order_by(Subscription.name).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["name", "price", "category", "domain", "billing_day", "importance", "start_date", "trial_end_date"])
    for r in rows:
        writer.writerow([r.name, r.price, r.category, r.domain, r.billing_day, r.importance, r.start_date, r.trial_end_date])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=subserver-abonnements.csv"},
    )
