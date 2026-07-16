"""Calcul de la prochaine date de renouvellement d'un abonnement à partir de
son `billing_day` (jour du mois, 1-31) -- SubSaver ne stocke aucune date de
renouvellement explicite, elle est toujours dérivée à la volée pour rester
cohérente si l'utilisateur change le jour de facturation.
"""

import calendar
from datetime import date


def next_renewal_date(billing_day: int, from_date: date) -> date:
    """Prochaine occurrence de `billing_day` à partir de `from_date` incluse
    (si `from_date` est déjà le jour de facturation, elle est retournée telle
    quelle -- un renouvellement "aujourd'hui" est une échéance valide, pas la
    suivante). `billing_day` est plafonné au dernier jour du mois ciblé (ex:
    31 -> 28/29 en février), comme le fait déjà le reste de l'app pour
    l'affichage du Calendrier."""
    day = min(billing_day, calendar.monthrange(from_date.year, from_date.month)[1])
    candidate = date(from_date.year, from_date.month, day)
    if candidate >= from_date:
        return candidate

    month = from_date.month + 1
    year = from_date.year
    if month > 12:
        month = 1
        year += 1
    day = min(billing_day, calendar.monthrange(year, month)[1])
    return date(year, month, day)
