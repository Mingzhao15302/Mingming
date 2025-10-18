from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class StatItem(BaseModel):
    label: str
    value: str
    trend: str


class LeadItem(BaseModel):
    id: int
    name: str
    mobile: str
    location: str
    tag: str
    intent: Optional[str]
    statusColor: str
    followUp: str
    time: Optional[str] = None


class LeadDetail(BaseModel):
    id: int
    name: str
    mobile: str
    location: str
    intent: str
    statusColor: str
    followUp: str
    tag: str
    createdAt: datetime
