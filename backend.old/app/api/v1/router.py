from fastapi import APIRouter

from app.api.v1 import auth, bank, family, market, subscriptions, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(subscriptions.router)
api_router.include_router(bank.router)
api_router.include_router(market.router)
api_router.include_router(family.router)
