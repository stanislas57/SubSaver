from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.market_offer import MarketOffer
from app.models.user import User
from app.schemas import MarketOfferOut

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/offers", response_model=list[MarketOfferOut])
def list_market_offers(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Base d'offres curatée manuellement (prix officiels vérifiés périodiquement).
    Pas de scraping ni d'API tierce temps réel (cf. décision validée)."""
    query = select(MarketOffer)
    if category:
        query = query.where(MarketOffer.category == category)
    offers = db.execute(query.order_by(MarketOffer.score.desc())).scalars().all()
    return offers
