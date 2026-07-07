import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
