import uuid

from sqlalchemy import Float, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
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
    # Prix annuel remisé le cas échéant (facturé en une fois), null si l'offre n'a pas de formule annuelle.
    annual_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Frais unique de mise en service / résiliation anticipée, null si aucun frais caché.
    setup_fee: Mapped[float | None] = mapped_column(Float, nullable=True)
    setup_fee_note: Mapped[str | None] = mapped_column(String, nullable=True)
    # Attributs propres à la famille de l'offre (ex: "Qualité vidéo" en VOD, "Enveloppe Data" en
    # forfaits mobiles) : liste de {key, label, value} plutôt que des colonnes dédiées par famille,
    # pour que le même modèle serve toutes les catégories sans migration à chaque nouvelle famille.
    attributes: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)

    # Métadonnées géographiques optionnelles pour le moteur de correspondance
    # du Comparateur (Étape 3 du parcours guidé) : location = ville précise
    # (ex: "Metz"), region = région française, scope = "national" | "local".
    # Distinct des attributs `scope`/`region` déjà présents dans `attributes`
    # pour la famille Transport (JSONB, valeurs françaises riches type "Urbain
    # local"/"Régional (TER)", consommées par lib/transportGeo.ts pour les
    # filtres complémentaires) : ces colonnes-ci ne servent qu'au filtrage
    # initial grossier catégorie + portée de l'Étape 3, gardé volontairement
    # simple (cf. décision produit).
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    region: Mapped[str | None] = mapped_column(String, nullable=True)
    scope: Mapped[str | None] = mapped_column(String, nullable=True)
