"""Règle métier n°2 : auto-injection de l'abonnement SubSaver Premium.

Appliquée APRÈS `analyze_transactions` (transaction_analyzer.py), sur sa
sortie brute -- SubSaver ne prélève pas encore réellement via Stripe côté
serveur (cf. le placeholder `POST /users/me/upgrade-premium`), donc aucune
transaction bancaire ne peut jamais représenter cet abonnement. Sans cette
injection, un membre Premium ne verrait jamais son propre abonnement dans son
tableau de bord alors qu'il paie bel et bien pour le service.

Module pur (comme transaction_analyzer) : reçoit des primitives
(`is_premium`, `premium_since`) plutôt que le modèle ORM `User`, pour rester
testable sans DB/FastAPI et ne pas coupler la logique métier à la couche de
persistance.
"""

from datetime import date

from app.core.transaction_analyzer import CategorizedSubscription, _shift_months

SUBSAVER_PREMIUM_MERCHANT = "SubSaver Premium"
SUBSAVER_PREMIUM_PRICE = 2.99
SUBSAVER_PREMIUM_CATEGORY = "Logiciels & Utilitaires"


def enrich_detected_subscriptions(
    subscriptions: list[CategorizedSubscription],
    is_premium: bool,
    premium_since: str | None,
    today: date | None = None,
) -> list[CategorizedSubscription]:
    """Ajoute un candidat "SubSaver Premium" à la liste détectée si
    l'utilisateur est Premium, sinon renvoie `subscriptions` inchangée.

    `last_date` est calculée comme le plus récent anniversaire mensuel de
    `premium_since` (la VRAIE date de souscription, jamais une date
    arbitraire) qui ne dépasse pas `today` -- exactement la même sémantique
    que `_build_candidate` pour un abonnement whitelisté classique, pour que
    l'entrée injectée soit indiscernable d'un abonnement réellement détecté
    côté frontend. Repli sur la date du jour si `premium_since` est absent
    (compte passé Premium avant l'ajout de cette colonne)."""
    if not is_premium:
        return subscriptions

    today = today or date.today()
    since = date.fromisoformat(premium_since[:10]) if premium_since else today

    last_date = since
    occurrences = 1
    while True:
        next_anniversary = _shift_months(last_date, 1)
        if next_anniversary > today:
            break
        last_date = next_anniversary
        occurrences += 1

    injected = CategorizedSubscription(
        merchant=SUBSAVER_PREMIUM_MERCHANT,
        price=SUBSAVER_PREMIUM_PRICE,
        frequency="monthly",
        occurrences=occurrences,
        last_date=last_date.isoformat(),
        next_estimated_date=_shift_months(last_date, 1).isoformat(),
        confidence=1.0,
        source_transaction_ids=[],
        category=SUBSAVER_PREMIUM_CATEGORY,
    )
    return [*subscriptions, injected]
