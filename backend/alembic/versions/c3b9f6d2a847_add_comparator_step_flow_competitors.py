"""add new competitor market offers for Telephonie/Streaming/Musique/Banque/Sport

Revision ID: c3b9f6d2a847
Revises: a7c1e5f83b02
Create Date: 2026-07-14 09:15:00.000000

Élargit le catalogue pour le parcours guidé en 3 étapes du Comparateur :
6 nouveaux concurrents réalistes par famille (Téléphonie, Streaming, Musique,
Banque, Sport), avec `scope`/`region`/`location` renseignés dès l'insertion
(cf. migrations f2a8c4e9b1d3 / a7c1e5f83b02). Prix vérifiés manuellement via
recherche web le 14/07/2026 (même politique que les catalogues précédents :
pas de scraping ni d'API tierce temps réel).

Sport ajoute volontairement 4 salles indépendantes mono-ville (`scope="local"`)
en plus des réseaux nationaux existants, pour donner un second exemple
concret de correspondance géographique à côté de Transport.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = 'c3b9f6d2a847'
down_revision: Union[str, None] = 'a7c1e5f83b02'
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
    sa.column("location", sa.String),
    sa.column("region", sa.String),
    sa.column("scope", sa.String),
)

CHECKED = "2026-07-14"


def mobile_attrs(data: str, calls_sms: str, roaming_eu: str, network: str) -> list[dict]:
    return [
        {"key": "data", "label": "Enveloppe Data", "value": data},
        {"key": "calls_sms", "label": "Appels & SMS", "value": calls_sms},
        {"key": "roaming_eu", "label": "Roaming Europe/DOM", "value": roaming_eu},
        {"key": "network", "label": "Réseau", "value": network},
    ]


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


def banking_attrs(bank_type: str, card_level: str, foreign_fees: str, eligibility: str,
                   check_cash_deposit: str, insurance: str) -> list[dict]:
    return [
        {"key": "bank_type", "label": "Type d'établissement", "value": bank_type},
        {"key": "card_level", "label": "Niveau de carte", "value": card_level},
        {"key": "foreign_fees", "label": "Paiements à l'étranger", "value": foreign_fees},
        {"key": "eligibility", "label": "Condition d'accès", "value": eligibility},
        {"key": "check_cash_deposit", "label": "Dépôt chèques / espèces", "value": check_cash_deposit},
        {"key": "insurance", "label": "Assurances incluses", "value": insurance},
    ]


def sport_attrs(subcategory: str, multi_club: str, group_classes: str, mobile_app: str, guest_invite: str) -> list[dict]:
    return [
        {"key": "subcategory", "label": "Sous-catégorie", "value": subcategory},
        {"key": "multi_club_access", "label": "Accès multi-salles", "value": multi_club},
        {"key": "group_classes", "label": "Cours collectifs", "value": group_classes},
        {"key": "mobile_app", "label": "Application mobile", "value": mobile_app},
        {"key": "guest_invite", "label": "Invitation d'un proche", "value": guest_invite},
    ]


OFFERS = [
    # --- Telephonie (6 nouveaux, tous nationaux) ---
    dict(id="mkt-orange-forfait-130go", category="Telephonie", name="Orange Forfait 130 Go", price=19.99,
         promo=None, score=7.6, engagement="Sans engagement",
         pros=["Réseau le plus étendu et le plus fiable de France", "Service client premium, boutiques partout"],
         cons=["Plus cher que les MVNO à enveloppe équivalente"],
         link="https://boutique.orange.fr/mobile/forfaits-sim", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("130 Go", "Illimités", "25 Go", "Réseau Orange"),
         location=None, region=None, scope="national"),
    dict(id="mkt-sfr-forfait-premium", category="Telephonie", name="Forfait SFR Premium 200 Go", price=24.99,
         promo=None, score=7.2, engagement="Sans engagement",
         pros=["Grosse enveloppe data", "Options streaming inclues selon période promo"],
         cons=["Tarif plus élevé que la marque RED du même groupe"],
         link="https://www.sfr.fr/forfait-mobile", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("200 Go", "Illimités", "25 Go", "Réseau SFR"),
         location=None, region=None, scope="national"),
    dict(id="mkt-bouygues-sensation", category="Telephonie", name="Bouygues Telecom Sensation 130 Go", price=19.99,
         promo=None, score=7.5, engagement="Sans engagement",
         pros=["Réseau Bouygues Telecom, très bonne couverture rurale", "Application client bien notée"],
         cons=["Prix d'appel moins agressif que les MVNO"],
         link="https://www.bouyguestelecom.fr/forfaits-mobiles/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("130 Go", "Illimités", "25 Go", "Réseau Bouygues Telecom"),
         location=None, region=None, scope="national"),
    dict(id="mkt-lebara-mobile", category="Telephonie", name="Lebara 50 Go", price=6.99,
         promo=None, score=7.3, engagement="Sans engagement",
         pros=["Très bon rapport prix/data pour les petits consommateurs", "Pas d'engagement, résiliable à tout moment"],
         cons=["Application et service client plus limités qu'un opérateur historique"],
         link="https://www.lebara.fr/forfaits-mobiles", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("50 Go", "Illimités", "10 Go", "Réseau Orange (MVNO)"),
         location=None, region=None, scope="national"),
    dict(id="mkt-lycamobile", category="Telephonie", name="Lycamobile 30 Go", price=4.99,
         promo=None, score=6.9, engagement="Sans engagement",
         pros=["Prix très bas", "Bon choix pour les appels internationaux (tarifs dédiés)"],
         cons=["Faible enveloppe data pour un usage intensif"],
         link="https://www.lycamobile.fr/fr/forfaits-sim-only/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("30 Go", "Illimités", "6 Go", "Réseau Orange (MVNO)"),
         location=None, region=None, scope="national"),
    dict(id="mkt-coriolis-telecom", category="Telephonie", name="Coriolis Telecom 100 Go", price=8.99,
         promo=None, score=7.4, engagement="Sans engagement",
         pros=["Bon compromis prix/data", "Opérateur français indépendant depuis 2000"],
         cons=["Réseau et couverture identiques au MVNO hôte"],
         link="https://www.coriolis.com/forfaits-mobiles", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=mobile_attrs("100 Go", "Illimités", "15 Go", "Réseau Bouygues Telecom (MVNO)"),
         location=None, region=None, scope="national"),

    # --- Streaming (6 nouveaux, tous nationaux) ---
    dict(id="mkt-paramount-plus", category="Streaming", name="Paramount+", price=7.99,
         promo=None, score=7.4, engagement="Sans engagement",
         pros=["Prix compétitif", "Catalogue Star Trek, South Park, contenus Paramount exclusifs"],
         cons=["Catalogue plus restreint que Netflix ou Disney+"],
         link="https://www.paramountplus.com/fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("4K UHD (selon contenu)", "4", "Non", "Oui"),
         location=None, region=None, scope="national"),
    dict(id="mkt-ocs-max", category="Streaming", name="OCS Max", price=10.99,
         promo="Souvent inclus dans les box internet Orange", score=7.5, engagement="Sans engagement",
         pros=["Diffuseur français de HBO/Max en simultané", "Bon catalogue séries et cinéma d'auteur"],
         cons=["Catalogue plus modeste hors accords HBO"],
         link="https://www.ocs.fr/abonnement", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "5", "Non", "Oui"),
         location=None, region=None, scope="national"),
    dict(id="mkt-adn-anime", category="Streaming", name="ADN (Anime Digital Network)", price=6.99,
         promo=None, score=7.8, engagement="Sans engagement",
         pros=["Spécialiste anime en VOSTFR/VF, service français", "Simulcasts day-one, doublage francophone soigné"],
         cons=["Catalogue 100% anime, pas de contenus généralistes"],
         link="https://animedigitalnetwork.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "2", "Non", "Oui"),
         location=None, region=None, scope="national"),
    dict(id="mkt-molotov-plus", category="Streaming", name="Molotov Plus", price=9.99,
         promo=None, score=7.0, engagement="Sans engagement",
         pros=["TV en direct + replay de toutes les chaînes françaises", "Enregistrement cloud illimité"],
         cons=["Pas de films/séries à la demande façon Netflix"],
         link="https://www.molotov.tv/offres", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "4", "Non (chaînes gratuites), Oui (payantes)", "Oui"),
         location=None, region=None, scope="national"),
    dict(id="mkt-bein-sports-connect", category="Streaming", name="beIN Sports Connect", price=14.99,
         promo=None, score=7.1, engagement="Sans engagement",
         pros=["Ligue 1, tennis, sports US en direct", "Application multi-écrans"],
         cons=["Le plus cher du comparatif streaming", "Contenu 100% sportif"],
         link="https://www.beinsports.com/fr/abonnement", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("Full HD", "2", "Non", "Non"),
         location=None, region=None, scope="national"),
    dict(id="mkt-mubi", category="Streaming", name="MUBI", price=11.99,
         promo="7 jours d'essai gratuit", score=7.6, engagement="Sans engagement",
         pros=["Cinéma d'auteur et classiques sélectionnés à la main", "Un nouveau film chaque jour"],
         cons=["Pas adapté à un usage familial généraliste"],
         link="https://mubi.com/fr", price_checked_at=CHECKED,
         annual_price=119.99, setup_fee=None, setup_fee_note=None,
         attributes=video_attrs("4K UHD (selon contenu)", "1", "Non", "Oui"),
         location=None, region=None, scope="national"),

    # --- Musique (6 nouveaux, formules famille/duo réelles, tous nationaux) ---
    dict(id="mkt-spotify-duo", category="Musique", name="Spotify Duo", price=16.99,
         promo=None, score=8.2, engagement="Sans engagement",
         pros=["2 comptes Premium séparés", "Playlist Duo Mix partagée"],
         cons=["Les 2 comptes doivent être à la même adresse"],
         link="https://www.spotify.com/fr/premium/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("320 kbps (pas de Lossless)", "Oui", "Multi-appareils (2 comptes)", "100M+ titres"),
         location=None, region=None, scope="national"),
    dict(id="mkt-spotify-family", category="Musique", name="Spotify Family", price=19.99,
         promo=None, score=8.3, engagement="Sans engagement",
         pros=["Jusqu'à 6 comptes Premium individuels", "Contrôle parental Spotify Kids inclus"],
         cons=["Tous les comptes doivent être à la même adresse"],
         link="https://www.spotify.com/fr/premium/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("320 kbps (pas de Lossless)", "Oui", "Jusqu'à 6 comptes", "100M+ titres"),
         location=None, region=None, scope="national"),
    dict(id="mkt-apple-music-family", category="Musique", name="Apple Music Family", price=16.99,
         promo=None, score=8.4, engagement="Sans engagement",
         pros=["Jusqu'à 6 comptes, Lossless et Audio spatial inclus", "Le moins cher des formules famille"],
         cons=["Nécessite un identifiant Apple par membre"],
         link="https://music.apple.com/fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Lossless 24-bit + Dolby Atmos", "Oui", "Jusqu'à 6 comptes", "100M+ titres"),
         location=None, region=None, scope="national"),
    dict(id="mkt-deezer-family", category="Musique", name="Deezer Family", price=19.99,
         promo=None, score=7.9, engagement="Sans engagement",
         pros=["Jusqu'à 6 comptes, profils enfants inclus", "Catalogue HiFi/FLAC inclus sans surcoût"],
         cons=["Tous les comptes doivent être au même foyer"],
         link="https://www.deezer.com/fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("FLAC/HiFi 16-bit", "Oui", "Jusqu'à 6 comptes", "~120M titres"),
         location=None, region=None, scope="national"),
    dict(id="mkt-amazon-music-family", category="Musique", name="Amazon Music Unlimited Family", price=16.99,
         promo=None, score=7.9, engagement="Sans engagement",
         pros=["Jusqu'à 6 comptes, Hi-Res inclus", "Bon rapport nombre de comptes/prix"],
         cons=["Moins de fonctions sociales que Spotify Family"],
         link="https://music.amazon.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Hi-Res 24-bit/192kHz", "Oui", "Jusqu'à 6 comptes", "100M+ titres"),
         location=None, region=None, scope="national"),
    dict(id="mkt-tidal-family", category="Musique", name="Tidal Family", price=16.99,
         promo=None, score=7.8, engagement="Sans engagement",
         pros=["Jusqu'à 6 comptes, Hi-Res et Dolby Atmos inclus", "Rémunération artiste mise en avant"],
         cons=["Catalogue légèrement plus restreint que Spotify"],
         link="https://tidal.com/fr", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=audio_attrs("Hi-Res 24-bit/192kHz + Dolby Atmos", "Oui", "Jusqu'à 6 comptes", "100M+ titres"),
         location=None, region=None, scope="national"),

    # --- Banque (6 nouveaux, tous nationaux : les banques françaises acceptent des clients partout en France) ---
    dict(id="mkt-banque-labanquepostale", category="Banque", name="La Banque Postale -- Formule Essentielle", price=2.0,
         promo=None, score=6.9, engagement="Sans engagement",
         pros=["Réseau le plus dense de France (bureaux de poste)", "Accessible sans condition de revenus stricte"],
         cons=["Offre bancaire de base peu compétitive face aux néobanques"],
         link="https://www.labanquepostale.fr/particuliers/tarifs.html", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque traditionnelle", "Standard (Visa Classic)", "2% + 2€ par paiement hors zone euro",
             "Aucune condition de revenus stricte, droit au compte facilité", "Oui, en bureau de poste", "Assurance moyens de paiement incluse"),
         location=None, region=None, scope="national"),
    dict(id="mkt-banque-hellobank", category="Banque", name="Hello bank!", price=0.0,
         promo=None, score=7.5, engagement="Sans engagement",
         pros=["Gratuit sous condition de revenus, adossé à BNP Paribas", "Retraits gratuits dans le réseau BNP Paribas"],
         cons=["Carte payante si les conditions de revenus ne sont pas remplies"],
         link="https://www.hellobank.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque en ligne (groupe BNP Paribas)", "Standard (Visa Classic)", "2% hors zone euro",
             "Sous condition de revenus (1 200€ net/mois)", "Oui, dans le réseau BNP Paribas", "Assurance moyens de paiement incluse"),
         location=None, region=None, scope="national"),
    dict(id="mkt-banque-societe-generale", category="Banque", name="Société Générale -- Formule Initiative", price=9.90,
         promo=None, score=6.3, engagement="Sans engagement",
         pros=["Réseau d'agences physiques dense", "Conseiller dédié"],
         cons=["Package payant même pour un usage basique", "Frais hors zone euro élevés"],
         link="https://particuliers.societegenerale.fr/tarifs.html", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque traditionnelle", "Standard (Visa Classic)", "2,5% + 2€ par paiement hors zone euro",
             "Sous condition de revenus (étude de dossier)", "Oui, en agence", "Assurance moyens de paiement incluse dans le package"),
         location=None, region=None, scope="national"),
    dict(id="mkt-banque-lcl", category="Banque", name="LCL -- Compte à composer Essentiel", price=6.50,
         promo=None, score=6.4, engagement="Sans engagement",
         pros=["Réseau d'agences physiques dans toute la France", "Offre modulable à la carte"],
         cons=["Tarifs additionnels vite cumulés selon les options choisies"],
         link="https://www.lcl.fr/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque traditionnelle", "Standard (Visa Classic)", "2% + 2,50€ par paiement hors zone euro",
             "Sous condition de revenus (étude de dossier)", "Oui, en agence", "Assurance moyens de paiement incluse dans le package"),
         location=None, region=None, scope="national"),
    dict(id="mkt-banque-nickel", category="Banque", name="Compte Nickel", price=2.08,
         promo="20€/an soit environ 1,67€/mois pour l'offre Nickel de base (formules Zen/Ultra plus chères)",
         score=8.0, engagement="Sans engagement",
         pros=["Ouverture en 5 minutes chez un buraliste partenaire, sans condition de revenus", "Dépôt d'espèces possible chez les buralistes partenaires"],
         cons=["Pas de découvert autorisé ni de chéquier"],
         link="https://www.compte-nickel.fr/", price_checked_at=CHECKED,
         annual_price=20.0, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Compte de paiement (buraliste partenaire)", "Standard (Mastercard)", "2% hors zone euro",
             "Aucune condition de revenus, interdits bancaires acceptés", "Oui, espèces chez les buralistes partenaires", "Assurance moyens de paiement incluse"),
         location=None, region=None, scope="national"),
    dict(id="mkt-banque-orange-bank", category="Banque", name="Orange Bank", price=0.0,
         promo=None, score=7.2, engagement="Sans engagement",
         pros=["Gratuit sous condition d'utilisation de la carte", "Cashback sur certains achats"],
         cons=["Pas d'agence physique, support à distance uniquement"],
         link="https://www.orangebank.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque en ligne / néobanque", "Standard (Mastercard)", "2% hors zone euro",
             "Aucune condition de revenus, dès 18 ans", "Non disponible", "Assurance paiement mobile incluse"),
         location=None, region=None, scope="national"),

    # --- Sport (6 nouveaux : 2 réseaux/apps nationaux + 4 salles indépendantes mono-ville) ---
    dict(id="mkt-gymlib", category="Sport", name="Gymlib", price=29.99,
         promo="Souvent pris en charge partiellement par l'employeur (avantage CSE/RH)", score=8.0,
         engagement="Sans engagement",
         pros=["Accès à des milliers de salles partenaires partout en France", "Cours collectifs, bien-être et coaching en ligne inclus"],
         cons=["Nombre de séances par mois limité selon la formule"],
         link="https://www.gymlib.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Agrégateur multi-activités", "Oui, milliers de salles partenaires en France",
             "Cours collectifs et bien-être inclus", "Réservation et suivi inclus", "Non inclus"),
         location=None, region=None, scope="national"),
    dict(id="mkt-decathlon-coach", category="Sport", name="Decathlon Coach Premium", price=4.99,
         promo=None, score=7.3, engagement="Sans engagement",
         pros=["Le moins cher du comparatif", "Programmes personnalisés par Decathlon, utilisable partout en France"],
         cons=["Pas d'accès à une salle physique, coaching app uniquement"],
         link="https://www.decathloncoach.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Application de coaching / Fitness à domicile", "Non applicable (app uniquement)",
             "Non inclus", "Suivi d'entraînement complet inclus", "Non applicable"),
         location=None, region=None, scope="national"),
    dict(id="mkt-vivactif-metz", category="Sport", name="Vivactif Metz", price=34.90,
         promo=None, score=6.8, engagement="Sans engagement",
         pros=["Salle indépendante avec suivi personnalisé", "Ambiance conviviale, coachs disponibles aux heures d'ouverture"],
         cons=["Un seul club, pas d'accès dans une autre ville", "Pas d'application de suivi dédiée"],
         link="https://www.vivactif-metz.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=29.0, setup_fee_note="Frais d'inscription, souvent offerts en période promotionnelle",
         attributes=sport_attrs("Salle de sport physique", "Non, club unique à Metz",
             "Cours collectifs inclus (renforcement, cardio)", "Non disponible", "1 invité par mois"),
         location="Metz", region="Grand Est", scope="local"),
    dict(id="mkt-onair-fitness-nancy", category="Sport", name="On Air Fitness Nancy", price=27.90,
         promo=None, score=6.9, engagement="Sans engagement",
         pros=["Plateau musculation et cardio récent", "Tarif compétitif pour une salle indépendante"],
         cons=["Un seul club, pas d'accès dans une autre ville"],
         link="https://www.onair-fitness.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=19.0, setup_fee_note="Frais d'inscription",
         attributes=sport_attrs("Salle de sport physique", "Non, club unique à Nancy",
             "Cours collectifs inclus", "Non disponible", "Non inclus"),
         location="Nancy", region="Grand Est", scope="local"),
    dict(id="mkt-cmg-sportsclub-paris", category="Sport", name="CMG Sports Club Paris", price=54.90,
         promo=None, score=7.0, engagement="Engagement 12 mois (69,90€/mois sans engagement)",
         pros=["Studios haut de gamme, cours collectifs premium (cycling, yoga, boxe)", "Coachs diplômés, encadrement soigné"],
         cons=["Uniquement les clubs parisiens du réseau", "Le plus cher des salles indépendantes du comparatif"],
         link="https://www.cmg-sportsclub.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Salle de sport physique", "Oui, entre les clubs CMG parisiens uniquement",
             "Cours collectifs premium inclus", "Réservation de cours incluse", "1 invité par séance selon formule"),
         location="Paris", region="Île-de-France", scope="local"),
    dict(id="mkt-magicform-toulouse", category="Sport", name="Magic Form Toulouse", price=22.90,
         promo="8 semaines offertes à l'inscription", score=6.7, engagement="Sans engagement",
         pros=["Tarif accessible pour une salle indépendante", "Créneaux étendus (ouvert tôt/tard)"],
         cons=["Un seul club à Toulouse, pas de réseau national"],
         link="https://www.magicform-toulouse.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=15.0, setup_fee_note="Frais d'inscription",
         attributes=sport_attrs("Salle de sport physique", "Non, club unique à Toulouse",
             "Cours collectifs inclus", "Non disponible", "Non inclus"),
         location="Toulouse", region="Occitanie", scope="local"),
]


def upgrade() -> None:
    op.bulk_insert(market_offers_table, OFFERS)


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        market_offers_table.delete().where(
            market_offers_table.c.id.in_([o["id"] for o in OFFERS])
        )
    )
