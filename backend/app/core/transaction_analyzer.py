"""Moteur d'analyse des transactions bancaires : isole les abonnements récurrents
puis les auto-catégorise par correspondance de libellé.

S'appuie sur l'algorithme de récurrence existant (subscription_detector) sans le
dupliquer, et ajoute la seule étape manquante : le croisement du marchand nettoyé
avec un dictionnaire de mots-clés pour déduire une catégorie (ex: NETFLIX -> Streaming).

Module pur (aucune dépendance DB/FastAPI), testable isolément avec un simple
tableau de transactions.
"""

from dataclasses import asdict, dataclass

from app.core.subscription_detector import (
    DetectedSubscription,
    RawTransaction,
    clean_label,
    detect_recurring_subscriptions,
)

# Doit rester synchronisé avec `CATEGORIES` dans frontend/src/types.ts.
DEFAULT_CATEGORY = "Autre"

# Mots-clés (recherchés dans le libellé déjà nettoyé, donc en MAJUSCULES) associés
# à chaque catégorie. Ordre = priorité en cas de correspondances multiples.
CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Streaming": (
        "NETFLIX", "DISNEY", "AMAZON PRIME", "PRIME VIDEO", "CANAL+", "CANALPLUS",
        "MYCANAL", "OCS", "PARAMOUNT", "APPLE TV", "HBO", "CRUNCHYROLL", "SALTO",
    ),
    "Musique": (
        "SPOTIFY", "DEEZER", "APPLE MUSIC", "YOUTUBE MUSIC", "SOUNDCLOUD", "TIDAL",
    ),
    "Telephonie": (
        "ORANGE", "SFR", "BOUYGUES", "FREE MOBILE", "FREE TELECOM", "SOSH",
        "B AND YOU", "PRIXTEL", "LEBARA", "LYCAMOBILE",
    ),
    "Sport": (
        "BASIC FIT", "FITNESS PARK", "NEONESS", "ONFIT", "KEEPCOOL",
        "CMG SPORTS", "VIRGIN ACTIVE", "GYMLIB",
    ),
    "Logement": (
        "EDF", "ENGIE", "TOTALENERGIES", "VEOLIA", "SUEZ", "ENI ", "LOYER",
        "ASSURANCE HABITATION",
    ),
    "Banque & Invest": (
        "BOURSORAMA", "REVOLUT", "N26", "TRADE REPUBLIC", "DEGIRO", "YOMONI",
        "LINXEA", "FORTUNEO", "ASSURANCE VIE",
    ),
    "Transport": (
        "SNCF", "RATP", "NAVIGO", "UBER", "BLABLACAR", "TIER", "LIME",
        "TRAINLINE", "OUIGO", "FLIXBUS",
    ),
}


def categorize_merchant(merchant: str) -> str:
    """Renvoie la première catégorie dont un mot-clé apparaît dans le marchand
    (déjà nettoyé par `clean_label`), sinon `DEFAULT_CATEGORY`."""
    label = merchant.upper()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in label for keyword in keywords):
            return category
    return DEFAULT_CATEGORY


@dataclass
class CategorizedSubscription(DetectedSubscription):
    category: str


def analyze_transactions(transactions: list[RawTransaction]) -> list[CategorizedSubscription]:
    """Point d'entrée principal : détecte les abonnements récurrents puis les
    auto-catégorise. Renvoie des candidats triés par confiance décroissante."""
    detected = detect_recurring_subscriptions(transactions)
    return [
        CategorizedSubscription(**asdict(subscription), category=categorize_merchant(subscription.merchant))
        for subscription in detected
    ]


if __name__ == "__main__":
    sample = [
        RawTransaction(id="1", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date="2024-04-05"),
        RawTransaction(id="2", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date="2024-05-05"),
        RawTransaction(id="3", wording="PRLV SEPA NETFLIX.COM 442213 FR", value=-13.49, date="2024-06-06"),
        RawTransaction(id="4", wording="PRLV SEPA SPOTIFY 99001122", value=-9.99, date="2024-04-12"),
        RawTransaction(id="5", wording="PRLV SEPA SPOTIFY 99001122", value=-9.99, date="2024-05-12"),
        RawTransaction(id="6", wording="CB ACHAT BOULANGERIE MARTIN", value=-4.50, date="2024-04-20"),
    ]
    for result in analyze_transactions(sample):
        print(result)
