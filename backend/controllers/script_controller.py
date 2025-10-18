from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models.database import get_session
from ..repositories.script_repository import ScriptRepository
from ..services.script_service import ScriptService

router = APIRouter(prefix='/scripts', tags=['scripts'])


def get_script_service(session: Session = Depends(get_session)):
    repository = ScriptRepository(session)
    return ScriptService(repository)


@router.get('/{script_type}')
def list_scripts(script_type: str, service: ScriptService = Depends(get_script_service)):
    data = service.list_scripts(script_type)
    return {'success': True, 'data': [item.dict() for item in data]}


@router.get('/{script_type}/{key}')
def get_script(script_type: str, key: str, service: ScriptService = Depends(get_script_service)):
    try:
        detail = service.get_script(script_type, key)
    except ValueError as exc:  # pragma: no cover - simple error path
        raise HTTPException(status_code=404, detail=str(exc))
    return {'success': True, 'data': detail.dict()}
