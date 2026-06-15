from sqlalchemy.orm import Session

from app.models import AuditTrail


def log_event(db: Session, client_id: int | None, action: str, details: str, actor: str = "system") -> None:
    db.add(AuditTrail(client_id=client_id, action=action, details=details, actor=actor))
    db.commit()
