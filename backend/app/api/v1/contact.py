from fastapi import APIRouter, Request

from app.core.email_service import send_contact_email
from app.core.rate_limit import limiter
from app.schemas import ContactBody, MessageResult

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=MessageResult)
@limiter.limit("5/hour")
def send_contact_message(request: Request, body: ContactBody):
    """Formulaire de contact public (aucune authentification requise) --
    limité en débit par IP car il déclenche un envoi d'e-mail réel à chaque
    appel, contrairement aux autres endpoints publics de lecture seule."""
    send_contact_email(body.name, body.email, body.subject, body.message)
    return MessageResult(message="Votre message a bien été envoyé.")
