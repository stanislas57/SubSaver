"""add google oauth to users

Revision ID: 81584e8b456a
Revises: c4d8f2a913e7
Create Date: 2026-07-11 09:00:00.000000

Support de la connexion "Se connecter avec Google" (cf.
app/core/security.py::verify_google_id_token). `hashed_password` devient
nullable : un compte créé via Google n'a pas de mot de passe. `google_sub`
(l'identifiant stable Google "sub", jamais l'email) est unique et indexé
pour une recherche rapide au login et pour empêcher deux comptes SubSaver de
revendiquer la même identité Google. `auth_provider` distingue seulement la
façon dont le compte a été créé ("password" par défaut, pour tous les
comptes existants).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '81584e8b456a'
down_revision: Union[str, None] = 'c4d8f2a913e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=True)
    op.add_column('users', sa.Column('google_sub', sa.String(), nullable=True))
    op.create_unique_constraint('uq_users_google_sub', 'users', ['google_sub'])
    op.create_index('ix_users_google_sub', 'users', ['google_sub'])
    op.add_column('users', sa.Column('auth_provider', sa.String(), nullable=False, server_default='password'))
    op.alter_column('users', 'auth_provider', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'auth_provider')
    op.drop_index('ix_users_google_sub', table_name='users')
    op.drop_constraint('uq_users_google_sub', 'users', type_='unique')
    op.drop_column('users', 'google_sub')
    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=False)
