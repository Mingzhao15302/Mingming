from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Integer, Text

from backend.core.database import Base


class SummarySnapshot(Base):
    __tablename__ = 'summary_snapshots'

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Date, nullable=False, unique=True)
    core_progress = Column(Text, nullable=False)
    key_accounts_json = Column(Text, nullable=False)
    next_steps = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
