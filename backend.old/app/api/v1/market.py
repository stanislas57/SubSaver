from typing import Optional

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas import MarketOfferOut

router = APIRouter(prefix="/market", tags=["market"])

# Offres de démonstration. À terme : scraping/API partenaires par catégorie.
MARKET_OFFERS = [
    MarketOfferOut(
        id="off-1", category="Streaming", name="Netflix Standard", price=13.49, promo=None, score=8.2,
        engagement="Sans engagement", pros=["Large catalogue"], cons=["Pub sur l'offre basique"],
        link="https://netflix.com",
    ),
    MarketOfferOut(
        id="off-2", category="Streaming", name="Disney+", price=8.99, promo="-20% le 1er mois", score=7.5,
        engagement="Sans engagement", pros=["Catalogue familial"], cons=["Moins de séries adultes"],
        link="https://disneyplus.com",
    ),
    MarketOfferOut(
        id="off-3", category="Telephonie", name="Forfait Free 5G", price=19.99, promo=None, score=8.8,
        engagement="Sans engagement", pros=["Data illimitée en France"], cons=["Réseau variable en zone rurale"],
        link="https://free.fr",
    ),
]


@router.get("/offers", response_model=list[MarketOfferOut])
def list_market_offers(category: Optional[str] = None, current_user: User = Depends(get_current_user)):
    if category:
        return [o for o in MARKET_OFFERS if o.category == category]
    return MARKET_OFFERS
