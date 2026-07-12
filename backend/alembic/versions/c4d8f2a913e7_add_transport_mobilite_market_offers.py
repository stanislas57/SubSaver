"""add Transport & Mobilité market offers (30 curated real offers)

Revision ID: c4d8f2a913e7
Revises: b2c94a71e8d3
Create Date: 2026-07-12 15:00:00.000000

Active la catégorie "Transport" du comparateur (jusqu'ici en COMING_SOON côté
frontend) avec 30 offres couvrant les 11 régions françaises (réseaux TER
régionaux), 16 réseaux urbains (dont les 2 cas de gratuité totale Dunkerque et
Montpellier) et 4 offres nationales (SNCF, covoiturage domicile-travail).

Prix vérifiés manuellement via recherche web le 12/07/2026 pour les réseaux
Navigo, Vélib', TCL Lyon, RTM Marseille, Tisséo Toulouse, SNCF Carte Avantage/
Max, BlaBlaCar Daily, Dunkerque et Montpellier. Les autres réseaux urbains et
régionaux portent un tarif INDICATIF explicitement signalé dans `promo`/`cons`
(grille tarifaire à confirmer localement) plutôt qu'un chiffre présenté comme
vérifié -- cf. décision validée : pas de scraping ni d'API tierce temps réel,
mise à jour manuelle périodique (même politique que Sport/Streaming/Musique/
Telephonie). La stratégie d'ingestion automatisée pour élargir la couverture
aux 300+ réseaux restants est documentée séparément dans
`backend/scripts/ingest_transport_offers.py` (API transport.data.gouv.fr).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision: str = 'c4d8f2a913e7'
down_revision: Union[str, None] = 'b2c94a71e8d3'
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
INDICATIVE = "Tarif indicatif -- grille tarifaire à confirmer localement (variable selon zone/trajet)"


def transport_attrs(scope: str, region: str, covered_cities: str, aom_name: str, mobility_type: str,
                     free_transport: str, employer_reimbursement: str, flexible_usage: str) -> list[dict]:
    """Attributs propres à la famille Transport : portée géographique, région,
    villes/zone desservie, autorité organisatrice (AOM), type de mobilité,
    gratuité, prise en charge employeur et adéquation au télétravail hybride
    -- consommés par le moteur de matching géographique côté front, pas
    seulement affichés (contrairement aux 4 premiers attributs des autres
    catégories, ici les 8 servent tous à `transportGeo.ts`)."""
    return [
        {"key": "scope", "label": "Portée", "value": scope},
        {"key": "region", "label": "Région", "value": region},
        {"key": "covered_cities", "label": "Villes / zone desservie", "value": covered_cities},
        {"key": "aom_name", "label": "Autorité organisatrice (AOM)", "value": aom_name},
        {"key": "mobility_type", "label": "Type de mobilité", "value": mobility_type},
        {"key": "free_transport", "label": "Gratuité", "value": free_transport},
        {"key": "employer_reimbursement", "label": "Prise en charge employeur", "value": employer_reimbursement},
        {"key": "flexible_usage", "label": "Adapté au télétravail hybride", "value": flexible_usage},
    ]


OFFERS = [
    # --- Urbain local (16, dont Dunkerque et Montpellier 100% gratuits) ---
    dict(id="mkt-transport-navigo", category="Transport", name="Navigo Mois (Île-de-France Mobilités)",
         price=90.80, promo=None, score=7.0, engagement="Sans engagement",
         pros=["Réseau le plus dense de France (métro, RER, bus, tram)",
               "Valable sur tout le réseau Île-de-France, toutes zones",
               "Remboursement employeur obligatoire à 50%"],
         cons=["Le plus cher des abonnements urbains de France", "Hausse tarifaire au 1er janvier 2026 (+2,3%)"],
         link="https://www.iledefrance-mobilites.fr/titres-et-tarifs/detail/forfait-navigo-mois",
         price_checked_at=CHECKED, annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Île-de-France", "Paris et toute l'Île-de-France",
             "Île-de-France Mobilités", "Transport en commun (métro/RER/bus/tram)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-velib", category="Transport", name="Vélib' Métropole -- V-Max", price=9.30,
         promo=None, score=8.2, engagement="Sans engagement",
         pros=["Le moins cher des offres parisiennes", "Complète idéalement un Navigo pour le dernier kilomètre",
               "Vélos électriques inclus"],
         cons=["2 trajets électriques/jour inclus puis facturés 0,50€", "Uniquement Paris et petite couronne"],
         link="https://www.velib-metropole.fr/offers", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Île-de-France", "Paris et petite couronne",
             "Île-de-France Mobilités", "Vélo en libre-service (électrique inclus)", "Non",
             "Éligible au Forfait Mobilités Durables (jusqu'à 800€/an, facultatif)", "Oui (usage libre, sans trajet fixe)")),

    dict(id="mkt-transport-tcl-lyon", category="Transport", name="TCL Lyon -- Abonnement 26-64 ans (zones 1+2)",
         price=75.90, promo=None, score=7.6, engagement="Sans engagement",
         pros=["4 lignes de métro + tramway étendu", "Zones 1+2 couvrent l'essentiel de la métropole"],
         cons=["Tarif \"toutes zones\" à 90€/mois pour la grande périphérie", "Hausse au 1er septembre 2026"],
         link="https://www.tcl.fr/titres-et-tarifs/tarification-tcl/les-abonnements-tcl", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Auvergne-Rhône-Alpes", "Lyon et métropole (zones 1+2)",
             "Sytral Mobilités", "Transport en commun (métro/tram/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-rtm-marseille", category="Transport", name="RTM Marseille -- Pass Permanent Zone Bleue",
         price=40.0, promo="Avec la participation employeur obligatoire, revient à 20€/mois net pour un salarié",
         score=7.9, engagement="Sans engagement",
         pros=["Gratuit pour tous les jeunes jusqu'à 25 ans inclus depuis septembre 2025",
               "20€/mois net pour un salarié après remboursement employeur"],
         cons=["Zone Intégral (avec TER) grimpe à 68€/mois", "Zones tarifaires parfois complexes à choisir"],
         link="https://www.rtm.fr/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Provence-Alpes-Côte d'Azur", "Marseille (zone bleue)",
             "RTM / Métropole Aix-Marseille-Provence", "Transport en commun (métro/tram/bus)",
             "Non (gratuit pour les -25 ans)", "50% obligatoire (Code du travail Art. L3261-2)",
             "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-tisseo-toulouse", category="Transport", name="Tisséo Toulouse -- Abonnement tout public",
         price=50.50, promo="59€ si paiement comptant, 50,50€/mois par prélèvement automatique", score=7.3,
         engagement="Sans engagement",
         pros=["3ème réseau de métro automatique de France", "Tarif réduit via prélèvement automatique"],
         cons=["Hausse tarifaire au 1er juillet 2026", "Réseau moins étendu que Lyon/Marseille en périphérie"],
         link="https://www.tisseo.fr/acheter/tarifs", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Occitanie", "Toulouse Métropole", "Tisséo Collectivités",
             "Transport en commun (métro/tram/bus)", "Non", "50% obligatoire (Code du travail Art. L3261-2)",
             "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-lignesazur-nice", category="Transport", name="Lignes d'Azur Nice -- Abonnement mensuel",
         price=30.0, promo=INDICATIVE, score=7.0, engagement="Sans engagement",
         pros=["Parmi les abonnements urbains les moins chers de France", "2 lignes de tramway + réseau bus dense"],
         cons=["Prix indicatif : à confirmer sur lignesdazur.com selon zone", "Réseau moins étendu que les grandes métropoles"],
         link="https://www.lignesdazur.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Provence-Alpes-Côte d'Azur", "Nice",
             "Métropole Nice Côte d'Azur", "Transport en commun (tram/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-tan-nantes", category="Transport", name="TAN / Naolib Nantes -- Abonnement mensuel",
         price=50.0, promo=INDICATIVE, score=6.9, engagement="Sans engagement",
         pros=["Tramway historique + Busway à haut niveau de service", "Vélo en libre-service Bicloo disponible en complément"],
         cons=["Prix indicatif : à confirmer sur naolib.fr", "Réseau moins étendu en grande périphérie"],
         link="https://www.naolib.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Pays de la Loire", "Nantes Métropole",
             "Nantes Métropole", "Transport en commun (tram/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-cts-strasbourg", category="Transport", name="CTS Strasbourg -- Abonnement mensuel",
         price=48.0, promo=INDICATIVE, score=6.9, engagement="Sans engagement",
         pros=["Réseau de tramway le plus étendu de France (6 lignes)", "Vélhop (vélo libre-service) en complément"],
         cons=["Prix indicatif : à confirmer sur cts-strasbourg.eu", "Zones tarifaires selon distance au centre"],
         link="https://www.cts-strasbourg.eu/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Grand Est", "Strasbourg Eurométropole",
             "Strasbourg Eurométropole", "Transport en commun (tram/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-tam-montpellier", category="Transport", name="TaM Montpellier -- Pass gratuité résidents",
         price=0.0, promo="Gratuit à vie pour tout résident de la Métropole sur simple justificatif de domicile, renouvelable chaque année",
         score=9.8, engagement="Sans engagement",
         pros=["100% gratuit pour les résidents, sans condition de ressources", "5 lignes de tramway",
               "Gratuit depuis le 21/12/2023 pour toute la Métropole"],
         cons=["Ticket/abonnement payant obligatoire pour les non-résidents", "Pass à demander puis renouveler chaque année"],
         link="https://www.tam-voyages.com/presentation/?rub_code=72", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Occitanie", "Montpellier Méditerranée Métropole",
             "Montpellier Méditerranée Métropole", "Transport en commun (tram/bus)",
             "Oui, gratuit pour tous les résidents de la Métropole (Pass gratuité)",
             "Non applicable (déjà gratuit)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-tbm-bordeaux", category="Transport", name="TBM Bordeaux -- Abonnement mensuel",
         price=45.0, promo=INDICATIVE, score=6.8, engagement="Sans engagement",
         pros=["3 lignes de tramway + réseau bus dense", "Vélos en libre-service VCub inclus dans certaines formules"],
         cons=["Prix indicatif : à confirmer sur infotbm.com", "Zones tarifaires selon distance au centre"],
         link="https://www.infotbm.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Nouvelle-Aquitaine", "Bordeaux Métropole",
             "Bordeaux Métropole", "Transport en commun (tram/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-ilevia-lille", category="Transport", name="Ilévia Lille -- Abonnement mensuel",
         price=50.0, promo=INDICATIVE, score=6.8, engagement="Sans engagement",
         pros=["2 lignes de métro automatique (VAL) + tramway", "Réseau bus dense sur toute la métropole"],
         cons=["Prix indicatif : à confirmer sur ilevia.fr", "Zones tarifaires selon distance au centre"],
         link="https://www.ilevia.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Hauts-de-France", "Métropole Européenne de Lille",
             "Métropole Européenne de Lille", "Transport en commun (métro/tram/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-star-rennes", category="Transport", name="STAR Rennes -- Abonnement mensuel",
         price=43.0, promo=INDICATIVE, score=6.9, engagement="Sans engagement",
         pros=["Métro automatique (2 lignes) + réseau bus dense", "Métropole compacte, bonne couverture"],
         cons=["Prix indicatif : à confirmer sur star.fr", "Zones tarifaires selon distance au centre"],
         link="https://www.star.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Bretagne", "Rennes Métropole",
             "Rennes Métropole", "Transport en commun (métro/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-stan-nancy", category="Transport", name="Stan Nancy -- Abonnement mensuel",
         price=40.0, promo=INDICATIVE, score=6.7, engagement="Sans engagement",
         pros=["Réseau de bus à haut niveau de service (BHNS)", "Bonne couverture du Grand Nancy"],
         cons=["Prix indicatif : à confirmer sur reseau-stan.com", "Pas de métro/tramway lourd"],
         link="https://www.reseau-stan.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Grand Est", "Métropole du Grand Nancy",
             "Métropole du Grand Nancy", "Transport en commun (bus/BHNS)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-lemet-metz", category="Transport", name="Le Met' Metz -- Abonnement mensuel",
         price=38.0, promo=INDICATIVE, score=6.6, engagement="Sans engagement",
         pros=["Réseau de bus à haut niveau de service (Mettis)", "Tarif parmi les plus accessibles de l'Est"],
         cons=["Prix indicatif : à confirmer sur lemet.fr", "Pas de métro/tramway lourd"],
         link="https://www.lemet.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Grand Est", "Metz Métropole",
             "Metz Métropole", "Transport en commun (bus/BHNS)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-tag-grenoble", category="Transport", name="TAG (M Tag) Grenoble -- Abonnement mensuel",
         price=46.0, promo=INDICATIVE, score=6.9, engagement="Sans engagement",
         pros=["Réseau de tramway étendu (5 lignes)", "Bonne intégration avec le vélo en libre-service Métrovélo"],
         cons=["Prix indicatif : à confirmer sur mtag.fr", "Zones tarifaires selon distance au centre"],
         link="https://www.mtag.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Auvergne-Rhône-Alpes", "Grenoble-Alpes Métropole",
             "Grenoble-Alpes Métropole", "Transport en commun (tram/bus)", "Non",
             "50% obligatoire (Code du travail Art. L3261-2)", "Non (abonnement mensuel fixe)")),

    dict(id="mkt-transport-dkbus-dunkerque", category="Transport", name="DK'BUS Dunkerque -- Réseau 100% gratuit",
         price=0.0, promo="Le plus grand réseau de transport gratuit d'Europe, sans condition ni validation",
         score=9.9, engagement="Sans engagement",
         pros=["100% gratuit, sans carte ni validation, depuis septembre 2018", "16 lignes dont 6 lignes Chrono à haute fréquence"],
         cons=["Réseau limité au territoire de la Communauté urbaine (pas de train/RER)",
               "Pas d'équivalent pour les trajets hors agglomération"],
         link="https://www.dkbus.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Urbain local", "Hauts-de-France", "Communauté urbaine de Dunkerque",
             "Communauté urbaine de Dunkerque", "Transport en commun (bus)",
             "Oui, gratuit pour tous, sans condition ni justificatif", "Non applicable (déjà gratuit)",
             "Non (abonnement mensuel fixe)")),

    # --- Régional TER (10 régions, hors Île-de-France déjà couverte par Navigo) ---
    dict(id="mkt-transport-ter-aura", category="Transport", name="TER Auvergne-Rhône-Alpes (carte OùRA!)",
         price=70.0, promo=INDICATIVE, score=6.5, engagement="Sans engagement",
         pros=["Couvre toute la région (trains + cars régionaux)", "Carnets et cartes à l'usage disponibles"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur ter.sncf.com/auvergne-rhone-alpes",
               "Fréquences réduites en zone rurale"],
         link="https://www.ter.sncf.com/auvergne-rhone-alpes", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Auvergne-Rhône-Alpes", "Toute la région (trains + cars régionaux)",
             "Région Auvergne-Rhône-Alpes", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-lio-occitanie", category="Transport", name="Lio (Région Occitanie)", price=55.0,
         promo=INDICATIVE, score=6.4, engagement="Sans engagement",
         pros=["Couvre toute la région Occitanie (trains + cars)", "Tarifs jeunes/étudiants avantageux"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur lio-occitanie.fr", "Réseau étendu, fréquences variables"],
         link="https://www.lio-occitanie.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Occitanie", "Toute la région (trains + cars régionaux)",
             "Région Occitanie", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-modalis-nouvelleaquitaine", category="Transport", name="Modalis (Région Nouvelle-Aquitaine)",
         price=50.0, promo=INDICATIVE, score=6.4, engagement="Sans engagement",
         pros=["Couvre toute la région, la plus grande de France", "Combine trains régionaux et cars"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur modalis.fr", "Grande superficie, fréquences variables"],
         link="https://www.modalis.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Nouvelle-Aquitaine", "Toute la région (trains + cars régionaux)",
             "Région Nouvelle-Aquitaine", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-passpass-hautsdefrance", category="Transport", name="Pass Pass (Région Hauts-de-France)",
         price=45.0, promo=INDICATIVE, score=6.3, engagement="Sans engagement",
         pros=["Titre unique valable TER + réseaux urbains partenaires", "Bonne couverture autour de Lille/Amiens"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur pass-pass.fr", "Fréquences réduites en zone rurale"],
         link="https://www.pass-pass.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Hauts-de-France", "Toute la région (trains + cars régionaux)",
             "Région Hauts-de-France", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-fluo-grandest", category="Transport", name="Fluo Grand Est", price=55.0,
         promo=INDICATIVE, score=6.4, engagement="Sans engagement",
         pros=["Titre unique TER + réseaux urbains partenaires (Stan, CTS...)", "Bonne desserte transfrontalière"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur fluo.eu", "Fréquences réduites en zone rurale"],
         link="https://www.fluo.eu/fr/grand-est", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Grand Est", "Toute la région (trains + cars régionaux)",
             "Région Grand Est", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-breizhgo-bretagne", category="Transport", name="BreizhGo (Région Bretagne)", price=50.0,
         promo=INDICATIVE, score=6.5, engagement="Sans engagement",
         pros=["Titre unique TER + cars + certains réseaux urbains", "Bonne couverture du littoral"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur breizhgo.bzh", "Fréquences réduites en zone rurale"],
         link="https://www.breizhgo.bzh/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Bretagne", "Toute la région (trains + cars régionaux)",
             "Région Bretagne", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-aleop-paysdelaloire", category="Transport", name="Aléop (Région Pays de la Loire)",
         price=48.0, promo=INDICATIVE, score=6.4, engagement="Sans engagement",
         pros=["Titre unique TER + cars régionaux", "Bonne desserte autour de Nantes/Angers/Le Mans"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur aleop.paysdelaloire.fr", "Fréquences réduites en zone rurale"],
         link="https://aleop.paysdelaloire.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Pays de la Loire", "Toute la région (trains + cars régionaux)",
             "Région Pays de la Loire", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-nomad-normandie", category="Transport", name="Nomad (Région Normandie)", price=45.0,
         promo=INDICATIVE, score=6.3, engagement="Sans engagement",
         pros=["Titre unique TER + cars régionaux", "Bonne desserte autour de Rouen/Caen"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur nomad-normandie.fr", "Fréquences réduites en zone rurale"],
         link="https://www.nomad-normandie.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Normandie", "Toute la région (trains + cars régionaux)",
             "Région Normandie", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-zou-paca", category="Transport", name="Zou! (Région Provence-Alpes-Côte d'Azur)",
         price=52.0, promo=INDICATIVE, score=6.4, engagement="Sans engagement",
         pros=["Titre unique TER + cars régionaux", "Bonne desserte du littoral méditerranéen"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur zouprovencealpescotedazur.fr", "Fréquences réduites hors littoral"],
         link="https://www.zouprovencealpescotedazur.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Provence-Alpes-Côte d'Azur", "Toute la région (trains + cars régionaux)",
             "Région Provence-Alpes-Côte d'Azur", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    dict(id="mkt-transport-remi-centrevaldeloire", category="Transport", name="Rémi (Région Centre-Val de Loire)",
         price=42.0, promo=INDICATIVE, score=6.3, engagement="Sans engagement",
         pros=["Titre unique TER + cars régionaux", "Tarifs parmi les plus bas des régions"],
         cons=["Prix indicatif : variable selon trajet, à confirmer sur remi-centrevaldeloire.fr", "Fréquences réduites en zone rurale"],
         link="https://www.remi-centrevaldeloire.fr/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("Régional (TER)", "Centre-Val de Loire", "Toute la région (trains + cars régionaux)",
             "Région Centre-Val de Loire", "Train régional (TER) + cars", "Non",
             "50% obligatoire sur l'abonnement domicile-travail", "Oui (carnets/cartes à l'usage disponibles)")),

    # --- National (4) ---
    dict(id="mkt-transport-sncf-avantage", category="Transport", name="Carte Avantage SNCF", price=4.08,
         promo="30% de réduction + prix plafonné (49€/69€/89€ selon durée du trajet)", score=7.8,
         engagement="Engagement annuel (carte valable 1 an)",
         pros=["30% de réduction + prix plafonné sur TGV/Intercités", "Valable sur toute la France, pas de zone",
               "Rentabilisée dès 1-2 trajets par an"],
         cons=["Nécessite d'anticiper l'achat (peu utile pour un trajet unique)",
               "Version 27-59 ans exclut certains allers simples en semaine"],
         link="https://www.sncf-connect.com/", price_checked_at=CHECKED,
         annual_price=49.0, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("National", "France entière", "France entière (grandes lignes)",
             "SNCF Voyageurs", "Train grande ligne (TGV/Intercités, -30% + prix plafonné)", "Non",
             "Non applicable (carte de réduction, pas un abonnement domicile-travail)",
             "Oui (réduction à l'usage, aucun abonnement fixe)")),

    dict(id="mkt-transport-sncf-max", category="Transport", name="SNCF Max Jeune / Max Senior", price=79.0,
         promo="Réservé aux 16-27 ans et 60 ans et plus -- trajets illimités TGV/Intercités", score=7.5,
         engagement="Sans engagement",
         pros=["Trajets TGV/Intercités illimités partout en France", "Rentabilisé dès 2-3 allers-retours par mois"],
         cons=["Réservé aux 16-27 ans et 60 ans et plus", "Places Max limitées par train, à réserver à l'avance"],
         link="https://www.sncf-connect.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("National", "France entière", "France entière (grandes lignes)",
             "SNCF Voyageurs", "Train grande ligne (TGV/Intercités, illimité)", "Non",
             "Non applicable (abonnement loisir, pas domicile-travail)", "Non (abonnement mensuel)")),

    dict(id="mkt-transport-blablacar-daily", category="Transport", name="BlaBlaCar Daily", price=45.0,
         promo="40% du trajet pris en charge par BlaBlaCar Daily, 4 premiers trajets offerts (indicatif ~15-20km/trajet)",
         score=7.7, engagement="Sans engagement, paiement au trajet",
         pros=["Jusqu'à 130€/mois d'économie moyenne vs voiture solo", "Aucun engagement, paiement au trajet réellement effectué",
               "Couvre les grandes agglomérations et les trajets périurbains"],
         cons=["Dépend de la disponibilité de conducteurs sur le trajet", "Moins fiable qu'un abonnement en cas d'usage quotidien strict"],
         link="https://www.blablacar.fr/daily", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("National", "France entière", "Grandes agglomérations + trajets périurbains",
             "Non applicable (service privé)", "Covoiturage domicile-travail", "Non",
             "Éligible au Forfait Mobilités Durables employeur (facultatif)", "Oui (paiement à l'usage, aucun engagement)")),

    dict(id="mkt-transport-karos-klaxit", category="Transport", name="Karos / Klaxit", price=0.0,
         promo="Souvent gratuit ou quasi-gratuit grâce aux subventions employeur/collectivité (Forfait Mobilités Durables)",
         score=8.0, engagement="Sans engagement, paiement à l'usage",
         pros=["Souvent gratuit ou quasi-gratuit grâce aux subventions", "Idéal en zone périurbaine/rurale mal desservie par les transports en commun",
               "Aucun abonnement fixe"],
         cons=["Disponibilité dépendante du nombre de conducteurs inscrits localement",
               "Montant de la subvention variable selon le territoire"],
         link="https://www.klaxit.com/", price_checked_at=CHECKED,
         annual_price=None, setup_fee=None, setup_fee_note=None,
         attributes=transport_attrs("National", "France entière", "Zones périurbaines et rurales principalement",
             "Non applicable (service privé)", "Covoiturage domicile-travail subventionné",
             "Variable selon bassin (souvent gratuit pour le passager)",
             "Généralement pris en charge à 100% par l'employeur/la collectivité (Forfait Mobilités Durables)",
             "Oui (paiement à l'usage)")),
]


def upgrade() -> None:
    op.bulk_insert(market_offers_table, OFFERS)


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        market_offers_table.delete().where(market_offers_table.c.category == "Transport")
    )
