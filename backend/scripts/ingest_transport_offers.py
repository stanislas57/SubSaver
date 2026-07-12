"""Outil de découverte des réseaux de transport français via l'API publique
transport.data.gouv.fr, pour élargir la couverture du comparateur Sport &
Transport au-delà des 30 offres curatées manuellement (cf. migration
`c4d8f2a913e7_add_transport_mobilite_market_offers`).

CE QUE CE SCRIPT FAIT :
  - Résout, pour une liste de villes cibles (coordonnées lat/lon), l'Autorité
    Organisatrice de la Mobilité (AOM) compétente via `GET /api/aoms` (API
    publique, sans authentification -- endpoint vérifié le 12/07/2026).
  - Recherche le jeu de données GTFS correspondant via `GET /api/datasets`.
  - Croise avec les `aom_name` déjà présents dans `market_offers` (category
    Transport) pour lister les réseaux non couverts par notre catalogue.
  - Écrit un rapport CSV (villes/AOM détectées, sans offre correspondante).

CE QUE CE SCRIPT NE FAIT PAS (volontairement) :
  - Il n'invente ni n'extrapole de prix d'abonnement. Les flux GTFS/NeTEx
    distribués par transport.data.gouv.fr décrivent des horaires et arrêts,
    PAS des grilles tarifaires commerciales : cette donnée n'existe
    généralement pas dans l'open data français. Auto-remplir `market_offers`
    avec un prix inventé serait une régression par rapport à la politique
    actuelle (offres curatées et vérifiées manuellement, cf. commentaire de
    `MarketOffer`). Ce script produit donc un rapport pour un humain, qui
    vérifie le tarif réel puis l'ajoute via une nouvelle migration (même
    format que `transport_attrs` dans la migration Transport).

EXÉCUTION :
    python -m scripts.ingest_transport_offers [--output rapport.csv]

Pour couvrir la France entière (300+ AOM), remplacer TARGET_MUNICIPALITIES
par la liste des chefs-lieux d'arrondissement/communes de plus de 20 000
habitants (source : fichier INSEE des communes), et programmer ce script en
tâche planifiée (ex: cron mensuel côté hébergeur, ou job planifié Render) --
la fréquence de mise à jour des réseaux de transport est de l'ordre du
trimestre, un run mensuel est largement suffisant.
"""
import argparse
import csv
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal  # noqa: E402
from app.models.market_offer import MarketOffer  # noqa: E402

TRANSPORT_DATA_GOUV_BASE = "https://transport.data.gouv.fr/api"

# Échantillon représentatif de villes moyennes non couvertes par le seed
# manuel (cf. migration Transport) -- à étendre avec la liste INSEE complète
# pour une couverture nationale exhaustive.
TARGET_MUNICIPALITIES = [
    ("Quimper", "Bretagne", 47.9960, -4.1024),
    ("Albi", "Occitanie", 43.9298, 2.1480),
    ("Épinal", "Grand Est", 48.1740, 6.4460),
    ("Troyes", "Grand Est", 48.2973, 4.0744),
    ("Chambéry", "Auvergne-Rhône-Alpes", 45.5646, 5.9178),
    ("Annecy", "Auvergne-Rhône-Alpes", 45.8992, 6.1294),
    ("Pau", "Nouvelle-Aquitaine", 43.2951, -0.3708),
    ("Perpignan", "Occitanie", 42.6887, 2.8948),
    ("Limoges", "Nouvelle-Aquitaine", 45.8336, 1.2611),
    ("Poitiers", "Nouvelle-Aquitaine", 46.5802, 0.3404),
    ("La Rochelle", "Nouvelle-Aquitaine", 46.1603, -1.1511),
    ("Angers", "Pays de la Loire", 47.4784, -0.5632),
    ("Le Mans", "Pays de la Loire", 48.0061, 0.1996),
    ("Amiens", "Hauts-de-France", 49.8942, 2.2957),
    ("Reims", "Grand Est", 49.2583, 4.0317),
    ("Besançon", "Bourgogne-Franche-Comté", 47.2378, 6.0241),
    ("Dijon", "Bourgogne-Franche-Comté", 47.3220, 5.0415),
    ("Clermont-Ferrand", "Auvergne-Rhône-Alpes", 45.7772, 3.0870),
    ("Saint-Étienne", "Auvergne-Rhône-Alpes", 45.4397, 4.3872),
    ("Avignon", "Provence-Alpes-Côte d'Azur", 43.9493, 4.8055),
    ("Toulon", "Provence-Alpes-Côte d'Azur", 43.1242, 5.9280),
    ("Brest", "Bretagne", 48.3904, -4.4861),
    ("Caen", "Normandie", 49.1829, -0.3707),
    ("Rouen", "Normandie", 49.4431, 1.0993),
    ("Orléans", "Centre-Val de Loire", 47.9029, 1.9093),
    ("Tours", "Centre-Val de Loire", 47.3941, 0.6848),
    ("Mulhouse", "Grand Est", 47.7508, 7.3359),
]


