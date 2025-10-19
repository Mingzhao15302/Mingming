from datetime import date
from typing import List
from sqlalchemy.orm import Session

from backend.models.sales_log import SalesLog


def get_logs_between(db: Session, start: date, end: date) -> List[SalesLog]:
    return (
        db.query(SalesLog)
        .filter(SalesLog.log_date >= start, SalesLog.log_date <= end)
        .order_by(SalesLog.log_date.asc())
        .all()
    )


def get_logs_by_date(db: Session, target_date: date) -> List[SalesLog]:
    return (
        db.query(SalesLog)
        .filter(SalesLog.log_date == target_date)
        .order_by(SalesLog.time.asc())
        .all()
    )


def get_latest_logs(db: Session, limit: int = 5) -> List[SalesLog]:
    return (
        db.query(SalesLog)
        .order_by(SalesLog.log_date.desc())
        .limit(limit)
        .all()
    )
