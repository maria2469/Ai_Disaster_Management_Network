import logging
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from DB.client import supabase
import json

router = APIRouter(prefix="/emergency")

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ---------------------------
# Pydantic Models
# ---------------------------
class IncidentReport(BaseModel):
    message: str
    lat: float
    lon: float
    type: str = "general"
    status: str = "active"

# ---------------------------
# Serialize JSON-unfriendly types
# ---------------------------
def serialize_incident(incident: dict) -> dict:
    serialized = {}
    for k, v in incident.items():
        if isinstance(v, datetime):
            serialized[k] = v.isoformat()
        elif isinstance(v, Decimal):
            serialized[k] = float(v)
        else:
            serialized[k] = v
    return serialized

# ---------------------------
# GET /emergency/{id}
# ---------------------------
@router.get("/{incident_id}")
async def get_incident(incident_id: int):
    result = supabase.table("incidents").select("*").eq("id", incident_id).execute()
    if not result.data:
        return {"error": "Incident not found"}

    incident = result.data
    if isinstance(incident, bytes):
        incident = json.loads(incident.decode("utf-8"))
    elif isinstance(incident, list):
        incident = incident[0]

    incident = serialize_incident(incident)

    return {
        "id": incident.get("id"),
        "created_at": incident.get("created_at"),
        "message": incident.get("message"),
        "latitude": incident.get("latitude"),
        "longitude": incident.get("longitude"),
        "type": incident.get("type"),
        "status": incident.get("status")
    }

# ---------------------------
# POST /emergency/report
# ---------------------------
@router.post("/report")
async def report_incident(report: IncidentReport):
    now = datetime.utcnow().isoformat()  # convert datetime to string

    new_incident = {
        "message": report.message,
        "latitude": report.lat,
        "longitude": report.lon,
        "type": report.type,
        "status": report.status,
        "created_at": now
    }

    result = supabase.table("incidents").insert(new_incident).execute()
    return {"status": "success", "data": result.data}