from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class QuoteCreate(BaseModel):
    clientName: str = Field(..., alias='clientName')
    capacity: int
    bottleType: str
    launchDate: Optional[date]
    budget: Optional[float]
    requirements: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {date: lambda v: v.isoformat() if v else None}


class QuotePreview(BaseModel):
    clientName: str
    highlights: str
    estimatedTotal: float

    class Config:
        orm_mode = True
