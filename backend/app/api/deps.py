from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(status_code=401, detail="Session invalide, reconnecte-toi.")
    user_id = decode_access_token(token)
    if not user_id:
        raise credentials_error
    user = db.get(User, user_id)
    if not user:
        raise credentials_error
    return user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Garde d'accès au Back-Office (cf. app/api/v1/admin.py). Renvoie 403 --
    jamais 404 -- pour un compte non-admin authentifié : le 404 n'a de sens
    que côté frontend (masquer l'existence de la route aux yeux d'un visiteur
    non connecté), pas côté API où l'authentification est déjà vérifiée."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return current_user


def get_current_premium_user(current_user: User = Depends(get_current_user)) -> User:
    """Garde d'accès aux fonctionnalités Premium/BtoB (cf. app/api/v1/pro.py).
    La sécurité de ces fonctionnalités ne doit jamais reposer uniquement sur le
    frontend (qui ne fait qu'AFFICHER un cadenas) : cette dépendance revérifie
    le statut réel en base à chaque requête. Renvoie 402 (Payment Required) --
    distinct du 403 de get_current_admin_user -- pour que le frontend puisse
    distinguer "authentifié mais pas payé" de "droits insuffisants"."""
    if not current_user.is_premium:
        raise HTTPException(status_code=402, detail="Fonctionnalité réservée aux membres Premium.")
    return current_user
