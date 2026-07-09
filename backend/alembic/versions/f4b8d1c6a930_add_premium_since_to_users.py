"""add premium_since to users

Revision ID: f4b8d1c6a930
Revises: e7a3f9c2b1d4
Create Date: 2026-07-10 09:00:00.000000

Support de la règle métier "auto-injection SubSaver Premium" : la date
d'échéance affichée pour cet abonnement synthétique doit être la vraie date
de souscription, pas une date arbitraire. Nullable : les comptes déjà
Premium avant cette migration n'ont pas de valeur connue (cf.
enrich_detected_subscriptions, qui se replie sur la date du jour dans ce cas).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f4b8d1c6a930'
down_revision: Union[str, None] = 'e7a3f9c2b1d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('premium_since', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'premium_since')
