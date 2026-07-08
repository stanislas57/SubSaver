"""Chiffrement au repos des tokens Powens (credentials d'accès bancaire réel,
la donnée la plus sensible du produit -- une fuite de base exposerait l'accès
bancaire de tous les utilisateurs connectés, pas seulement leurs mots de
passe hashés).

Sans TOKEN_ENCRYPTION_KEY configuré (dev local), `encrypt_token`/`decrypt_token`
sont des no-op transparents : comportement préexistant préservé, aucune
rupture en local. En production, une clé Fernet chiffre chaque token avant
écriture.

Compatibilité ascendante : les tokens déjà stockés en clair AVANT l'activation
du chiffrement restent lisibles (`decrypt_token` détecte l'échec de
déchiffrement Fernet et retombe sur la valeur telle quelle) -- pas de
migration de données à froid nécessaire, la ré-encryption se fait
naturellement à la prochaine reconnexion bancaire de l'utilisateur.
"""

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

_fernet: Fernet | None = Fernet(settings.TOKEN_ENCRYPTION_KEY.encode()) if settings.TOKEN_ENCRYPTION_KEY else None


def encrypt_token(value: str) -> str:
    if _fernet is None:
        return value
    return _fernet.encrypt(value.encode()).decode()


def decrypt_token(value: str) -> str:
    if _fernet is None:
        return value
    try:
        return _fernet.decrypt(value.encode()).decode()
    except InvalidToken:
        # Valeur stockée avant l'activation du chiffrement (ou clé changée) :
        # traitée comme du texte en clair préexistant plutôt que de faire
        # échouer toute la connexion bancaire de l'utilisateur.
        return value
