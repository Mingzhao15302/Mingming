from typing import List
from pydantic import BaseModel


class TodoItem(BaseModel):
    title: str
    subtitle: str
    icon: str


class DashboardOverview(BaseModel):
    leads: int
    leadsTrend: str
    contractAmount: float
    pendingContracts: int
    todos: List[TodoItem]

    class Config:
        orm_mode = True
