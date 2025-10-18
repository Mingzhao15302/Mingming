from typing import Optional
from sqlalchemy.orm import Session

from .base import BaseRepository
from ..models import tables


class UserRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session)

    def get_by_username(self, username: str) -> Optional[tables.User]:
        return (
            self.session.query(tables.User)
            .filter(tables.User.username == username)
            .first()
        )

    def create_user(self, username: str, password_hash: str, name: str, role: str):
        user = tables.User(
            username=username,
            password_hash=password_hash,
            name=name,
            role=role
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
