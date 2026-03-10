from pydantic import BaseModel
from datetime import datetime

class IncidentCreate(BaseModel):
    message: str
    latitude: float
    longitude: float
    type: str = "general"

class IncidentResponse(BaseModel):
    id: int
    created_at: datetime
    message: str
    latitude: float
    longitude: float
    type: str
    status: str