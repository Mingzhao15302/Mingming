from datetime import date
from sqlalchemy import Column, Date, Integer, String, Text

from backend.core.database import Base


class SalesLog(Base):
    __tablename__ = 'sales_logs'

    id = Column(Integer, primary_key=True, index=True)
    log_date = Column(Date, nullable=False, index=True, default=date.today)
    title = Column(String(255), nullable=False)
    time = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
