from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.family_member import FamilyMember
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas import FamilyBalanceOut, FamilyGroupOut, FamilyMemberBody, FamilyMemberOut

router = APIRouter(prefix="/family", tags=["family"])


def _ensure_owner_member(db: Session, user: User) -> None:
    exists = (
        db.query(FamilyMember)
        .filter(FamilyMember.user_id == user.id, FamilyMember.is_owner.is_(True))
        .first()
    )
    if not exists:
        db.add(FamilyMember(user_id=user.id, name=user.first_name, email=user.email, is_owner=True))
        db.commit()


@router.get("/group", response_model=FamilyGroupOut)
def get_family_group(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_owner_member(db, current_user)
    members = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
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


@router.get("/balances", response_model=list[FamilyBalanceOut])
def get_family_balances(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_owner_member(db, current_user)
    members = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    total = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .with_entities(Subscription.price)
        .all()
    )
    total_amount = sum(p[0] for p in total)

    n = len(members) or 1
    share = round(100 / n, 2)
    return [
        FamilyBalanceOut(
            member_id=m.id, member_name=m.name, share_percent=share, amount_owed=round(total_amount / n, 2)
        )
        for m in members
    ]
