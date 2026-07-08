"""Drop legacy email-verification columns and auto-verify all accounts

Revision ID: d3f8e2a91b56
Revises: f1e67edcbfb1
Create Date: 2026-07-08 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd3f8e2a91b56'
down_revision: Union[str, None] = '21096c05141a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # L'inscription n'exige plus aucune vérification (email ou SMS) : le
    # compte est actif dès sa création (cf. POST /auth/register). Les
    # colonnes verification_code / verification_code_expires_at /
    # verification_attempts ne servaient qu'à l'ancien flux
    # POST /auth/verify-email (supprimé) -- reset_code / reset_code_expires_at
    # / reset_attempts restent inchangés : ils servent à la réinitialisation
    # de mot de passe (POST /auth/forgot-password), une fonctionnalité
    # distincte non concernée par ce changement.
    #
    # Les comptes existants encore non vérifiés (is_verified=false) sont
    # passés à true : sans ça, ils resteraient bloqués au login pour
    # toujours, l'unique chemin de vérification (verify-email) disparaissant
    # avec cette migration.
    op.execute("UPDATE users SET is_verified = true WHERE is_verified = false")

    op.drop_column('users', 'verification_attempts')
    op.drop_column('users', 'verification_code_expires_at')
    op.drop_column('users', 'verification_code')


def downgrade() -> None:
    op.add_column('users', sa.Column('verification_code', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_code_expires_at', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.alter_column('users', 'verification_attempts', server_default=None)
