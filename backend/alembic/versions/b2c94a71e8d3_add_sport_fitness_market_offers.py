"""add Sport & Fitness market offers (10 curated real offers)

Revision ID: b2c94a71e8d3
Revises: f4b8d1c6a930
Create Date: 2026-07-12 09:00:00.000000

Active la catégorie "Sport" du comparateur (jusqu'ici en COMING_SOON côté
frontend) avec 10 offres réelles couvrant les 4 sous-familles du marché :
salle de sport physique, application de coaching/fitness à domicile,
agrégateur multi-activités et streaming sportif. Prix vérifiés manuellement
via recherche web le 12/07/2026 (cf. décision validée : pas de scraping ni
d'API tierce temps réel, mise à jour manuelle périodique -- même politique
que Streaming/Musique/Telephonie).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = 'b2c94a71e8d3'
down_revision: Union[str, None] = 'f4b8d1c6a930'
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

CHECKED = "2026-07-12"


def sport_attrs(subcategory: str, multi_club: str, group_classes: str, mobile_app: str, guest_invite: str) -> list[dict]:
    """Attributs propres à la famille Sport : sous-catégorie (physique / appli
    coaching / agrégateur / streaming), accès multi-salles, cours collectifs
    avec coach, appli mobile incluse et invitation d'un proche -- mêmes 4
    colonnes affichées par ComparatorOfferCard/Table quelle que soit l'offre."""
    return [
        {"key": "subcategory", "label": "Sous-catégorie", "value": subcategory},
        {"key": "multi_club_access", "label": "Accès multi-salles", "value": multi_club},
        {"key": "group_classes", "label": "Cours collectifs", "value": group_classes},
        {"key": "mobile_app", "label": "Application mobile", "value": mobile_app},
        {"key": "guest_invite", "label": "Invitation d'un proche", "value": guest_invite},
    ]


