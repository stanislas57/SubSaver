"""add market offers table with curated real data

Revision ID: c9d4e1f7a223
Revises: b7e3a1029f44
Create Date: 2026-07-04 21:00:00.000000

Prix officiels vérifiés le 04/07/2026 via sources publiques (sites officiels des
fournisseurs et comparateurs spécialisés). Base curatée : à remettre à jour
manuellement en cas de changement tarifaire (pas de scraping temps réel, cf.
décision validée avec l'utilisateur).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY


revision: str = 'c9d4e1f7a223'
down_revision: Union[str, None] = 'b7e3a1029f44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

market_offers_table = sa.table(
    "market_offers",
    sa.column("id", sa.String),
    sa.column("category", sa.String),
    sa.column("name", sa.String),
    sa.column("price", sa.Float),
    sa.column("promo", sa.String),
    sa.column("score", sa.Float),
    sa.column("engagement", sa.String),
    sa.column("pros", ARRAY(sa.String)),
    sa.column("cons", ARRAY(sa.String)),
    sa.column("link", sa.String),
    sa.column("price_checked_at", sa.String),
)

CHECKED = "2026-07-04"

OFFERS = [
    # --- Streaming ---
    dict(id="mkt-netflix-std-ads", category="Streaming", name="Netflix Standard avec pub", price=7.99,
         promo=None, score=8.0, engagement="Sans engagement",
         pros=["Plus grand catalogue", "Jusqu'à 2 écrans en HD"], cons=["Publicités entre les contenus"],
         link="https://www.netflix.com/fr/", price_checked_at=CHECKED),
    dict(id="mkt-prime-video", category="Streaming", name="Amazon Prime Video", price=6.99,
         promo="30 jours d'essai gratuit", score=8.3, engagement="Sans engagement",
         pros=["Le moins cher du marché", "Inclus avec Amazon Prime"], cons=["Catalogue original plus restreint"],
         link="https://www.primevideo.com/", price_checked_at=CHECKED),
    dict(id="mkt-disney-std", category="Streaming", name="Disney+ Standard", price=9.99,
         promo=None, score=7.6, engagement="Sans engagement",
         pros=["Catalogue familial Marvel/Star Wars/Pixar"], cons=["Moins de contenus adultes"],
         link="https://www.disneyplus.com/fr-fr", price_checked_at=CHECKED),
    dict(id="mkt-canal-essentiel", category="Streaming", name="Canal+ Essentiel", price=19.99,
         promo="Pendant 6 mois, puis 24,99€/mois", score=7.2, engagement="Voir conditions",
         pros=["Cinéma en avant-première", "Sport en direct"], cons=["Tarif augmente après 6 mois"],
         link="https://www.canalplus.com/", price_checked_at=CHECKED),

    # --- Musique ---
    dict(id="mkt-spotify", category="Musique", name="Spotify Premium Individuel", price=11.99,
         promo=None, score=8.5, engagement="Sans engagement",
         pros=["Plus grand catalogue podcasts", "Recommandations best-in-class"], cons=["Pas de HiFi/Lossless"],
         link="https://www.spotify.com/fr/premium/", price_checked_at=CHECKED),
    dict(id="mkt-apple-music", category="Musique", name="Apple Music Individuel", price=10.99,
         promo=None, score=8.2, engagement="Sans engagement",
         pros=["Le moins cher", "Audio spatial et Lossless inclus"], cons=["Moins social que Spotify"],
         link="https://music.apple.com/fr/", price_checked_at=CHECKED),
    dict(id="mkt-deezer", category="Musique", name="Deezer Premium", price=11.99,
         promo=None, score=7.9, engagement="Sans engagement",
         pros=["FLAC/HiFi inclus sans surcoût"], cons=["Catalogue podcasts plus restreint"],
         link="https://www.deezer.com/fr/", price_checked_at=CHECKED),
    dict(id="mkt-youtube-music", category="Musique", name="YouTube Music Premium", price=12.99,
         promo=None, score=7.4, engagement="Sans engagement",
         pros=["Inclut YouTube Premium (sans pub vidéo)"], cons=["Le plus cher du comparatif", "Pas de Lossless"],
         link="https://music.youtube.com/", price_checked_at=CHECKED),

    # --- Telephonie ---
    dict(id="mkt-free-mobile", category="Telephonie", name="Free 5G 300 Go", price=19.99,
         promo=None, score=8.4, engagement="Sans engagement",
         pros=["300 Go en France", "Prix stable dans la durée"], cons=["Réseau moins étendu en zone rurale"],
         link="https://mobile.free.fr/", price_checked_at=CHECKED),
    dict(id="mkt-red-sfr", category="Telephonie", name="RED by SFR 100 Go", price=11.99,
         promo=None, score=8.1, engagement="Sans engagement",
         pros=["Prix garanti sans hausse", "Réseau SFR"], cons=["Moins de data que Free"],
         link="https://www.red-by-sfr.fr/", price_checked_at=CHECKED),
    dict(id="mkt-b-and-you", category="Telephonie", name="B&You 100 Go", price=10.99,
         promo="Pendant 1 an, puis 13,99€/mois", score=7.8, engagement="Sans engagement",
         pros=["Prix d'appel attractif"], cons=["Tarif augmente après 1 an"],
         link="https://www.bouyguestelecom.fr/forfaits-mobiles/", price_checked_at=CHECKED),
    dict(id="mkt-la-poste-mobile", category="Telephonie", name="La Poste Mobile 200 Go", price=11.99,
         promo=None, score=8.0, engagement="Sans engagement",
         pros=["Meilleur ratio Go/€ du marché"], cons=["Réseau Bouygues, service client réduit"],
         link="https://www.lapostemobile.fr/", price_checked_at=CHECKED),
]


def upgrade() -> None:
    op.create_table(
        'market_offers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('promo', sa.String(), nullable=True),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('engagement', sa.String(), nullable=False),
        sa.Column('pros', ARRAY(sa.String()), nullable=False),
        sa.Column('cons', ARRAY(sa.String()), nullable=False),
        sa.Column('link', sa.String(), nullable=False),
        sa.Column('price_checked_at', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_market_offers_category'), 'market_offers', ['category'], unique=False)
    op.bulk_insert(market_offers_table, OFFERS)


def downgrade() -> None:
    op.drop_index(op.f('ix_market_offers_category'), table_name='market_offers')
    op.drop_table('market_offers')
