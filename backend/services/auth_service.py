from datetime import datetime, timedelta
import secrets
from typing import Dict, Optional, Any

from ..repositories.user_repository import UserRepository
from ..schemas.auth import UserProfile
from ..utils.security import verify_password
from ..models import tables


class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository
        if not hasattr(self.__class__, "_tokens_store"):
            self.__class__._tokens_store = {}

    @property
    def _tokens(self) -> Dict[str, Dict[str, Any]]:
        return self.__class__._tokens_store


    def authenticate(self, username: str, password: str) -> Optional[str]:
        user = self.repository.get_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        token = secrets.token_hex(16)
        self._tokens[token] = {
            'user_id': user.id,
            'expires_at': datetime.utcnow() + timedelta(hours=12)
        }
        user.last_sync = datetime.utcnow()
        self.repository.session.commit()
        return token

    def validate_token(self, token: str):
        record = self._tokens.get(token)
        if not record:
            return None
        if record['expires_at'] < datetime.utcnow():
            self._tokens.pop(token, None)
            return None
        user = self.repository.session.get(tables.User, record['user_id'])
        return user

    def get_profile(self, user) -> UserProfile:
        return UserProfile(
            name=user.name,
            role=user.role,
            lastSync=user.last_sync
        )
