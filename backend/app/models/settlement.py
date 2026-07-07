import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Settlement(Base):
    """Trace un remboursement réel entre deux membres du groupe (ex: "Bob a
    remboursé 15€ à Stanislas"), déclenché par le bouton "Marquer comme
    remboursé" sur une dette simplifiée (cf. _simplify_debts dans
    app/api/v1/family.py). C'est à la fois :
    - ce qui permet de calculer le solde NET restant dû pour le mois en cours
      (dû calculé - déjà réglé) ;
    - l'historique des paiements affiché à l'utilisateur.

    `period` (format "YYYY-MM") scope le règlement au mois concerné : les
    parts d'abonnements sont recalculées à la volée à chaque requête à partir
    des prix ACTUELS (pas de sauvegarde d'un montant "de mars"), donc un
    règlement ne doit compenser que les dus du même mois -- sans quoi un
    remboursement de juin annulerait indéfiniment les dus de juillet."""

    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    from_member_id: Mapped[str] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    to_member_id: Mapped[str] = mapped_column(
        ForeignKey("family_members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String, nullable=False, index=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now_iso)

    from_member: Mapped["FamilyMember"] = relationship(foreign_keys=[from_member_id])
    to_member: Mapped["FamilyMember"] = relationship(foreign_keys=[to_member_id])
