"""Algorithme "maison" de détection d'abonnements récurrents à partir de transactions
bancaires brutes (Powens Bank API de base, sans Insights/catégorisation).

Étapes : ne garder que les débits -> nettoyer les libellés -> grouper par
marchand+montant proche -> détecter un rythme ~7j / ~30j / ~365j -> estimer la
prochaine échéance. Module pur (aucune dépendance DB), testable isolément.
"""

import re
from dataclasses import dataclass
from datetime import date, timedelta

# Préfixes/bruits bancaires français courants à retirer des libellés.
_NOISE_PATTERNS = [
    r"^PRLV\s+SEPA\s*",
    r"^PRELEVEMENT\s+SEPA\s*",
    r"^PRLV\s*",
    r"^CB\s+",
    r"^CARTE\s+",
    r"^VIR\s+SEPA\s*",
    r"^ACHAT\s+CB\s*",
]
# Codes de référence / dates / numéros bruités en fin de libellé (ex: "NETFLIX.COM 123456 FR").
_TRAILING_NOISE = re.compile(r"\s+\d{4,}.*$|\s+FR\d*$|\s+\d{2}/\d{2}(/\d{2,4})?$")

FREQUENCIES = {
    "weekly": (7, 3),      # (jours nominal, tolérance en jours)
    "monthly": (30, 5),
    "yearly": (365, 15),
}


def clean_label(raw_wording: str) -> str:
    """Normalise un libellé brut Powens en nom de marchand exploitable.
    Ex: "PRLV SEPA NETFLIX.COM 442213 FR" -> "NETFLIX.COM"
    """
    label = raw_wording.strip().upper()
    for pattern in _NOISE_PATTERNS:
        label = re.sub(pattern, "", label)
    label = _TRAILING_NOISE.sub("", label)
    return label.strip()


@dataclass
class RawTransaction:
    id: str
    wording: str
    value: float
    date: str  # "YYYY-MM-DD"


@dataclass
class DetectedSubscription:
    merchant: str
    price: float
    frequency: str  # "weekly" | "monthly" | "yearly"
    occurrences: int
    last_date: str
    next_estimated_date: str
    confidence: float  # 0..1
    source_transaction_ids: list[str]


def _parse_date(value: str) -> date:
    return date.fromisoformat(value[:10])


def _amount_close(a: float, b: float, tolerance_ratio: float = 0.02, tolerance_abs: float = 0.50) -> bool:
    """Deux montants sont considérés identiques si proches en absolu OU en relatif
    (certains abonnements varient légèrement : taxes, conversion devise...)."""
    diff = abs(abs(a) - abs(b))
    return diff <= tolerance_abs or diff <= tolerance_ratio * max(abs(a), abs(b))


def _match_frequency(intervals: list[int]) -> tuple[str, float] | None:
    """Teste si une série d'intervalles (en jours) colle à un rythme connu.
    Retourne (fréquence, score de confiance) ou None.
    """
    best: tuple[str, float] | None = None
    for freq_name, (nominal, tolerance) in FREQUENCIES.items():
        deviations = [abs(i - nominal) for i in intervals]
        if all(d <= tolerance for d in deviations):
            avg_deviation = sum(deviations) / len(deviations)
            confidence = max(0.0, 1 - (avg_deviation / tolerance))
            if best is None or confidence > best[1]:
                best = (freq_name, confidence)
    return best


def detect_recurring_subscriptions(transactions: list[RawTransaction]) -> list[DetectedSubscription]:
    """Point d'entrée principal : renvoie les abonnements récurrents détectés."""
    debits = [tx for tx in transactions if tx.value < 0]

    # Regroupement par libellé nettoyé.
    groups: dict[str, list[RawTransaction]] = {}
    for tx in debits:
        label = clean_label(tx.wording)
        if not label:
            continue
        groups.setdefault(label, []).append(tx)

    results: list[DetectedSubscription] = []

    for label, txs in groups.items():
        # Sous-groupage par montant proche : un même marchand peut avoir 2 offres différentes.
        amount_clusters: list[list[RawTransaction]] = []
        for tx in sorted(txs, key=lambda t: t.date):
            placed = False
            for cluster in amount_clusters:
                if _amount_close(cluster[0].value, tx.value):
                    cluster.append(tx)
                    placed = True
                    break
            if not placed:
                amount_clusters.append([tx])

        for cluster in amount_clusters:
            if len(cluster) < 2:
                continue
            cluster.sort(key=lambda t: t.date)
            dates = [_parse_date(t.date) for t in cluster]
            intervals = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]

            match = _match_frequency(intervals)
            if match is None:
                continue
            frequency, confidence = match

            nominal_days = FREQUENCIES[frequency][0]
            last_date = dates[-1]
            next_estimated = last_date + timedelta(days=nominal_days)
            avg_price = sum(abs(t.value) for t in cluster) / len(cluster)

            results.append(
                DetectedSubscription(
                    merchant=label,
                    price=round(avg_price, 2),
                    frequency=frequency,
                    occurrences=len(cluster),
                    last_date=last_date.isoformat(),
                    next_estimated_date=next_estimated.isoformat(),
                    confidence=round(confidence, 2),
                    source_transaction_ids=[t.id for t in cluster],
                )
            )

    # Tri par confiance décroissante puis nombre d'occurrences.
    results.sort(key=lambda r: (r.confidence, r.occurrences), reverse=True)
    return results
