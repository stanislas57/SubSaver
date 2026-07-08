"""add is_admin, created_at, last_login_at to users

Revision ID: be3784d909e9
Revises: f1e67edcbfb1
Create Date: 2026-07-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'be3784d909e9'
down_revision: Union[str, None] = 'f1e67edcbfb1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.alter_column('users', 'is_admin', server_default=None)
    # Stockées en texte ISO comme le reste des dates de l'app (cf. verification_code_expires_at) :
    # nullable, car les comptes déjà existants n'ont pas de date d'inscription connue.
    op.add_column('users', sa.Column('created_at', sa.String(), nullable=True))
    op.add_column('users', sa.Column('last_login_at', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'is_admin')
