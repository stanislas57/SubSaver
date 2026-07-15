import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.transaction_analyzer import display_merchant_name
from app.db.session import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    domain: Mapped[str] = mapped_column(String, nullable=False)
    billing_day: Mapped[int] = mapped_column(Integer, nullable=False)
    importance: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[str | None] = mapped_column(String, nullable=True)
    trial_end_date: Mapped[str | None] = mapped_column(String, nullable=True)

    # Métadonnées géographiques optionnelles, consommées par le moteur de
    # correspondance du Comparateur (cf. app/lib/comparatorMatch côté front) :
    # location = ville précise (ex: "Metz"), region = région française,
    # scope = "national" | "local" -- aucune n'est renseignée automatiquement
    # (pas de détection d'adresse), à saisir manuellement si besoin.
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    region: Mapped[str | None] = mapped_column(String, nullable=True)
    scope: Mapped[str | None] = mapped_column(String, nullable=True)

    # Sélection pour l'Abonnement partagé (cf. app/api/v1/family.py) : seuls
    # les abonnements marqués is_shared=True entrent dans le calcul de
    # répartition des coûts du groupe, jamais le total global de l'utilisateur.
    is_shared: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Mode de répartition de CET abonnement entre les membres participants
    # (cf. SubscriptionSplit) : "equal" (défaut), "percentage" ou "fixed".
    # Sans lignes SubscriptionSplit associées, ignoré -- le calcul de solde
    # retombe sur un partage égal entre TOUS les membres du groupe.
    split_mode: Mapped[str] = mapped_column(String, nullable=False, default="equal")

    user: Mapped["User"] = relationship(back_populates="subscriptions")

    @property
    def display_name(self) -> str:
        """Nom normalisé pour affichage (moteur Clé Marchand) -- jamais le
        libellé bancaire brut. Propriété calculée (pas une colonne) exposée
        via SubscriptionOut pour toute vue (ex: Calendrier) sans dupliquer
        cette logique de nettoyage côté frontend."""
        return display_merchant_name(self.name)
