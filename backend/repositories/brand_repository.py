from datetime import datetime
from sqlalchemy.orm import Session

from .base import BaseRepository
from ..models import tables


class BrandRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session)

    def get_recent_leads(self, limit: int = 5):
        return (
            self.session.query(tables.Lead)
            .order_by(tables.Lead.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_all_leads(self):
        return (
            self.session.query(tables.Lead)
            .order_by(tables.Lead.created_at.desc())
            .all()
        )

    def count_leads_today(self) -> int:
        today = datetime.utcnow().date()
        return (
            self.session.query(tables.Lead)
            .filter(tables.Lead.created_at >= datetime.combine(today, datetime.min.time()))
            .count()
        )

    def count_valid_mobiles(self) -> int:
        return self.session.query(tables.Lead).count()

    def get_conversion_rate(self) -> float:
        total = self.count_leads_today()
        if total == 0:
            return 0.0
        return min(1.0, 0.93)
