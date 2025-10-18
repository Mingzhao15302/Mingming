from typing import Optional
from sqlalchemy.orm import Session

from .base import BaseRepository
from ..models import tables


class OrderRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session)

    def create_order(self, content: str, preview: str, pdf_url: Optional[str]):
        order = tables.Order(content=content, preview=preview, pdf_url=pdf_url)
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)
        return order
