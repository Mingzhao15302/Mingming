from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.schemas.log import CalendarResponse, LogListResponse
from backend.services.log_service import get_calendar_overview, get_logs_for_date

router = APIRouter(prefix='/logs', tags=['Logs'])


@router.get('/calendar', response_model=CalendarResponse)
def calendar(db: Session = Depends(get_db)):
    return get_calendar_overview(db)


@router.get('/{log_date}', response_model=LogListResponse)
def logs_by_date(log_date: date, db: Session = Depends(get_db)):
    return get_logs_for_date(db, log_date)
