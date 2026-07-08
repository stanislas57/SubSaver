import uuid

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class BankTransaction(Base):
    """Transaction bancaire brute, telle que reçue de Powens (Bank API de base,
    sans catégorisation). Sert de matière première à l'algorithme de détection (F4).
    """

    __tablename__ = "bank_transactions"
    __table_args__ = (UniqueConstraint("user_id", "powens_transaction_id", name="uq_user_powens_transaction"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    powens_transaction_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    wording: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[str] = mapped_column(String, nullable=False)
    transaction_type: Mapped[str | None] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship(back_populates="bank_transactions")
