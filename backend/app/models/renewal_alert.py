import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class RenewalAlert(Base):
    """Une ligne = une notification de renouvellement pour UN cycle précis
    d'UN abonnement. La contrainte d'unicité (subscription_id, renewal_date)
    est le mécanisme de déduplication : le job quotidien (cf.
    app/core/renewal_alerts.py) peut tourner plusieurs jours de suite dans la
    fenêtre de préavis sans jamais créer une seconde ligne pour le même
    cycle, et le cycle suivant aura de toute façon une `renewal_date`
    différente (dérivée de billing_day)."""

    __tablename__ = "renewal_alerts"
    __table_args__ = (UniqueConstraint("subscription_id", "renewal_date", name="uq_renewal_alert_cycle"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id: Mapped[str] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Date ISO ("YYYY-MM-DD") du renouvellement ciblé par cette alerte.
    renewal_date: Mapped[str] = mapped_column(String, nullable=False)

    # "pending" (créée, email pas encore parti -- ne devrait durer que le
    # temps d'une requête) / "sent" (email + in-app délivrés) / "dismissed"
    # (traitée par l'utilisateur : "Renouveler maintenant" ou "Supprimer").
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now_iso)
    sent_at: Mapped[str | None] = mapped_column(String, nullable=True)

    subscription: Mapped["Subscription"] = relationship()
