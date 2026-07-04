import uuid

from sqlalchemy import Float, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MarketOffer(Base):
    """Offre du marché, curatée manuellement (prix officiels, mise à jour périodique).
    Pas de scraping ni d'API tierce : fiabilité et absence de risque légal (cf. décision validée)."""

    __tablename__ = "market_offers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    promo: Mapped[str | None] = mapped_column(String, nullable=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    engagement: Mapped[str] = mapped_column(String, nullable=False)
    pros: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    cons: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    link: Mapped[str] = mapped_column(String, nullable=False)
    # Date (YYYY-MM-DD) de dernière vérification manuelle du tarif, affichée pour transparence.
    price_checked_at: Mapped[str] = mapped_column(String, nullable=False)
