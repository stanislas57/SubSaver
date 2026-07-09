from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas import ProfileUpdate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(body: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    updates = body.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in updates.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/upgrade-premium", response_model=UserOut)
def upgrade_premium(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Marque l'utilisateur courant comme Premium, appelé par le frontend au
    retour de la page de succès Stripe (/success).

    SÉCURITÉ (placeholder) : cet endpoint fait confiance au client — n'importe
    quel utilisateur authentifié peut s'auto-upgrader en l'appelant directement,
    sans avoir réellement payé. Il n'y a pas encore d'intégration Stripe
    serveur (clé secrète, webhook signé) dans ce projet. Avant mise en
    production, remplacer cet endpoint par un webhook Stripe
    (`checkout.session.completed` / `customer.subscription.updated`) vérifié
    via la signature `Stripe-Signature` et l'événement source de vérité, et
    retirer cette route (ou la réserver à un usage interne/service-to-service).
    """
    current_user.is_premium = True
    # Posée une seule fois : un second appel (ex: retour répété sur /success)
    # ne doit jamais écraser la vraie date de première souscription.
    if not current_user.premium_since:
        current_user.premium_since = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/accept-charter", response_model=UserOut)
def accept_charter(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enregistre l'acceptation de la charte informatique -- appelé une seule
    fois, au clic sur "J'accepte" dans la modale bloquante (CharterModal côté
    frontend). Idempotent : un second appel ne fait que rafraîchir la date,
    ce qui ne casse rien puisque le frontend ne réaffiche plus la modale dès
    que `charter_accepted_at` est renseigné."""
    current_user.charter_accepted_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(current_user)
    return current_user
