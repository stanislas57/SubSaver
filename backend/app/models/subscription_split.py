import uuid

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class SubscriptionSplit(Base):
    """Un abonnement partagé (`Subscription.is_shared=True`) ne se répartit
    plus forcément à parts égales entre TOUS les membres du groupe : chaque
    ligne ici représente "ce membre participe au partage de cet abonnement",
    avec une valeur interprétée selon `Subscription.split_mode` :
    - "equal" : share_value est ignoré, part = prix / nombre de participants
    - "percentage" : share_value est un pourcentage (les lignes d'un même
      abonnement doivent sommer à 100)
    - "fixed" : share_value est un montant fixe en devise (les lignes d'un
      même abonnement doivent sommer au prix de l'abonnement)

    Absence totale de lignes pour un abonnement = non personnalisé -> le
    calcul de solde retombe sur l'ancien comportement (parts égales entre
    TOUS les membres du groupe), pour ne rien casser pour qui ne personnalise
    jamais rien.
    """

    __tablename__ = "subscription_splits"
    __table_args__ = (UniqueConstraint("subscription_id", "family_member_id", name="uq_split_subscription_member"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id: Mapped[str] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    family_member_id: Mapped[str] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    share_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    subscription: Mapped["Subscription"] = relationship()
    family_member: Mapped["FamilyMember"] = relationship()
