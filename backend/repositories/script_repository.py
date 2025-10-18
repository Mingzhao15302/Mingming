from typing import List, Optional
from sqlalchemy.orm import Session

from .base import BaseRepository
from ..models import tables


class ScriptRepository(BaseRepository):
    def __init__(self, session: Session):
        super().__init__(session)

    def list_scripts(self, script_type: str) -> List[tables.Script]:
        return (
            self.session.query(tables.Script)
            .filter(tables.Script.script_type == script_type)
            .order_by(tables.Script.id.asc())
            .all()
        )

    def get_script(self, script_type: str, key: str) -> Optional[tables.Script]:
        return (
            self.session.query(tables.Script)
            .filter(
                tables.Script.script_type == script_type,
                tables.Script.key == key
            )
            .first()
        )
