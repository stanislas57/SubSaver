"""add location/region/scope columns to subscriptions and market_offers

Revision ID: f2a8c4e9b1d3
Revises: a4f7c9e2b6d1
Create Date: 2026-07-14 09:00:00.000000

Métadonnées géographiques optionnelles pour le moteur de correspondance du
Comparateur (parcours guidé en 3 étapes) : `location` (ville précise, ex:
"Metz"), `region` (région française) et `scope` ("national" | "local").
Colonnes nullable sur les deux tables -- aucune valeur n'est déduite pour les
abonnements utilisateur existants (pas de détection d'adresse), seul le
catalogue `market_offers` est backfillé dans la migration suivante.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f2a8c4e9b1d3'
down_revision: Union[str, None] = 'a4f7c9e2b6d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('location', sa.String(), nullable=True))
    op.add_column('subscriptions', sa.Column('region', sa.String(), nullable=True))
    op.add_column('subscriptions', sa.Column('scope', sa.String(), nullable=True))
    op.add_column('market_offers', sa.Column('location', sa.String(), nullable=True))
    op.add_column('market_offers', sa.Column('region', sa.String(), nullable=True))
    op.add_column('market_offers', sa.Column('scope', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('market_offers', 'scope')
    op.drop_column('market_offers', 'region')
    op.drop_column('market_offers', 'location')
    op.drop_column('subscriptions', 'scope')
    op.drop_column('subscriptions', 'region')
    op.drop_column('subscriptions', 'location')
