"""Add phone field and OTP columns for SMS verification

Revision ID: a7b3c2d1e4f5
Revises: f1e67edcbfb1
Create Date: 2026-07-08 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7b3c2d1e4f5'
down_revision: Union[str, None] = 'f1e67edcbfb1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter le champ phone (obligatoire, unique)
    # Comme c'est une colonne unique sur une table existante, on utilise server_default
    # pour les comptes existants, puis on le retire une fois appliqué.
    op.add_column('users', sa.Column('phone', sa.String(), nullable=False, server_default=''))
    op.create_index(op.f('ix_users_phone'), 'users', ['phone'], unique=True)

    # Ajouter les colonnes OTP
    op.add_column('users', sa.Column('otp_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('otp_expires_at', sa.String(), nullable=True))
    op.add_column('users', sa.Column('otp_attempts', sa.Integer(), nullable=False, server_default='0'))

    # Retirer les server_default une fois appliqué
    op.alter_column('users', 'phone', server_default=None)
    op.alter_column('users', 'otp_attempts', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'otp_attempts')
    op.drop_column('users', 'otp_expires_at')
    op.drop_column('users', 'otp_code')
    op.drop_index(op.f('ix_users_phone'), table_name='users')
    op.drop_column('users', 'phone')
