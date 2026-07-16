import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.scheduler import start_scheduler, stop_scheduler

# Sans ceci, un logger applicatif (logger = logging.getLogger(__name__)) reste
# muet en dessous de WARNING : le root logger n'a par défaut aucun handler
# configuré. C'est ce qui rendait un éventuel goulot d'étranglement invisible
# en production -- les logs de timing ci-dessous (et ceux de app/api/v1/auth.py)
# ne remontaient nulle part avant cet ajout.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

app.state.limiter = limiter


# Seuil au-delà duquel une requête est considérée comme suspecte et journalisée
# en WARNING (jamais en dessous : le bruit noierait le signal). Choisi pour
# repérer un cold start d'hébergeur (Render free tier : 30-60s après une
# période d'inactivité) ou une requête anormalement lente sans avoir besoin
# d'un APM tiers.
SLOW_REQUEST_THRESHOLD_MS = 1000


@app.middleware("http")
async def log_request_timing(request: Request, call_next):
    """Journalise la durée de CHAQUE requête -- seul moyen fiable d'isoler un
    goulot d'étranglement (login lent, cold start d'hébergeur...) sans dépendre
    d'un outil d'APM externe. INFO pour la visibilité générale, WARNING dès que
    ça dépasse SLOW_REQUEST_THRESHOLD_MS pour que ça ressorte des logs."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000

    log_line = f"{request.method} {request.url.path} -> {response.status_code} en {duration_ms:.0f}ms"
    if duration_ms >= SLOW_REQUEST_THRESHOLD_MS:
        logger.warning("[LENT] %s", log_line)
    else:
        logger.info(log_line)

    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.0f}"
    return response


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


@app.on_event("startup")
def _on_startup() -> None:
    start_scheduler()


@app.on_event("shutdown")
def _on_shutdown() -> None:
    stop_scheduler()


@app.get("/")
def root():
    return {"message": "Bienvenue sur SubSaver!", "status": "online"}


@app.get("/health")
def health():
    return {"status": "ok"}
