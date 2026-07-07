from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.rate_limit import limiter

app = FastAPI(title=settings.PROJECT_NAME)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Réponse au format {"detail": ...} -- comme toutes les erreurs FastAPI de
    l'app -- plutôt que le {"error": ...} par défaut de slowapi, pour que
    getErrorMessage() côté frontend affiche le vrai message au lieu de
    retomber sur le fallback générique."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Trop de tentatives. Réessaie dans quelques instants."},
    )


app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}
