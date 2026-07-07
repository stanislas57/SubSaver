"""Back-Office Super Admin : gestion CRM des utilisateurs et KPI analytiques.

Toutes les routes de ce module sont protégées par `get_current_admin_user`
(cf. app/api/deps.py) : un utilisateur authentifié mais non-admin reçoit un
403, jamais un 404 (qui n'a de sens que côté frontend pour masquer
l'existence de la route à un visiteur non connecté).
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas import (
    AdminAnalyticsOut,
    AdminUserOut,
    AdminUsersPage,
    AdminUserUpdate,
    SubscriptionInput,
    SubscriptionOut,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _to_admin_user_out(user: User, subscriptions_count: int) -> AdminUserOut:
    return AdminUserOut(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        is_premium=user.is_premium,
        is_admin=user.is_admin,
        bank_connected=user.bank_connected,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        subscriptions_count=subscriptions_count,
    )


def _get_user_or_404(user_id: str, db: Session) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    return user


@router.get("/users", response_model=AdminUsersPage)
def list_users(
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Table CRM paginée, avec recherche par email/prénom (`q`)."""
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    query = db.query(User)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.email.ilike(like), User.first_name.ilike(like)))

    total = query.count()
    users = query.order_by(User.email).offset((page - 1) * page_size).limit(page_size).all()

    counts_by_user: dict[str, int] = {}
    if users:
        user_ids = [u.id for u in users]
        counts_by_user = dict(
            db.query(Subscription.user_id, func.count(Subscription.id))
            .filter(Subscription.user_id.in_(user_ids))
            .group_by(Subscription.user_id)
            .all()
        )

    items = [_to_admin_user_out(u, counts_by_user.get(u.id, 0)) for u in users]
    return AdminUsersPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user(user_id: str, admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    user = _get_user_or_404(user_id, db)
    count = db.query(func.count(Subscription.id)).filter(Subscription.user_id == user.id).scalar() or 0
    return _to_admin_user_out(user, count)


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: str,
    body: AdminUserUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Édition CRM : email, prénom, et bascule manuelle du statut Premium /
    Admin (ex: offrir le service, corriger un bug de paiement)."""
    user = _get_user_or_404(user_id, db)

    updates = body.model_dump(exclude_unset=True, exclude_none=True)
    if "email" in updates and updates["email"] != user.email:
        existing = db.query(User).filter(User.email == updates["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Un autre compte utilise déjà cet email.")

    for field, value in updates.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)

    count = db.query(func.count(Subscription.id)).filter(Subscription.user_id == user.id).scalar() or 0
    return _to_admin_user_out(user, count)


@router.get("/users/{user_id}/subscriptions", response_model=list[SubscriptionOut])
def list_user_subscriptions(
    user_id: str, admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)
):
    _get_user_or_404(user_id, db)
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == user_id)
        .order_by(Subscription.name)
        .all()
    )


@router.put("/users/{user_id}/subscriptions/{sub_id}", response_model=SubscriptionOut)
def update_user_subscription(
    user_id: str,
    sub_id: str,
    body: SubscriptionInput,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Correction manuelle (prix, date...) en cas de faux positif de l'algorithme."""
    sub = db.query(Subscription).filter(Subscription.id == sub_id, Subscription.user_id == user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement introuvable.")
    for field, value in body.model_dump().items():
        setattr(sub, field, value)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/users/{user_id}/subscriptions/{sub_id}", status_code=204)
def delete_user_subscription(
    user_id: str,
    sub_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Suppression manuelle (ex: faux positif de détection bancaire)."""
    deleted = (
        db.query(Subscription)
        .filter(Subscription.id == sub_id, Subscription.user_id == user_id)
        .delete()
    )
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Abonnement introuvable.")
    return None


@router.get("/analytics", response_model=AdminAnalyticsOut)
def get_analytics(admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    premium_users = db.query(func.count(User.id)).filter(User.is_premium.is_(True)).scalar() or 0

    today_prefix = date.today().isoformat()
    new_users_today = (
        db.query(func.count(User.id)).filter(User.created_at.like(f"{today_prefix}%")).scalar() or 0
    )

    conversion_rate = round((premium_users / total_users) * 100, 1) if total_users else 0.0

    return AdminAnalyticsOut(
        total_users=total_users,
        new_users_today=new_users_today,
        premium_users=premium_users,
        premium_conversion_rate=conversion_rate,
    )
