from datetime import date
from typing import Optional
from sqlalchemy.orm import Session

from backend.models.summary_snapshot import SummarySnapshot


def get_snapshot(db: Session, month: date) -> Optional[SummarySnapshot]:
    return db.query(SummarySnapshot).filter(SummarySnapshot.month == month).first()


def save_snapshot(db: Session, snapshot: SummarySnapshot) -> SummarySnapshot:
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot
