from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..models.database import get_session
from ..repositories.order_repository import OrderRepository
from ..services.order_service import OrderService
from ..schemas.order import OrderRequest

router = APIRouter(prefix='/orders', tags=['orders'])


def get_order_service(session: Session = Depends(get_session)):
    repository = OrderRepository(session)
    return OrderService(repository)


@router.post('/')
def create_order(payload: OrderRequest, service: OrderService = Depends(get_order_service)):
    response = service.create_order(payload.content)
    return {'success': True, 'data': response.dict()}


@router.post('/preview')
def preview_order(payload: OrderRequest, service: OrderService = Depends(get_order_service)):
    response = service.preview_order(payload.content)
    return {'success': True, 'data': response.dict()}
