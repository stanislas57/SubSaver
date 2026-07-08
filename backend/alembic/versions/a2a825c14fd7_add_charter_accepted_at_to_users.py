"""add charter_accepted_at to users

Revision ID: a2a825c14fd7
Revises: 10c703804011
Create Date: 2026-07-07

"""
from alembic import op
import sqlalchemy as sa

revision = "a2a825c14fd7"
down_revision = "10c703804011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nullable, sans backfill : les comptes existants ET nouveaux repartent à
    # None, ce qui déclenche la modale bloquante d'acceptation de la charte
    # informatique (CharterGate côté frontend) à leur prochaine connexion.
    op.add_column("users", sa.Column("charter_accepted_at", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "charter_accepted_at")