OFFERS = [
    dict(id="mkt-basicfit-comfort", category="Sport", name="Basic-Fit Comfort", price=24.99,
         promo=None, score=8.6, engagement="Sans engagement",
         pros=["Le plus grand réseau de France (300+ clubs)", "Accès 24h/24, 7j/7", "Aucun engagement"],
         cons=["Facturé par cycles de 4 semaines (13 prélèvements/an, pas 12)",
               "Cours collectifs et accès Europe réservés aux formules supérieures"],
         link="https://www.basic-fit.com/fr-fr/prix", price_checked_at=CHECKED,
         annual_price=324.87, setup_fee=19.99,
         setup_fee_note="Frais d'inscription, souvent offerts pendant les périodes promotionnelles",
         attributes=sport_attrs("Salle de sport physique", "Oui, tous les clubs Basic-Fit en France",
                                 "Non inclus (formule Premium requise)", "Suivi d'entraînement inclus",
                                 "Non inclus (formule Premium requise)")),

    dict(id="mkt-fitnesspark-ultimate", category="Sport", name="Fitness Park Ultimate", price=50.0,
         promo="Tarif d'appel à 19€/4 semaines les premiers mois (engagement 12 mois)", score=7.6,
         engagement="Engagement 12 mois (60€/4 semaines sans engagement)",
         pros=["Formule la plus complète, coaching en ligne inclus", "1 invité par séance",
               "-10% sur les achats en boutique"],
         cons=["Le plus cher du comparatif salles de sport", "Meilleur tarif conditionné à un engagement 12 mois"],
         link="https://www.fitnesspark.fr/nos-offres/formule-ultimate/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Salle de sport physique", "Oui, réseau Fitness Park national",
                                 "Coaching en ligne + cours collectifs en club", "Application de coaching incluse",
                                 "1 invité par séance")),

    dict(id="mkt-neoness-first", category="Sport", name="Neoness", price=19.90,
         promo=None, score=8.5, engagement="Sans engagement",
         pros=["Formule unique, tout inclus sans complexité", "Cours collectifs illimités dès le premier prix",
               "Sans engagement"],
         cons=["Réseau plus restreint (~100 clubs, principalement urbains)", "Frais d'inscription à prévoir au départ"],
         link="https://www.neoness.fr/abonnements", price_checked_at=CHECKED,
         annual_price=None, setup_fee=49.0,
         setup_fee_note="Carte d'accès + kit de bienvenue (réduit dès 20€ en tarif étudiant)",
         attributes=sport_attrs("Salle de sport physique", "Oui, réseau Neoness (clubs urbains)",
                                 "Illimités, inclus dans la formule unique",
                                 "Suivi d'entraînement + réservation de cours", "Non inclus")),

    dict(id="mkt-orangebleue-enjoy", category="Sport", name="L'Orange Bleue Enjoy", price=29.90,
         promo="8 semaines offertes à l'inscription", score=6.7,
         engagement="Engagement 24-25 mois (reconduction tacite)",
         pros=["Maillage territorial fort, présent dans de nombreuses villes moyennes",
               "Cours collectifs et coachs diplômés inclus"],
         cons=["Engagement long (24-25 mois)",
               "Pack adhérent + facturation par cycle de 4 semaines alourdissent le coût réel"],
         link="https://www.lorangebleue.fr/offre/", price_checked_at=CHECKED,
         annual_price=388.70, setup_fee=60.0,
         setup_fee_note="Pack adhérent obligatoire à l'inscription (dès 20€ en tarif étudiant)",
         attributes=sport_attrs("Salle de sport physique", "Club de proximité (réseau national 400+ clubs)",
                                 "Illimités avec coachs diplômés",
                                 "Suivi + programme personnalisé via l'appli", "Non inclus")),

    dict(id="mkt-keepcool-prime", category="Sport", name="Keepcool Prime", price=49.90,
         promo=None, score=7.3, engagement="Sans engagement",
         pros=["Positionnement sport santé (cardio, zen, appareils guidés)",
               "Cours collectifs illimités inclus en formule Prime", "Sans engagement"],
         cons=["Le plus cher des salles discount du comparatif",
               "Formule d'entrée à 29,90€ n'inclut pas les cours collectifs"],
         link="https://www.keepcool.fr/nos-offres", price_checked_at=CHECKED,
         annual_price=None, setup_fee=49.0,
         setup_fee_note="Frais d'inscription (~39€) + carte d'accès (~10€)",
         attributes=sport_attrs("Salle de sport physique", "Oui, réseau national KeepCool (300+ clubs)",
                                 "Illimités (formule Prime)", "Suivi + réservation de cours", "Non inclus")),

    dict(id="mkt-classpass", category="Sport", name="ClassPass", price=39.99,
         promo="Essai gratuit à l'inscription", score=7.8, engagement="Sans engagement, résiliable à tout moment",
         pros=["Accès à des centaines de salles et studios partenaires (yoga, boxe, pilates, piscine...) sans multiplier les abonnements",
               "Zéro engagement", "Idéal pour varier les activités"],
         cons=["Système de crédits : les cours les plus demandés coûtent plus cher et peuvent être complets",
               "Prix et disponibilité variables selon la ville"],
         link="https://classpass.fr/plans", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Agrégateur multi-activités",
                                 "Oui, centaines de salles/studios partenaires (selon ville)",
                                 "Selon crédits : yoga, boxe, pilates, piscine, etc.",
                                 "Réservation via l'appli ClassPass", "Non inclus")),

    dict(id="mkt-freeletics-coach", category="Sport", name="Freeletics Coach", price=7.49,
         promo="Facturé annuellement (89,99€/an)", score=8.0, engagement="Engagement annuel",
         pros=["Coaching 100% par IA, plans adaptatifs selon la progression",
               "Musculation au poids du corps, aucun matériel requis", "Le moins cher du comparatif applications"],
         cons=["Pas de coach humain ni de communauté locale", "Nécessite de la motivation personnelle pour rester régulier"],
         link="https://www.freeletics.com/fr/training/coach/get/", price_checked_at=CHECKED,
         annual_price=89.99, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Application de coaching / Fitness à domicile", "Non applicable (application seule)",
                                 "Non applicable (entraînement individuel guidé par IA)",
                                 "Coeur du service : appli iOS/Android avec plans personnalisés", "Non inclus")),

    dict(id="mkt-strava-premium", category="Sport", name="Strava Premium", price=9.99,
         promo="Formule annuelle à 59,99€ (-45% vs mensuel)", score=8.4, engagement="Sans engagement",
         pros=["Analyse de performance avancée (segments, comparaisons, tendances)",
               "Communauté de sportifs très active", "Compatible avec la majorité des montres/capteurs du marché"],
         cons=["Ne remplace pas un plan d'entraînement structuré",
               "Fonctions clés (segments, analyse) réservées au Premium"],
         link="https://www.strava.com/subscribe", price_checked_at=CHECKED,
         annual_price=59.99, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Application de coaching / Fitness à domicile", "Non applicable (application seule)",
                                 "Non applicable (suivi individuel)",
                                 "Coeur du service : suivi GPS, segments, communauté", "Non inclus")),

    dict(id="mkt-zwift", category="Sport", name="Zwift", price=19.99,
         promo="Essai gratuit de 14 jours", score=8.1, engagement="Sans engagement",
         pros=["Entraînement cyclisme/course virtuel immersif (mondes + parcours réels)",
               "Courses et sorties de groupe en direct", "Plans d'entraînement structurés inclus"],
         cons=["Nécessite un home-trainer connecté (matériel non fourni, coût additionnel)",
               "Moins pertinent sans pratique régulière du vélo ou de la course à pied"],
         link="https://www.zwift.com/pricing", price_checked_at=CHECKED,
         annual_price=199.99, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Application de coaching / Fitness à domicile", "Non applicable (application seule)",
                                 "Non applicable (courses et sorties virtuelles en groupe)",
                                 "Coeur du service : appli + plateforme d'entraînement connectée", "Non inclus")),

    dict(id="mkt-dazn", category="Sport", name="DAZN", price=14.99,
         promo="9,99€/mois avec engagement 12 mois", score=7.2,
         engagement="Sans engagement (14,99€/mois) ou engagement 12 mois (9,99€/mois)",
         pros=["Catalogue multisport (combat, tennis, sports US, football international...)",
               "Disponible sur tous les écrans (TV, mobile, web)", "Offre -26 ans à 10€/mois sans engagement"],
         cons=["La Ligue 1 nécessite l'offre DAZN + Ligue 1+, plus chère (16,99€ à 21,99€/mois)",
               "Catalogue variable selon les droits de diffusion acquis"],
         link="https://www.dazn.com/fr-FR/help/articles/25297926616349-presentation-des-offres-dazn-accessibles-en-france-metropolitaine-aux-personnes-physiques",
         price_checked_at=CHECKED, annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=sport_attrs("Streaming sportif", "Non applicable (service de streaming)",
                                 "Non applicable (retransmission uniquement)",
                                 "Appli disponible sur tous supports (TV, mobile, web)", "Non inclus")),
]


def upgrade() -> None:
    op.bulk_insert(market_offers_table, OFFERS)


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        market_offers_table.delete().where(market_offers_table.c.category == "Sport")
    )
