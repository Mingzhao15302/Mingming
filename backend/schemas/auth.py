from datetime import datetime
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    token: str


class UserProfile(BaseModel):
    name: str
    role: str
    lastSync: datetime
