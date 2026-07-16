"""Scheduler in-process (APScheduler) pour le job quotidien de génération des
alertes de renouvellement. Pas de Celery/Redis dans ce projet -- pour un
unique job léger tournant une fois par jour, un scheduler en mémoire suffit
et évite d'ajouter de l'infra. Limite connue : sur un déploiement multi-
instance, chaque instance lancerait le job -- sans conséquence ici grâce à la
déduplication par contrainte unique (cf. app/core/renewal_alerts.py), mais à
remplacer par un vrai scheduler partagé (Celery beat, cron système appelant
un endpoint dédié...) si l'app passe un jour en multi-instance.
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.renewal_alerts import generate_and_send_renewal_alerts
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="Europe/Paris")


def _run_renewal_alerts_job() -> None:
    db = SessionLocal()
    try:
        count = generate_and_send_renewal_alerts(db)
        logger.info("Job alertes de renouvellement : %d alerte(s) créée(s).", count)
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return
    # 08:00 Europe/Paris : après l'heure de nuit, avant que l'utilisateur ne
    # commence sa journée -- cohérent avec l'heure d'envoi des autres emails
    # transactionnels de l'app (aucune contrainte technique particulière).
    scheduler.add_job(_run_renewal_alerts_job, "cron", hour=8, minute=0, id="renewal_alerts_daily")
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
