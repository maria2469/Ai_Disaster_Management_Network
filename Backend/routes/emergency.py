# routes/emergency.py
import logging
from datetime import datetime
from decimal import Decimal
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.client import supabase
from graph.emergency_graph import graph_app

router = APIRouter(prefix="/emergency")
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class IncidentReport(BaseModel):
    message: str
    lat: float
    lon: float


class IncidentResponse(BaseModel):
    id: int
    created_at: str
    message: str
    latitude: float
    longitude: float
    type: str
    status: str


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _serialize(incident: dict) -> dict:
    """Coerce Decimal/datetime values so Pydantic can validate them."""
    return {
        k: (v.isoformat() if isinstance(v, datetime) else float(v) if isinstance(v, Decimal) else v)
        for k, v in incident.items()
    }


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.get("/all", response_model=List[IncidentResponse])
async def get_all_incidents():
    """Return all incidents, newest first."""
    result = supabase.table("incidents").select("*").order("created_at", desc=True).execute()
    return [IncidentResponse(**_serialize(i)) for i in (result.data or [])]


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: int):
    """Return a single incident by ID."""
    result = supabase.table("incidents").select("*").eq("id", incident_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse(**_serialize(result.data[0]))


@router.post("/report")
async def report_incident(report: IncidentReport):
    """
    Run the full LangGraph pipeline:
      classify → store → find volunteers → send WhatsApp alerts
    Returns incident details and the list of nearby volunteers.
    """
    initial_state = {
        "message": report.message,
        "latitude": report.lat,
        "longitude": report.lon,
        "emergency_type": "",
        "incident_id": 0,
        "nearby_volunteers": [],
    }

    final_state = graph_app.invoke(initial_state)

    volunteers_info = [
        {
            "id": v["id"],
            "name": v["name"],
            "phone_number": v["phone_number"],
            "skill": v.get("skill"),
        }
        for v in final_state["nearby_volunteers"]
    ]

    return {
        "status": "success",
        "incident_id": final_state["incident_id"],
        "emergency_type": final_state["emergency_type"],
        "nearby_volunteers": volunteers_info,
    }
