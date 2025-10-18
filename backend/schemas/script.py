from pydantic import BaseModel


class ScriptItem(BaseModel):
    key: str
    title: str
    subtitle: str
    badge: str
    count: int


class ScriptDetail(BaseModel):
    key: str
    title: str
    content: str
