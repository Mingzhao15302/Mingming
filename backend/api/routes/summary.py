from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.schemas.summary import SummaryResponse
from backend.services.summary_service import get_monthly_summary

router = APIRouter(prefix='/summary', tags=['Summary'])


@router.get('/monthly', response_model=SummaryResponse)
def monthly_summary(db: Session = Depends(get_db)):
    return get_monthly_summary(db)


@router.post('/monthly', response_model=SummaryResponse)
def refresh_monthly_summary(db: Session = Depends(get_db)):
    return get_monthly_summary(db, refresh=True)
