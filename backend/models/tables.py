from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from .database import Base


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), default='客户经理')
    last_sync = Column(DateTime, default=datetime.utcnow)


class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    mobile = Column(String(20), nullable=False)
    location = Column(String(100), nullable=False)
    tag = Column(String(50), nullable=False)
    intent = Column(String(50), nullable=True)
    status_color = Column(String(20), default='#22d3ee')
    follow_up = Column(String(100), default='待跟进')
    created_at = Column(DateTime, default=datetime.utcnow)


class Script(Base):
    __tablename__ = 'scripts'

    id = Column(Integer, primary_key=True, index=True)
    script_type = Column(String(50), index=True)
    key = Column(String(50), index=True)
    title = Column(String(100), nullable=False)
    subtitle = Column(String(150), nullable=True)
    badge = Column(String(50), nullable=True)
    count = Column(Integer, default=0)
    content = Column(Text, default='')


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    preview = Column(Text, nullable=False)
    pdf_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
