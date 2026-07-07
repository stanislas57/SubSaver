"""Limiteur de débit partagé (protection anti brute-force en périphérie des
routes sensibles, cf. app/api/v1/auth.py). Stockage en mémoire par défaut
(slowapi/MemoryStorage) : suffisant pour une instance unique, mais ne
partage pas l'état entre plusieurs workers/instances -- à faire évoluer vers
un backend Redis (`Limiter(storage_uri="redis://...")`) dès qu'un
déploiement multi-instance est en place, sans quoi chaque instance a son
propre quota et la protection réelle est divisée par le nombre d'instances.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
