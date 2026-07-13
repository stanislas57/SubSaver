"""add Banque market offers (12 curated real offers) + rename category

Revision ID: a4f7c9e2b6d1
Revises: 81584e8b456a
Create Date: 2026-07-13 10:00:00.000000

Active la catégorie "Banque" du comparateur (jusqu'ici "Banque & Invest" en
COMING_SOON côté frontend) avec 12 offres couvrant les 3 familles du marché
français/européen : banques en ligne (BoursoBank, Fortuneo, Monabanq),
néo-banques (Revolut, N26, Sumeria/Lydia) et banques traditionnelles (BNP
Paribas, Crédit Agricole).

Périmètre strict : frais bancaires du quotidien uniquement (cotisation carte,
tenue de compte, assurance moyens de paiement, commissions paiement/retrait
étranger) -- jamais de crédit, découvert, épargne ou placement, cf. la même
règle déjà appliquée par BANK_FEE_ALIASES dans transaction_analyzer.py.

Renomme aussi la catégorie stockée "Banque & Invest" -> "Banque" (valeur plus
courte, cohérente avec le pattern Sport/Transport où CATEGORIES porte un nom
court et CATEGORY_DISPLAY_LABELS gère l'affichage étendu si besoin) : mise à
jour des abonnements déjà détectés par le moteur BANK_FEE_ALIASES pour rester
cohérents avec le nouveau libellé.

Prix vérifiés manuellement via recherche web le 13/07/2026.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = 'a4f7c9e2b6d1'
down_revision: Union[str, None] = '81584e8b456a'
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

CHECKED = "2026-07-13"


def banking_attrs(bank_type: str, card_level: str, foreign_fees: str, eligibility: str,
                   check_cash_deposit: str, insurance: str) -> list[dict]:
    """Attributs propres à la famille Banque : type d'établissement, niveau de
    carte, régime des paiements à l'étranger, condition d'accès, dépôt
    chèques/espèces et assurances incluses -- les 4 premiers s'affichent sur
    la carte (cf. ComparatorOfferCard), les 2 premiers en colonnes de tableau
    (cf. ComparatorOfferTable), même convention que sport_attrs/transport_attrs."""
    return [
        {"key": "bank_type", "label": "Type d'établissement", "value": bank_type},
        {"key": "card_level", "label": "Niveau de carte", "value": card_level},
        {"key": "foreign_fees", "label": "Paiements à l'étranger", "value": foreign_fees},
        {"key": "eligibility", "label": "Condition d'accès", "value": eligibility},
        {"key": "check_cash_deposit", "label": "Dépôt chèques / espèces", "value": check_cash_deposit},
        {"key": "insurance", "label": "Assurances incluses", "value": insurance},
    ]


OFFERS = [
    # --- Banques en ligne ---
    dict(id="mkt-banque-boursobank-welcom", category="Banque", name="BoursoBank -- Formule Welcom", price=0.0,
         promo=None, score=9.2, engagement="Sans engagement",
         pros=["Gratuite à vie, sans aucune condition de revenus", "Zéro frais sur les paiements et retraits dans le monde entier",
               "Ouverture 100% en ligne en quelques minutes"],
         cons=["Pas d'agence physique ni de dépôt d'espèces", "Assurances moyens de paiement basiques"],
         link="https://www.boursobank.com/banque/compte-bancaire/formule-welcome", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque en ligne", "Standard (Visa Classic)", "Gratuit dans le monde entier",
             "Aucune condition de revenus", "Chèques par courrier uniquement, pas d'espèces",
             "Assurance moyens de paiement de base incluse")),

    dict(id="mkt-banque-boursobank-ultim", category="Banque", name="BoursoBank -- Formule Ultim", price=0.0,
         promo="Gratuite dès 2 000€/mois de revenus nets ou 5 000€ d'épargne détenue, sinon 9€/mois", score=9.0,
         engagement="Sans engagement",
         pros=["Carte haut de gamme gratuite sous condition de revenus modérée", "Assurances voyage et médicales complètes",
               "Paiements et retraits gratuits partout dans le monde"],
         cons=["9€/mois si la condition de revenus/épargne n'est pas remplie", "Pas d'agence physique"],
         link="https://www.boursobank.com/banque/compte-bancaire/formule-ultim", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque en ligne", "Premium (Visa Ultim, éq. Gold)", "Gratuit dans le monde entier",
             "Gratuite dès 2 000€/mois de revenus nets (sinon 9€/mois)", "Chèques par courrier uniquement, pas d'espèces",
             "Assurances voyage, médicale et annulation incluses")),

    dict(id="mkt-banque-fortuneo-fosfo", category="Banque", name="Fortuneo -- Fosfo Mastercard", price=0.0,
         promo=None, score=8.8, engagement="Sans engagement",
         pros=["Gratuite à vie sans condition de revenus", "Zéro frais à l'étranger sur paiements et retraits",
               "Application mobile complète pour la gestion du budget"],
         cons=["Pas d'agence physique", "Assurances limitées sur la formule de base"],
         link="https://www.fortuneo.fr/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque en ligne", "Standard (Mastercard)", "Gratuit dans le monde entier",
             "Aucune condition de revenus", "Chèques par courrier uniquement, pas d'espèces",
             "Assurance moyens de paiement de base incluse")),

    dict(id="mkt-banque-fortuneo-gold", category="Banque", name="Fortuneo -- Gold Mastercard", price=0.0,
         promo="Gratuite dès 1 800€/mois de revenus nets ou 10 000€ d'épargne, sinon 6,90€/mois", score=8.9,
         engagement="Sans engagement",
         pros=["Carte Gold gratuite sous condition de revenus accessible", "Assurances voyage et médicales complètes",
               "Paiements et retraits gratuits partout dans le monde"],
         cons=["6,90€/mois si la condition de revenus/épargne n'est pas remplie", "Pas d'agence physique"],
         link="https://www.fortuneo.fr/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque en ligne", "Premium (Mastercard Gold)", "Gratuit dans le monde entier",
             "Gratuite dès 1 800€/mois de revenus nets (sinon 6,90€/mois)", "Chèques par courrier uniquement, pas d'espèces",
             "Assurances voyage, médicale et annulation incluses")),

    dict(id="mkt-banque-monabanq-pratiq-plus", category="Banque", name="Monabanq -- Formule Pratiq+", price=2.90,
         promo=None, score=7.4, engagement="Sans engagement",
         pros=["Dépôt de chèques et d'espèces via le réseau d'agences CIC", "Tarif accessible pour un compte avec service humain",
               "Sans condition de revenus"],
         cons=["Pas gratuite contrairement aux pures banques en ligne", "2% + 2€ de commission sur les paiements hors zone euro"],
         link="https://www.monabanq.com/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque en ligne (hybride, réseau CIC)", "Standard (Mastercard)",
             "2% + 2€ par paiement hors zone euro", "Aucune condition de revenus", "Oui, via le réseau d'agences CIC",
             "Assurance moyens de paiement incluse")),

    # --- Néo-banques & FinTech mobiles ---
    dict(id="mkt-banque-revolut-standard", category="Banque", name="Revolut -- Standard", price=0.0,
         promo=None, score=8.3, engagement="Sans engagement",
         pros=["Cartes virtuelles illimitées", "Change de devises au taux interbancaire en semaine",
               "Idéal pour les paiements internationaux ponctuels"],
         cons=["Retraits à l'étranger limités à 200€/mois puis commission de 2%", "Pas de dépôt de chèques ni d'espèces"],
         link="https://www.revolut.com/fr-FR/plans/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=4.99, setup_fee_note="Carte physique en option, livraison payante",
         attributes=banking_attrs("Néo-banque", "Standard", "Gratuit jusqu'à 200€/mois de retrait, puis 2%",
             "Aucune condition de revenus", "Non disponible", "Protection fraude de base incluse")),

    dict(id="mkt-banque-revolut-premium", category="Banque", name="Revolut -- Premium", price=9.99,
         promo=None, score=8.6, engagement="Sans engagement",
         pros=["Assurance voyage multi-trip incluse", "Retraits à l'étranger jusqu'à 400€/mois sans frais",
               "Cashback sur une sélection de paiements"],
         cons=["9,99€/mois même hors utilisation à l'étranger", "Support client uniquement par chat"],
         link="https://www.revolut.com/fr-FR/plans/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Néo-banque", "Premium", "Gratuit jusqu'à 400€/mois de retrait",
             "Aucune condition de revenus", "Non disponible", "Assurance voyage multi-trip et retard bagages incluses")),

    dict(id="mkt-banque-n26-standard", category="Banque", name="N26 -- Standard", price=0.0,
         promo=None, score=8.4, engagement="Sans engagement",
         pros=["Ouverture 100% mobile en moins de 10 minutes", "Paiements par carte à l'étranger sans frais",
               "Interface et catégorisation des dépenses très lisibles"],
         cons=["3 retraits gratuits par mois en zone euro puis frais", "Pas de dépôt de chèques ni d'espèces"],
         link="https://n26.com/fr-fr/compte-bancaire", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Néo-banque", "Standard (Mastercard)", "Paiements gratuits, 3 retraits gratuits/mois puis 1,7%",
             "Aucune condition de revenus", "Non disponible", "Non incluse sur la formule Standard")),

    dict(id="mkt-banque-n26-you", category="Banque", name="N26 -- You", price=9.90,
         promo=None, score=8.7, engagement="Sans engagement",
         pros=["Retraits illimités gratuits partout dans le monde", "Assurance voyage et assistance médicale incluses",
               "Sous-comptes Espaces pour organiser son budget courant"],
         cons=["9,90€/mois fixe quelle que soit l'utilisation", "Pas de dépôt de chèques ni d'espèces"],
         link="https://n26.com/fr-fr/compte-bancaire", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Néo-banque", "Premium", "Gratuit dans le monde entier",
             "Aucune condition de revenus", "Non disponible", "Assurance voyage, médicale et vol de téléphone incluses")),

    dict(id="mkt-banque-sumeria-lydia", category="Banque", name="Sumeria (Lydia) -- Compte courant", price=0.0,
         promo=None, score=7.8, engagement="Sans engagement",
         pros=["Paiements entre proches instantanés et gratuits", "Cartes virtuelles personnalisables",
               "Gestion de budget en temps réel très intuitive"],
         cons=["2% + 1€ de commission sur les paiements hors zone euro", "Pas de dépôt de chèques ni d'espèces"],
         link="https://sumeria.fr/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Néo-banque", "Standard", "2% + 1€ par paiement hors zone euro",
             "Aucune condition de revenus, dès 16 ans", "Non disponible", "Protection fraude de base incluse")),

    # --- Banques traditionnelles ---
    dict(id="mkt-banque-bnp-esprit-libre", category="Banque", name="BNP Paribas -- Esprit Libre", price=7.50,
         promo=None, score=6.2, engagement="Sans engagement",
         pros=["Réseau d'agences physiques dans toute la France", "Conseiller dédié et support téléphonique",
               "Dépôt de chèques et d'espèces en agence"],
         cons=["7,50€/mois pour une simple carte Visa Classic", "2% + 2,50€ de commission sur les paiements hors zone euro"],
         link="https://mabanque.bnpparibas/fr/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque traditionnelle", "Standard (Visa Classic)", "2% + 2,50€ par paiement hors zone euro",
             "Sous condition de revenus (étude de dossier)", "Oui, en agence", "Assurance moyens de paiement incluse dans le package")),

    dict(id="mkt-banque-ca-globe-trotter", category="Banque", name="Crédit Agricole -- Formule Globe-Trotter 18-30",
         price=2.0, promo="Réservée aux 18-30 ans", score=8.1, engagement="Sans engagement",
         pros=["2€/mois seulement pour les 18-30 ans", "Zéro frais de paiement et de retrait à l'étranger",
               "Réseau d'agences physiques pour dépôt chèques/espèces"],
         cons=["Réservée aux 18-30 ans (bascule ensuite vers une offre standard plus chère, ~8€/mois)",
               "Conditions variables selon la caisse régionale"],
         link="https://www.credit-agricole.fr/particulier/tarifs.html", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=banking_attrs("Banque traditionnelle", "Standard (Visa Classic)", "Gratuit dans le monde entier",
             "Réservée aux 18-30 ans", "Oui, en agence", "Assurance moyens de paiement incluse")),
]


def upgrade() -> None:
    op.bulk_insert(market_offers_table, OFFERS)

    # Réaligne les abonnements déjà détectés par BANK_FEE_ALIASES (frais
    # bancaires) sur le nouveau nom de catégorie, pour que le comparateur
    # retrouve bien le prix actuel de l'utilisateur sous la nouvelle étiquette.
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE subscriptions SET category = 'Banque' WHERE category = 'Banque & Invest'"))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        market_offers_table.delete().where(market_offers_table.c.category == "Banque")
    )
    conn.execute(sa.text("UPDATE subscriptions SET category = 'Banque & Invest' WHERE category = 'Banque'"))
