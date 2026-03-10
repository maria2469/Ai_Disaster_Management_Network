# backend/models.py

from pydantic import BaseModel
from datetime import datetime

# ---------------------------
# Pydantic models matching Supabase incidents table
# ---------------------------

class IncidentCreate(BaseModel):
    message: str
    latitude: float
    longitude: float
    type: str = "general"  # optional, default to "general"

class IncidentResponse(BaseModel):
    id: int
    created_at: datetime
    message: str
    latitude: float
    longitude: float
    type: str
    status: str