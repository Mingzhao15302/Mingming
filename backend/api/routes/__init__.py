from fastapi import APIRouter

from backend.api.routes.dashboard import router as dashboard_router
from backend.api.routes.quotes import router as quotes_router
from backend.api.routes.logs import router as logs_router
from backend.api.routes.summary import router as summary_router

api_router = APIRouter(prefix='/api')
api_router.include_router(dashboard_router)
api_router.include_router(quotes_router)
api_router.include_router(logs_router)
api_router.include_router(summary_router)

__all__ = ['api_router']
