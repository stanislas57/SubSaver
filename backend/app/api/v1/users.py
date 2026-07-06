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
    db.commit()
    db.refresh(current_user)
    return current_user
