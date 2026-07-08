"""Drop legacy email-verification columns (replaced by SMS OTP)

Revision ID: d3f8e2a91b56
Revises: a7b3c2d1e4f5
Create Date: 2026-07-08 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3f8e2a91b56'
down_revision: Union[str, None] = 'a7b3c2d1e4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # La vérification à l'inscription se fait désormais par SMS (otp_code /
    # otp_expires_at / otp_attempts, cf. a7b3c2d1e4f5) -- ces colonnes ne
    # servaient qu'à l'ancien flux email (POST /auth/verify-email, supprimé).
    # reset_code / reset_code_expires_at / reset_attempts restent inchangés :
    # ils servent à la réinitialisation de mot de passe (POST
    # /auth/forgot-password), une fonctionnalité distincte non concernée par
    # ce changement.
    op.drop_column('users', 'verification_attempts')
    op.drop_column('users', 'verification_code_expires_at')
    op.drop_column('users', 'verification_code')


def downgrade() -> None:
    op.add_column('users', sa.Column('verification_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_code_expires_at', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.alter_column('users', 'verification_attempts', server_default=None)
