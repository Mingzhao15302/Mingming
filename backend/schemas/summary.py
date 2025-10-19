from typing import List
from pydantic import BaseModel


class SummaryResponse(BaseModel):
    month: str
    generatedAt: str
    coreProgress: str
    keyAccounts: List[str]
    nextSteps: str
