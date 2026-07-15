"""backfill scope/region/location on existing market_offers

Revision ID: a7c1e5f83b02
Revises: f2a8c4e9b1d3
Create Date: 2026-07-14 09:05:00.000000

Renseigne les nouvelles colonnes `scope`/`region`/`location` (cf. migration
f2a8c4e9b1d3) pour les offres déjà en base :
- Téléphonie/Streaming/Musique/Banque : services disponibles dans toute la
  France, `scope="national"` pour toutes les lignes existantes.
- Sport : les 10 enseignes déjà en base sont des réseaux multi-villes
  (Basic-Fit, Fitness Park...), donc `scope="national"` -- les nouvelles
  salles indépendantes mono-ville ajoutées par la migration suivante portent
  elles `scope="local"`.
- Transport : dérivé ligne par ligne de l'attribute JSONB `scope` déjà
  présent ("Urbain local" -> local + ville, "Régional (TER)" -> regional +
  région seule (pas de ville unique pertinente), "National" -> national).
  Ne remplace ni ne supprime les attributes JSONB existants, consommés par
  ailleurs par lib/transportGeo.ts pour les filtres complémentaires.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7c1e5f83b02'
down_revision: Union[str, None] = 'f2a8c4e9b1d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (id, scope, region, location)
TRANSPORT_URBAN = [
    ("mkt-transport-navigo", "local", "Île-de-France", "Paris"),
    ("mkt-transport-velib", "local", "Île-de-France", "Paris"),
    ("mkt-transport-tcl-lyon", "local", "Auvergne-Rhône-Alpes", "Lyon"),
    ("mkt-transport-rtm-marseille", "local", "Provence-Alpes-Côte d'Azur", "Marseille"),
    ("mkt-transport-tisseo-toulouse", "local", "Occitanie", "Toulouse"),
    ("mkt-transport-lignesazur-nice", "local", "Provence-Alpes-Côte d'Azur", "Nice"),
    ("mkt-transport-tan-nantes", "local", "Pays de la Loire", "Nantes"),
    ("mkt-transport-cts-strasbourg", "local", "Grand Est", "Strasbourg"),
    ("mkt-transport-tam-montpellier", "local", "Occitanie", "Montpellier"),
    ("mkt-transport-tbm-bordeaux", "local", "Nouvelle-Aquitaine", "Bordeaux"),
    ("mkt-transport-ilevia-lille", "local", "Hauts-de-France", "Lille"),
    ("mkt-transport-star-rennes", "local", "Bretagne", "Rennes"),
    ("mkt-transport-stan-nancy", "local", "Grand Est", "Nancy"),
    ("mkt-transport-lemet-metz", "local", "Grand Est", "Metz"),
    ("mkt-transport-tag-grenoble", "local", "Auvergne-Rhône-Alpes", "Grenoble"),
    ("mkt-transport-dkbus-dunkerque", "local", "Hauts-de-France", "Dunkerque"),
]

TRANSPORT_REGIONAL = [
    ("mkt-transport-ter-aura", "regional", "Auvergne-Rhône-Alpes"),
    ("mkt-transport-lio-occitanie", "regional", "Occitanie"),
    ("mkt-transport-modalis-nouvelleaquitaine", "regional", "Nouvelle-Aquitaine"),
    ("mkt-transport-passpass-hautsdefrance", "regional", "Hauts-de-France"),
    ("mkt-transport-fluo-grandest", "regional", "Grand Est"),
    ("mkt-transport-breizhgo-bretagne", "regional", "Bretagne"),
    ("mkt-transport-aleop-paysdelaloire", "regional", "Pays de la Loire"),
    ("mkt-transport-nomad-normandie", "regional", "Normandie"),
    ("mkt-transport-zou-paca", "regional", "Provence-Alpes-Côte d'Azur"),
    ("mkt-transport-remi-centrevaldeloire", "regional", "Centre-Val de Loire"),
]

TRANSPORT_NATIONAL = [
    "mkt-transport-sncf-avantage",
    "mkt-transport-sncf-max",
    "mkt-transport-blablacar-daily",
    "mkt-transport-karos-klaxit",
]


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text(
        "UPDATE market_offers SET scope = 'national' "
        "WHERE category IN ('Telephonie', 'Streaming', 'Musique', 'Banque', 'Sport')"
    ))

    for offer_id, scope, region, location in TRANSPORT_URBAN:
        conn.execute(
            sa.text("UPDATE market_offers SET scope = :scope, region = :region, location = :location WHERE id = :id"),
            {"scope": scope, "region": region, "location": location, "id": offer_id},
        )

    for offer_id, scope, region in TRANSPORT_REGIONAL:
        conn.execute(
            sa.text("UPDATE market_offers SET scope = :scope, region = :region WHERE id = :id"),
            {"scope": scope, "region": region, "id": offer_id},
        )

    conn.execute(
        sa.text("UPDATE market_offers SET scope = 'national' WHERE id = ANY(:ids)"),
        {"ids": TRANSPORT_NATIONAL},
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE market_offers SET scope = NULL, region = NULL, location = NULL "
        "WHERE category IN ('Telephonie', 'Streaming', 'Musique', 'Banque', 'Sport', 'Transport')"
    ))
