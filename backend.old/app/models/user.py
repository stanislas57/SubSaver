import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)

    language: Mapped[str] = mapped_column(String, nullable=False, default="fr")
    theme: Mapped[str] = mapped_column(String, nullable=False, default="light")
    currency: Mapped[str] = mapped_column(String, nullable=False, default="EUR")
    notification_pref: Mapped[str] = mapped_column(String, nullable=False, default="all")
    is_premium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    bank_connected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    family_members: Mapped[list["FamilyMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
