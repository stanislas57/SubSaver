"""Logique métier des outils Espace Pro / BtoB (Extraction comptable,
Récupération de TVA, Détection des frais bancaires cachés) -- module pur
(aucune dépendance DB/FastAPI), même convention que transaction_analyzer.py
et subscription_detector.py : testable isolément, appelé depuis
app/api/v1/pro.py qui se charge lui de la DB et de la garde Premium.
"""

from dataclasses import dataclass

from app.core.subscription_detector import RawTransaction, clean_label
from app.core.transaction_analyzer import BANK_FEE_ALIASES, display_merchant_name

# Taux de TVA standard français. Les abonnements grand public (Netflix,
# téléphonie, sport...) sont affichés/prélevés TTC -- on part de cette
# hypothèse pour extraire le HT/la TVA, comme le ferait un particulier ou un
# indépendant qui ventile a posteriori des reçus sans TVA détaillée. Ne gère
# pas les taux réduits (presse, transport...) : le manque de champ "usage
# professionnel" sur Subscription rend déjà l'éligibilité indicative, cf.
# disclaimer porté par le frontend -- inutile d'ajouter une fausse précision
# sur le taux par-dessus une hypothèse déjà approximative.
VAT_RATE_STANDARD = 0.20


def vat_breakdown(price_ttc: float) -> tuple[float, float]:
    """TTC -> (HT, montant de TVA), arrondis au centime."""
    price_ht = price_ttc / (1 + VAT_RATE_STANDARD)
    vat_amount = price_ttc - price_ht
    return round(price_ht, 2), round(vat_amount, 2)


@dataclass
class AccountingRow:
    subscription_id: str
    display_name: str
    category: str
    price_ttc: float
    price_ht: float
    vat_amount: float
    annual_ttc: float
    billing_day: int


def build_accounting_rows(subscriptions: list) -> list[AccountingRow]:
    """Ligne comptable par abonnement -- base commune à l'extraction CSV et au
    rapport de récupération de TVA (même calcul, deux présentations), pour ne
    jamais faire dériver les deux fonctionnalités l'une de l'autre."""
    rows = []
    for sub in subscriptions:
        price_ht, vat_amount = vat_breakdown(sub.price)
        rows.append(
            AccountingRow(
                subscription_id=sub.id,
                display_name=display_merchant_name(sub.name),
                category=sub.category,
                price_ttc=round(sub.price, 2),
                price_ht=price_ht,
                vat_amount=vat_amount,
                annual_ttc=round(sub.price * 12, 2),
                billing_day=sub.billing_day,
            )
        )
    return rows


# ---------------------------------------------------------------------------
# Détection des frais bancaires cachés.
#
# Distinct du moteur de détection d'abonnements (analyze_transactions) : ce
# dernier n'exige aucune récurrence pour un match de BANK_FEE_ALIASES (un
# frais whitelisté ressort dès sa première occurrence), mais son catalogue ne
# couvre que les frais RÉCURRENTS légitimes (cotisation carte, tenue de
# compte...). Les frais d'INCIDENT (agios, rejets, commissions
# d'intervention...) sont par nature ponctuels et irréguliers -- pas moins
# coûteux pour autant -- donc absents de ce catalogue. On les ajoute ici
# plutôt que dans transaction_analyzer.py pour ne jamais faire remonter un
# agio ponctuel comme "abonnement" dans le reste de l'app (Calendrier,
# Analytique...), tout en réutilisant le même vocabulaire de nettoyage
# (clean_label) et le catalogue existant (BANK_FEE_ALIASES) pour éviter deux
# définitions divergentes des frais récurrents.
# ---------------------------------------------------------------------------

HIDDEN_FEE_PATTERNS: dict[str, str] = {
    "COMMISSION D'INTERVENTION": "Commission d'intervention",
    "COMMISSION INTERVENTION": "Commission d'intervention",
    "FRAIS DE REJET": "Frais de rejet de prélèvement",
    "REJET DE PRELEVEMENT": "Frais de rejet de prélèvement",
    "REJET PRELEVEMENT": "Frais de rejet de prélèvement",
    "REJET DE CHEQUE": "Frais de rejet de chèque",
    "FRAIS DE DECOUVERT": "Frais de découvert",
    "AGIOS": "Agios (découvert)",
    "INTERETS DEBITEURS": "Intérêts débiteurs",
    "FRAIS DE VIREMENT INTERNATIONAL": "Frais de virement international",
    "FRAIS VIREMENT INTERNATIONAL": "Frais de virement international",
    "FRAIS SWIFT": "Frais de virement international (SWIFT)",
    "FRAIS D'OPPOSITION": "Frais d'opposition carte/chèque",
    "OPPOSITION CARTE": "Frais d'opposition carte",
    "FRAIS DE DEPASSEMENT": "Frais de dépassement de découvert autorisé",
    "COMMISSION DE MOUVEMENT": "Commission de mouvement",
    # Catalogue des frais récurrents déjà connus du moteur de détection --
    # ré-exposés ici pour que CHAQUE occurrence individuelle soit listée
    # (l'outil Pro détaille prélèvement par prélèvement), pas seulement la
    # plus récente comme le fait le regroupement d'analyze_transactions.
    **{pattern: label for pattern, (label, _category) in BANK_FEE_ALIASES.items()},
}


@dataclass
class DetectedFee:
    transaction_id: str
    label: str
    date: str
    amount: float


def detect_hidden_bank_fees(transactions: list[RawTransaction]) -> list[DetectedFee]:
    """Scanne l'historique brut (pas seulement les récurrences détectées) à la
    recherche de libellés de frais connus. Un seul prélèvement suffit à être
    signalé -- contrairement à analyze_transactions, aucune récurrence n'est
    exigée : un agio de 8 € facturé une fois mérite déjà d'être vu."""
    detected: list[DetectedFee] = []
    for tx in transactions:
        if tx.value >= 0:
            continue  # uniquement les débits
        cleaned = clean_label(tx.wording)
        for pattern, label in HIDDEN_FEE_PATTERNS.items():
            if pattern in cleaned:
                detected.append(DetectedFee(transaction_id=tx.id, label=label, date=tx.date, amount=abs(tx.value)))
                break
    return sorted(detected, key=lambda d: d.date, reverse=True)
