from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.family_member import FamilyMember
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas import (
    FamilyBalanceOut,
    FamilyGroupOut,
    FamilyMemberBody,
    FamilyMemberOut,
    ShareableSubscriptionOut,
    SharedSubscriptionSelectionBody,
)

router = APIRouter(prefix="/family", tags=["family"])


def _ensure_owner_member(db: Session, user: User) -> None:
    """Garantit qu'un membre "owner" existe pour cet utilisateur.

    Corrige une race condition réelle : GET /family/group et GET
    /family/balances sont déclenchées quasi simultanément au montage de la
    page (deux requêtes HTTP indépendantes), et pouvaient toutes les deux
    passer ce check AVANT que l'une ou l'autre n'ait committé son insertion
    -> deux lignes "owner" créées pour le même utilisateur (bug rapporté :
    le propriétaire apparaît en double, fausse le calcul à 33%).

    L'unique véritable garde-fou est la contrainte UNIQUE en base
    (uq_family_members_one_owner_per_user, index partiel WHERE is_owner) --
    ce check applicatif reste une optimisation (évite un aller-retour DB
    inutile la plupart du temps), pas la protection elle-même. En cas de
    perdant de la course, l'IntegrityError est absorbée : l'autre requête a
    déjà créé la ligne, il n'y a rien de plus à faire.
    """
    exists = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == user.id, FamilyMember.is_owner.is_(True))
        .first()
    )
    if exists:
        return
    try:
        db.add(FamilyMember(user_id=user.id, name=user.first_name, email=user.email, is_owner=True))
        db.commit()
    except IntegrityError:
        db.rollback()


def _get_deduplicated_members(db: Session, user_id: str) -> list[FamilyMember]:
    """Renvoie les membres du groupe, en supprimant définitivement tout
    doublon "owner" résiduel (données créées avant le correctif de la race
    condition, ou toute autre anomalie) -- déduplication basée sur l'email
    (les doublons "owner" ont le même email, celui de l'utilisateur, mais
    des id différents) et repli sur l'id si l'email est absent."""
    members = (
        db.query(FamilyMember).filter(FamilyMember.user_id == user_id).order_by(FamilyMember.id).all()
    )

    seen_keys: set[str] = set()
    deduplicated: list[FamilyMember] = []
    duplicates: list[FamilyMember] = []
    for member in members:
        key = member.email or member.id
        if key in seen_keys:
            duplicates.append(member)
            continue
        seen_keys.add(key)
        deduplicated.append(member)

    if duplicates:
        for member in duplicates:
            db.delete(member)
        db.commit()

    return deduplicated


@router.get("/group", response_model=FamilyGroupOut)
def get_family_group(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_owner_member(db, current_user)
    members = _get_deduplicated_members(db, current_user.id)
    return FamilyGroupOut(id=current_user.id, name=f"Famille {current_user.first_name}", members=members)


@router.post("/members", response_model=FamilyMemberOut, status_code=201)
def add_family_member(
    body: FamilyMemberBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    _ensure_owner_member(db, current_user)
    member = FamilyMember(user_id=current_user.id, name=body.name, email=body.email, is_owner=False)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/members/{member_id}", status_code=204)
def remove_family_member(
    member_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    db.query(FamilyMember).filter(
        FamilyMember.id == member_id, FamilyMember.user_id == current_user.id, FamilyMember.is_owner.is_(False)
    ).delete()
    db.commit()
    return None


@router.get("/shareable-subscriptions", response_model=list[ShareableSubscriptionOut])
def list_shareable_subscriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Abonnements de l'utilisateur avec leur statut de partage actuel, pour
    la checklist de sélection (cf. règle métier : le partage ne porte plus
    sur le total global mais uniquement sur les abonnements cochés)."""
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .order_by(Subscription.name)
        .all()
    )


@router.put("/shared-subscriptions", response_model=list[ShareableSubscriptionOut])
def set_shared_subscriptions(
    body: SharedSubscriptionSelectionBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remplace intégralement la sélection : les abonnements de
    `subscription_ids` (qui doivent appartenir à l'utilisateur -- toute id
    étrangère est silencieusement ignorée) passent à is_shared=True, tous
    les autres abonnements de l'utilisateur repassent à False."""
    selected_ids = set(body.subscription_ids)
    subscriptions = db.query(Subscription).filter(Subscription.user_id == current_user.id).all()
    for subscription in subscriptions:
        subscription.is_shared = subscription.id in selected_ids
    db.commit()
    return subscriptions


@router.get("/balances", response_model=list[FamilyBalanceOut])
def get_family_balances(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_owner_member(db, current_user)
    members = _get_deduplicated_members(db, current_user.id)

    # Règle métier : uniquement les abonnements explicitement partagés
    # (is_shared=True), jamais le total global des abonnements de
    # l'utilisateur -- le partage n'est plus une répartition automatique de
    # tout, mais une sélection précise (ex: Netflix + Spotify seulement).
    total_amount = (
        db.query(func.coalesce(func.sum(Subscription.price), 0.0))
        .filter(Subscription.user_id == current_user.id, Subscription.is_shared.is_(True))
        .scalar()
    )

    n = len(members) or 1
    share = round(100 / n, 2)
    return [
        FamilyBalanceOut(
            member_id=m.id, member_name=m.name, share_percent=share, amount_owed=round(total_amount / n, 2)
        )
        for m in members
    ]