def fetch_aom(client: httpx.Client, lat: float, lon: float) -> dict | None:
    """GET /api/aoms?lon=&lat= -- retourne l'AOM compétente pour ce point,
    ou None si l'API ne répond pas (réseau, timeout, commune non couverte)."""
    try:
        resp = client.get(f"{TRANSPORT_DATA_GOUV_BASE}/aoms", params={"lon": lon, "lat": lat}, timeout=10.0)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPError:
        return None


def find_gtfs_dataset(client: httpx.Client, aom_name: str) -> str | None:
    """Cherche un jeu de données GTFS publié par cette AOM parmi les datasets
    'public-transit' -- retourne l'URL de la page dataset si trouvée."""
    try:
        resp = client.get(f"{TRANSPORT_DATA_GOUV_BASE}/datasets", params={"type": "public-transit"}, timeout=20.0)
        resp.raise_for_status()
        datasets = resp.json()
    except httpx.HTTPError:
        return None

    normalized_aom = aom_name.lower()
    for dataset in datasets:
        publisher_name = (dataset.get("publisher") or {}).get("name", "").lower()
        title = dataset.get("title", "").lower()
        if normalized_aom in publisher_name or normalized_aom in title:
            return dataset.get("page_url")
    return None


def existing_aom_names() -> set[str]:
    """AOM déjà couvertes par notre catalogue Transport (attribute `aom_name`),
    pour ne rapporter que les réseaux réellement manquants."""
    session = SessionLocal()
    try:
        offers = session.query(MarketOffer).filter(MarketOffer.category == "Transport").all()
        names = set()
        for offer in offers:
            for attr in offer.attributes or []:
                if attr.get("key") == "aom_name":
                    names.add(attr["value"].strip().lower())
        return names
    finally:
        session.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--output", default="transport_coverage_gaps.csv",
                         help="Fichier CSV de sortie (rapport des réseaux détectés sans offre au catalogue)")
    args = parser.parse_args()

    covered = existing_aom_names()
    rows = []

    with httpx.Client() as client:
        for city, region, lat, lon in TARGET_MUNICIPALITIES:
            aom = fetch_aom(client, lat, lon)
            if not aom:
                rows.append({"ville": city, "region": region, "aom_name": "NON RÉSOLU (API indisponible)",
                             "deja_au_catalogue": "?", "dataset_gtfs": ""})
                continue

            aom_name = aom.get("nom", "")
            already_covered = aom_name.strip().lower() in covered
            gtfs_url = find_gtfs_dataset(client, aom_name) if aom_name else None

            rows.append({
                "ville": city,
                "region": region,
                "aom_name": aom_name,
                "siren": aom.get("siren", ""),
                "departement": aom.get("departement", ""),
                "deja_au_catalogue": "oui" if already_covered else "NON -- à ajouter",
                "dataset_gtfs": gtfs_url or "",
            })

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["ville", "region", "aom_name", "siren", "departement",
                                                 "deja_au_catalogue", "dataset_gtfs"])
        writer.writeheader()
        writer.writerows(rows)

    missing = [r for r in rows if r.get("deja_au_catalogue", "").startswith("NON")]
    print(f"{len(rows)} communes analysées, {len(missing)} réseaux absents du catalogue -> {args.output}")
    print("Prochaine étape : vérifier manuellement le tarif réel de chaque réseau manquant, "
          "puis l'ajouter via une nouvelle migration (même format que transport_attrs).")


if __name__ == "__main__":
    main()
