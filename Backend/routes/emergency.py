import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import List, Dict
from DB.client import supabase
from graph.emergency_graph import graph_app

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

class IncidentResponse(BaseModel):
    id: int
    created_at: str
    message: str
    latitude: float
    longitude: float
    type: str
    status: str

# ---------------------------
# Helper: serialize JSON-unfriendly types
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
# GET /emergency/all  <-- NEW
# ---------------------------
@router.get("/all", response_model=List[IncidentResponse])
async def get_all_incidents():
    result = supabase.table("incidents").select("*").order("created_at", desc=True).execute()
    if not result.data:
        return []  # no incidents yet

    incidents = [serialize_incident(i) for i in result.data]
    return [IncidentResponse(**i) for i in incidents]

# ---------------------------
# GET /emergency/{id}
# ---------------------------
@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: int):
    result = supabase.table("incidents").select("*").eq("id", incident_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident = serialize_incident(result.data[0])
    return IncidentResponse(**incident)


# ---------------------------
# POST /emergency/report
# ---------------------------
@router.post("/report")
async def report_incident(report: IncidentReport):
    # Initial state for LangGraph workflow
    initial_state = {
        "message": report.message,
        "latitude": report.lat,
        "longitude": report.lon,
        "emergency_type": "",   # will be classified
        "incident_id": 0,       # will be set in store node
        "nearby_volunteers": []
    }

    # Run the workflow
    final_state = graph_app.invoke(initial_state)

    # Prepare response
    volunteers_info: List[Dict] = [
        {
            "id": v["id"],
            "name": v["name"],
            "phone_number": v["phone_number"],
            "distance_km": round(
                ((report.lat - v["latitude"])**2 + (report.lon - v["longitude"])**2)**0.5, 2
            )
        }
        for v in final_state["nearby_volunteers"]
    ]

    return {
        "status": "success",
        "incident_id": final_state["incident_id"],
        "emergency_type": final_state["emergency_type"],
        "nearby_volunteers": volunteers_info
    }