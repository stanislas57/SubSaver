"""market offers: flexible per-category attributes + richer pricing fields

Revision ID: e7a3f9c2b1d4
Revises: d3f8e2a91b56
Create Date: 2026-07-09 10:00:00.000000

Étend le modèle MarketOffer pour le comparateur universel : prix annuel remisé,
frais cachés/mise en service, et surtout `attributes` (JSONB de {key, label,
value}) qui porte les caractéristiques propres à chaque famille (ex: "Qualité
vidéo" en VOD, "Enveloppe Data" en forfaits mobiles) sans ajouter une colonne
par famille à chaque nouvelle catégorie.

Remplace aussi le jeu de données Streaming / Musique / Telephonie par une base
élargie (10 offres par famille) : toujours des fournisseurs et tarifs réels,
vérifiés manuellement via recherche web le 09/07/2026 (cf. décision validée :
pas de scraping ni d'API tierce temps réel, mise à jour manuelle périodique).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = 'e7a3f9c2b1d4'
down_revision: Union[str, None] = 'd3f8e2a91b56'
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
    sa.column("pros", sa.ARRAY(sa.String)),
    sa.column("cons", sa.ARRAY(sa.String)),
    sa.column("link", sa.String),
    sa.column("price_checked_at", sa.String),
    sa.column("annual_price", sa.Float),
    sa.column("setup_fee", sa.Float),
    sa.column("setup_fee_note", sa.String),
    sa.column("attributes", JSONB),
)

CHECKED = "2026-07-09"
REPLACED_CATEGORIES = ["Streaming", "Musique", "Telephonie"]


def video_attrs(quality: str, screens: str, ads: str, offline: str) -> list[dict]:
    return [
        {"key": "video_quality", "label": "Qualité vidéo", "value": quality},
        {"key": "screens", "label": "Écrans simultanés", "value": screens},
        {"key": "ads", "label": "Publicité", "value": ads},
        {"key": "offline", "label": "Téléchargement hors-ligne", "value": offline},
    ]


def audio_attrs(quality: str, offline: str, devices: str, catalog: str) -> list[dict]:
    return [
        {"key": "audio_quality", "label": "Qualité audio", "value": quality},
        {"key": "offline", "label": "Écoute hors-ligne", "value": offline},
        {"key": "devices", "label": "Appareils", "value": devices},
        {"key": "catalog", "label": "Catalogue", "value": catalog},
    ]


def mobile_attrs(data: str, calls_sms: str, roaming_eu: str, network: str) -> list[dict]:
    return [
        {"key": "data", "label": "Enveloppe Data", "value": data},
        {"key": "calls_sms", "label": "Appels & SMS", "value": calls_sms},
        {"key": "roaming_eu", "label": "Roaming Europe/DOM", "value": roaming_eu},
        {"key": "network", "label": "Réseau", "value": network},
    ]


OFFERS = [
    # --- Streaming (VOD) ---
    dict(id="mkt-netflix-standard-ads", category="Streaming", name="Netflix Standard avec pub", price=7.99,
         promo=None, score=7.8, engagement="Sans engagement",
         pros=["Plus grand catalogue du marché", "2 écrans simultanés en Full HD"],
         cons=["Publicités entre les contenus", "Pas de téléchargement hors-ligne"],
         link="https://www.netflix.com/fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "2", "Oui", "Non")),
    dict(id="mkt-netflix-standard", category="Streaming", name="Netflix Standard", price=14.99,
         promo=None, score=8.0, engagement="Sans engagement",
         pros=["Sans publicité", "Téléchargement hors-ligne sur 2 appareils"],
         cons=["Pas de 4K"],
         link="https://www.netflix.com/fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "2", "Non", "Oui")),
    dict(id="mkt-netflix-premium", category="Streaming", name="Netflix Premium", price=21.99,
         promo=None, score=8.1, engagement="Sans engagement",
         pros=["4K Ultra HD + HDR", "4 écrans simultanés", "Audio spatial"],
         cons=["Le plus cher du comparatif"],
         link="https://www.netflix.com/fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("4K Ultra HD", "4", "Non", "Oui")),
    dict(id="mkt-disney-standard-ads", category="Streaming", name="Disney+ Standard avec pub", price=6.99,
         promo=None, score=7.6, engagement="Sans engagement",
         pros=["Le moins cher du comparatif", "Catalogue familial Marvel/Star Wars/Pixar"],
         cons=["Publicités", "Pas de téléchargement hors-ligne"],
         link="https://www.disneyplus.com/fr-fr", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "2", "Oui", "Non")),
    dict(id="mkt-disney-premium", category="Streaming", name="Disney+ Premium", price=15.99,
         promo="Formule annuelle à 159,90€ (l'équivalent de 2 mois offerts)", score=7.9,
         engagement="Sans engagement",
         pros=["4K UHD + Dolby Atmos", "4 écrans simultanés", "Sans publicité"],
         cons=["Catalogue plus familial, moins de contenus adultes"],
         link="https://www.disneyplus.com/fr-fr", price_checked_at=CHECKED, annual_price=159.90,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("4K UHD", "4", "Non", "Oui")),
    dict(id="mkt-prime-video", category="Streaming", name="Amazon Prime Video", price=6.99,
         promo="30 jours d'essai gratuit, inclus avec Amazon Prime", score=8.2,
         engagement="Sans engagement",
         pros=["Parmi les moins chers du marché", "Inclus avec l'abonnement Amazon Prime"],
         cons=["Publicités incluses par défaut (option sans pub à +2,99€/mois)"],
         link="https://www.primevideo.com/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("4K UHD (selon contenu)", "3", "Oui (option sans pub +2,99€)", "Non")),
    dict(id="mkt-apple-tv-plus", category="Streaming", name="Apple TV+", price=9.99,
         promo=None, score=8.3, engagement="Sans engagement",
         pros=["Aucune publicité, jamais", "Jusqu'à 6 comptes via le partage familial Apple",
               "4K HDR Dolby Atmos"],
         cons=["Catalogue plus restreint (productions originales uniquement)"],
         link="https://tv.apple.com/fr", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("4K HDR Dolby Vision/Atmos", "6 (partage familial)", "Non", "Oui")),
    dict(id="mkt-max-standard", category="Streaming", name="Max (HBO Max) Standard", price=10.99,
         promo="Formule annuelle à 109,90€ (2 mois offerts)", score=7.7, engagement="Sans engagement",
         pros=["Catalogue HBO Original, DC, Warner", "4K UHD inclus"],
         cons=["Hausse tarifaire récente (juillet 2026)"],
         link="https://www.max.com/fr/fr", price_checked_at=CHECKED, annual_price=109.90,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("4K UHD", "2", "Non", "Oui")),
    dict(id="mkt-canal-cine-series", category="Streaming", name="Canal+ Ciné Séries", price=29.99,
         promo="Pendant 12 mois, puis 45,99€/mois", score=7.3,
         engagement="Sans engagement (tarif évolutif après 1 an)",
         pros=["Regroupe Netflix Standard, Disney+, OCS, Paramount+, Max et Insomnia en un seul abonnement",
               "Cinéma en avant-première, sport en direct"],
         cons=["Tarif quasiment doublé après la 1ère année", "Nécessite souvent un décodeur Canal+"],
         link="https://www.canalplus.com/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=49.0, setup_fee_note="Location d'un décodeur Canal+ si vous n'en possédez pas déjà un",
         attributes=video_attrs("4K UHD (selon service inclus)", "Variable selon service", "Non", "Oui")),
    dict(id="mkt-crunchyroll-megafan", category="Streaming", name="Crunchyroll Mega Fan", price=8.99,
         promo="Offre Fan à 6,99€/mois disponible (moins d'écrans simultanés)", score=7.5,
         engagement="Sans engagement",
         pros=["Spécialiste anime : simulcasts day-one", "4 écrans simultanés",
               "Téléchargement hors-ligne"],
         cons=["Catalogue 100% anime, pas de films/séries généralistes"],
         link="https://www.crunchyroll.com/fr/premium", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "4", "Non", "Oui")),

    # --- Musique ---
    dict(id="mkt-spotify", category="Musique", name="Spotify Premium Individuel", price=11.99,
         promo=None, score=8.5, engagement="Sans engagement",
         pros=["Plus grand catalogue de podcasts", "Recommandations et playlists best-in-class"],
         cons=["Pas de son Lossless/HiFi"],
         link="https://www.spotify.com/fr/premium/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("320 kbps (pas de Lossless)", "Oui", "Multi-appareils (1 compte)", "100M+ titres")),
    dict(id="mkt-apple-music", category="Musique", name="Apple Music Individuel", price=10.99,
         promo=None, score=8.4, engagement="Sans engagement",
         pros=["Le moins cher du comparatif", "Lossless et Audio spatial Dolby Atmos inclus sans surcoût"],
         cons=["Moins social que Spotify (pas de partage d'activité)"],
         link="https://music.apple.com/fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Lossless 24-bit + Dolby Atmos", "Oui", "Jusqu'à 10 appareils", "100M+ titres")),
    dict(id="mkt-deezer", category="Musique", name="Deezer Premium", price=11.99,
         promo=None, score=8.0, engagement="Sans engagement",
         pros=["Catalogue FLAC/HiFi inclus sans surcoût", "Application Flow personnalisée"],
         cons=["Catalogue de podcasts plus restreint"],
         link="https://www.deezer.com/fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("FLAC/HiFi 16-bit", "Oui", "1 compte", "~120M titres")),
    dict(id="mkt-youtube-music", category="Musique", name="YouTube Music Premium", price=12.99,
         promo=None, score=7.4, engagement="Sans engagement",
         pros=["Immense catalogue incluant lives et remix", "Bonne intégration YouTube"],
         cons=["Le plus cher des offres individuelles classiques", "Pas de Lossless"],
         link="https://music.youtube.com/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("256 kbps AAC", "Oui", "1 compte", "100M+ titres")),
    dict(id="mkt-youtube-premium", category="Musique", name="YouTube Premium (inclut YouTube Music)",
         price=13.99, promo="Inclut YouTube sans publicité + YouTube Music Premium", score=7.6,
         engagement="Sans engagement",
         pros=["YouTube vidéo sans publicité inclus", "YouTube Music Premium inclus"],
         cons=["Le plus cher du comparatif si seule la musique intéresse"],
         link="https://www.youtube.com/premium", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("256 kbps AAC", "Oui", "1 compte", "100M+ titres")),
    dict(id="mkt-amazon-music-unlimited", category="Musique", name="Amazon Music Unlimited", price=10.99,
         promo=None, score=7.8, engagement="Sans engagement",
         pros=["Bon rapport qualité/prix", "Hi-Res et audio spatial inclus"],
         cons=["Moins de fonctions sociales/playlists communautaires"],
         link="https://music.amazon.fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Hi-Res 24-bit/192kHz", "Oui", "1 compte", "100M+ titres")),
    dict(id="mkt-amazon-music-unlimited-prime", category="Musique",
         name="Amazon Music Unlimited avec Prime", price=9.99,
         promo="-1€/mois pour les abonnés Amazon Prime", score=8.0, engagement="Sans engagement",
         pros=["Le moins cher pour un catalogue Hi-Res complet", "Réduction automatique si déjà Prime"],
         cons=["Nécessite un abonnement Amazon Prime actif (7,99€/mois à part)"],
         link="https://music.amazon.fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Hi-Res 24-bit/192kHz", "Oui", "1 compte", "100M+ titres")),
    dict(id="mkt-qobuz", category="Musique", name="Qobuz Studio Premier", price=19.99,
         promo="17,50€/mois en formule annuelle (209,99€/an)", score=7.2, engagement="Sans engagement",
         pros=["Qualité audio Hi-Res la plus poussée du marché (jusqu'à 24-bit/192kHz)",
               "Magazine et livrets d'albums inclus"],
         cons=["Le plus cher du comparatif en mensuel"],
         link="https://www.qobuz.com/fr-fr/", price_checked_at=CHECKED, annual_price=209.99,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Hi-Res 24-bit/192kHz", "Oui", "1 compte", "100M+ titres")),
    dict(id="mkt-tidal", category="Musique", name="Tidal HiFi", price=10.99,
         promo=None, score=7.9, engagement="Sans engagement",
         pros=["Hi-Res et Dolby Atmos inclus", "Rémunération artiste mise en avant"],
         cons=["Catalogue légèrement plus restreint que Spotify"],
         link="https://tidal.com/fr", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Hi-Res 24-bit/192kHz + Dolby Atmos", "Oui", "1 compte", "100M+ titres")),
    dict(id="mkt-soundcloud-go", category="Musique", name="SoundCloud Go+", price=9.99,
         promo=None, score=6.9, engagement="Sans engagement",
         pros=["Le moins cher du comparatif",
               "Catalogue unique de remixes, DJ sets et artistes indépendants"],
         cons=["Pas de Lossless/HiFi", "Moins adapté aux gros catalogues mainstream"],
         link="https://soundcloud.com/go", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("256 kbps AAC", "Oui", "1 compte", "~350M pistes (dont indépendants)")),

    # --- Telephonie (forfaits mobiles) ---
    dict(id="mkt-free-mobile", category="Telephonie", name="Free 5G 300 Go", price=19.99,
         promo=None, score=8.4, engagement="Sans engagement",
         pros=["300 Go en France", "25 Go utilisables en Europe/DOM", "Prix stable dans la durée"],
         cons=["Réseau moins étendu en zone rurale que les 3 opérateurs historiques"],
         link="https://mobile.free.fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("300 Go", "Illimités", "25 Go", "Réseau Free")),
    dict(id="mkt-red-sfr", category="Telephonie", name="RED by SFR 100 Go", price=11.99,
         promo=None, score=8.1, engagement="Sans engagement",
         pros=["Prix garanti sans hausse à vie", "Réseau SFR"],
         cons=["Moins de data que Free pour un prix proche"],
         link="https://www.red-by-sfr.fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("100 Go", "Illimités", "20 Go", "Réseau SFR")),
    dict(id="mkt-b-and-you", category="Telephonie", name="B&You 100 Go 5G", price=10.99,
         promo="Pendant 1 an, puis 13,99€/mois", score=7.8, engagement="Sans engagement",
         pros=["Prix d'appel très attractif la 1ère année", "5G incluse"],
         cons=["Tarif augmente après 1 an"],
         link="https://www.bouyguestelecom.fr/forfaits-mobiles/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("100 Go", "Illimités", "20 Go", "Réseau Bouygues Telecom")),
    dict(id="mkt-sosh", category="Telephonie", name="Sosh 80 Go 5G", price=12.99,
         promo=None, score=7.7, engagement="Sans engagement",
         pros=["Réseau Orange, le plus étendu en zone rurale", "Service client 100% en ligne réputé fiable"],
         cons=["Moins de Go que la concurrence à prix équivalent"],
         link="https://www.sosh.fr/forfaits-mobiles", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("80 Go", "Illimités", "15 Go", "Réseau Orange")),
    dict(id="mkt-la-poste-mobile", category="Telephonie", name="La Poste Mobile Intégral", price=4.99,
         promo=None, score=7.5, engagement="Sans engagement",
         pros=["Appels/SMS/MMS illimités dès 4,99€/mois", "Réseau Bouygues Telecom depuis le rachat (sept. 2025)"],
         cons=["Enveloppe data plus modeste sur l'entrée de gamme"],
         link="https://www.lapostemobile.fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("20 Go", "Illimités", "8 Go", "Réseau Bouygues Telecom")),
    dict(id="mkt-auchan-telecom", category="Telephonie", name="Auchan Telecom Petit Prix", price=1.99,
         promo=None, score=6.8, engagement="Sans engagement",
         pros=["Le moins cher du comparatif", "Appels/SMS/MMS illimités inclus"],
         cons=["Seulement 1 Go de data, insuffisant hors Wi-Fi"],
         link="https://www.auchantelecom.fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=10.0, setup_fee_note="Frais d'envoi de la carte SIM (non remboursables)",
         attributes=mobile_attrs("1 Go", "Illimités", "500 Mo", "Réseau Bouygues Telecom (MVNO)")),
    dict(id="mkt-prixtel-le-petit", category="Telephonie", name="Prixtel Le Petit", price=6.99,
         promo="Enveloppe modulable automatiquement de 20 à 60 Go selon consommation", score=7.6,
         engagement="Sans engagement",
         pros=["Facturé selon la consommation réelle du mois", "Bon compromis petit budget"],
         cons=["Facture variable, moins prévisible"],
         link="https://www.prixtel.com/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("20 à 60 Go (modulable)", "Illimités", "10 Go", "Réseau SFR (MVNO)")),
    dict(id="mkt-prixtel-oxygene", category="Telephonie", name="Prixtel Oxygène", price=9.99,
         promo="Enveloppe modulable automatiquement de 150 à 190 Go selon consommation", score=7.9,
         engagement="Sans engagement",
         pros=["Gros volume de data pour le prix", "Facturation ajustée à l'usage réel"],
         cons=["Facture variable, moins prévisible"],
         link="https://www.prixtel.com/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("150 à 190 Go (modulable)", "Illimités", "15 Go", "Réseau SFR (MVNO)")),
    dict(id="mkt-nrj-mobile", category="Telephonie", name="NRJ Mobile 130 Go", price=9.99,
         promo=None, score=7.4, engagement="Sans engagement",
         pros=["Bon ratio Go/prix", "Options radio NRJ incluses"],
         cons=["Service client moins réactif que les opérateurs historiques"],
         link="https://www.nrjmobile.fr/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=10.0, setup_fee_note="Frais d'envoi de la carte SIM",
         attributes=mobile_attrs("130 Go", "Illimités", "15 Go", "Réseau SFR (MVNO)")),
    dict(id="mkt-cdiscount-mobile", category="Telephonie", name="Cdiscount Mobile 100 Go", price=7.99,
         promo=None, score=7.3, engagement="Sans engagement",
         pros=["Très bon rapport prix/data", "Cumul de bons d'achat Cdiscount selon les offres"],
         cons=["Réseau et couverture identiques au MVNO hôte, pas de service dédié terrain"],
         link="https://mobile.cdiscount.com/", price_checked_at=CHECKED, annual_price=None,
         setup_fee=1.0, setup_fee_note="Frais de mise en service de la ligne",
         attributes=mobile_attrs("100 Go", "Illimités", "12 Go", "Réseau Bouygues Telecom (MVNO)")),
]


def upgrade() -> None:
    op.add_column('market_offers', sa.Column('annual_price', sa.Float(), nullable=True))
    op.add_column('market_offers', sa.Column('setup_fee', sa.Float(), nullable=True))
    op.add_column('market_offers', sa.Column('setup_fee_note', sa.String(), nullable=True))
    op.add_column(
        'market_offers',
        sa.Column('attributes', JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")),
    )

    conn = op.get_bind()
    conn.execute(
        market_offers_table.delete().where(market_offers_table.c.category.in_(REPLACED_CATEGORIES))
    )
    op.bulk_insert(market_offers_table, OFFERS)


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        market_offers_table.delete().where(market_offers_table.c.category.in_(REPLACED_CATEGORIES))
    )
    op.drop_column('market_offers', 'attributes')
    op.drop_column('market_offers', 'setup_fee_note')
    op.drop_column('market_offers', 'setup_fee')
    op.drop_column('market_offers', 'annual_price')
