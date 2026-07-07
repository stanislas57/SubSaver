"""add subscriptions.is_shared + unique partial index on family_members owner

Revision ID: 10c703804011
Revises: 4992bd644783
Create Date: 2026-07-10 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '10c703804011'
down_revision: Union[str, None] = '4992bd644783'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('is_shared', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.alter_column('subscriptions', 'is_shared', server_default=None)

    # Nettoyage préalable indispensable : si des doublons "owner" existent déjà
    # (exactement le bug rapporté), créer un index UNIQUE échouerait tant
    # qu'ils sont en base. Ne garde qu'une ligne owner par utilisateur
    # (déterministe : la plus petite id), supprime les autres.
    op.execute(
        """
        DELETE FROM family_members
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id) AS rn
                FROM family_members
                WHERE is_owner = true
            ) ranked
            WHERE rn > 1
        )
        """
    )

    # Empêche au niveau base la race condition qui créait 2 lignes "owner"
    # pour le même utilisateur (2 requêtes concurrentes -- GET /family/group
    # et GET /family/balances au montage de la page -- passaient toutes les
    # deux le check "un owner existe déjà ?" avant qu'aucune n'ait committé
    # son insertion). Index partiel : n'empêche qu'un SECOND membre avec
    # is_owner=true, jamais les membres normaux (is_owner=false, plusieurs
    # autorisés par utilisateur).
    op.create_index(
        'uq_family_members_one_owner_per_user',
        'family_members',
        ['user_id'],
        unique=True,
        postgresql_where=sa.text('is_owner = true'),
    )


def downgrade() -> None:
    op.drop_index('uq_family_members_one_owner_per_user', table_name='family_members')
    op.drop_column('subscriptions', 'is_shared')
