"""add bank_name and last_bank_sync_at to users

Revision ID: 21096c05141a
Revises: 0c9a080ca9b8
Create Date: 2026-07-07

"""
from alembic import op
import sqlalchemy as sa

revision = "21096c05141a"
down_revision = "0c9a080ca9b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("bank_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("last_bank_sync_at", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_bank_sync_at")
    op.drop_column("users", "bank_name")
