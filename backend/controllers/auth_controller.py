from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from ..models.database import get_session
from ..repositories.user_repository import UserRepository
from ..services.auth_service import AuthService
from ..schemas.auth import LoginRequest

router = APIRouter(prefix='/auth', tags=['auth'])


def get_auth_service(session: Session = Depends(get_session)):
    repository = UserRepository(session)
    return AuthService(repository)


@router.post('/login')
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    token = service.authenticate(payload.username, payload.password)
    if not token:
        raise HTTPException(status_code=401, detail='账号或密码错误')
    return {'success': True, 'data': {'token': token}}


@router.get('/profile')
def profile(
    service: AuthService = Depends(get_auth_service),
    authorization: str = Header(default='')
):
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='未授权')
    token = authorization.split(' ')[1]
    user = service.validate_token(token)
    if not user:
        raise HTTPException(status_code=401, detail='登录过期')
    profile_data = service.get_profile(user)
    return {'success': True, 'data': {
        'name': profile_data.name,
        'role': profile_data.role,
        'lastSync': profile_data.lastSync.strftime('%Y-%m-%d %H:%M')
    }}
