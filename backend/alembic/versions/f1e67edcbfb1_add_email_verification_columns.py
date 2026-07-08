"""add email verification and password reset columns

Revision ID: f1e67edcbfb1
Revises: c9d4e1f7a223
Create Date: 2026-07-06 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1e67edcbfb1'
down_revision: Union[str, None] = 'c9d4e1f7a223'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default=true pour les comptes déjà existants (créés avant la vérification
    # par email) : ils restent utilisables sans re-vérification.
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('users', sa.Column('verification_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_code_expires_at', sa.String(), nullable=True))
    op.add_column('users', sa.Column('reset_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('reset_code_expires_at', sa.String(), nullable=True))
    op.alter_column('users', 'is_verified', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'reset_code_expires_at')
    op.drop_column('users', 'reset_code')
    op.drop_column('users', 'verification_code_expires_at')
    op.drop_column('users', 'verification_code')
    op.drop_column('users', 'is_verified')
