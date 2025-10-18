from typing import List

from ..repositories.script_repository import ScriptRepository
from ..schemas.script import ScriptItem, ScriptDetail


class ScriptService:
    def __init__(self, repository: ScriptRepository):
        self.repository = repository

    def list_scripts(self, script_type: str) -> List[ScriptItem]:
        scripts = self.repository.list_scripts(script_type)
        results = []
        for script in scripts:
            results.append(
                ScriptItem(
                    key=script.key,
                    title=script.title,
                    subtitle=script.subtitle or '',
                    badge=script.badge or '',
                    count=script.count or 0
                )
            )
        return results

    def get_script(self, script_type: str, key: str) -> ScriptDetail:
        script = self.repository.get_script(script_type, key)
        if not script:
            raise ValueError('脚本不存在')
        return ScriptDetail(
            key=script.key,
            title=script.title,
            content=script.content or ''
        )
