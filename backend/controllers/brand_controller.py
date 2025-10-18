from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from ..models.database import get_session
from ..repositories.brand_repository import BrandRepository
from ..services.brand_service import BrandService
from ..services.auth_service import AuthService
from ..repositories.user_repository import UserRepository

router = APIRouter(prefix='/brand', tags=['brand'])


def get_brand_service(session: Session = Depends(get_session)):
    repository = BrandRepository(session)
    return BrandService(repository)


def get_auth_service(session: Session = Depends(get_session)):
    user_repo = UserRepository(session)
    return AuthService(user_repo)


@router.get('/stats')
def get_stats(service: BrandService = Depends(get_brand_service)):
    data = service.get_dashboard_stats()
    return {'success': True, 'data': [item.dict() for item in data]}


@router.get('/leads/recent')
def get_recent_leads(service: BrandService = Depends(get_brand_service)):
    data = service.get_recent_leads()
    return {'success': True, 'data': [item.dict() for item in data]}


@router.get('/leads')
def get_leads(
    service: BrandService = Depends(get_brand_service),
    auth: AuthService = Depends(get_auth_service),
    authorization: str = Header(default='')
):
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='未授权')
    token = authorization.split(' ')[1]
    user = auth.validate_token(token)
    if not user:
        raise HTTPException(status_code=401, detail='登录已过期')
    data = service.get_all_leads()
    return {'success': True, 'data': [item.dict() for item in data]}
