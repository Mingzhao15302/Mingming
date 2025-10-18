from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class OrderRequest(BaseModel):
    content: str


class OrderResponse(BaseModel):
    id: int
    preview: str
    pdf_url: Optional[str]
    created_at: datetime
