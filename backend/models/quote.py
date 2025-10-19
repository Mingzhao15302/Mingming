from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Float, Integer, String, Text

from backend.core.database import Base


class Quote(Base):
    __tablename__ = 'quotes'

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    bottle_type = Column(String(100), nullable=False)
    launch_date = Column(Date, nullable=True)
    budget = Column(Float, nullable=True)
    requirements = Column(Text, nullable=False)
    highlights = Column(Text, nullable=True)
    estimated_total = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
