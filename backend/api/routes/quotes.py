from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.schemas.quote import QuoteCreate, QuotePreview
from backend.services.quote_service import create_quote_preview

router = APIRouter(prefix='/quotes', tags=['Quotes'])


@router.post('', response_model=QuotePreview)
def generate_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
    return create_quote_preview(db, payload)
