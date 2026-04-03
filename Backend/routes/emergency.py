# routes/emergency.py
import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db.client import supabase
from graph.emergency_graph import graph_app
from websocket.manager import broadcast
from utils.whatsapp import send_victim_accepted, send_victim_resolved

router = APIRouter(prefix="/emergency")
logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 180   # 3 minutes before re-alerting wider radius


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class IncidentReport(BaseModel):
    message: str
    lat: float
    lon: float
    phone: str              # victim phone number (international, no +)

class IncidentResponse(BaseModel):
    id: int
    created_at: str
    message: str
    latitude: float
    longitude: float
    type: str
    status: str
    phone: Optional[str] = None

class AcceptPayload(BaseModel):
    incident_id: int
    volunteer_id: int

class ResolvePayload(BaseModel):
    incident_id: int
    volunteer_id: int

class LocationUpdate(BaseModel):
    incident_id: int
    volunteer_id: int
    latitude: float
    longitude: float


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _serialize(incident: dict) -> dict:
    return {
        k: (v.isoformat() if isinstance(v, datetime) else float(v) if isinstance(v, Decimal) else v)
        for k, v in incident.items()
    }


async def _timeout_rebroadcast(incident_id: int, lat: float, lon: float,
                                message: str, original_radius: float = 5.0):
    """
    Wait TIMEOUT_SECONDS. If incident is still 'active' (not accepted),
    re-alert volunteers in a wider radius (10 km) regardless of skill match.
    """
    await asyncio.sleep(TIMEOUT_SECONDS)

    result = supabase.table("incidents").select("status").eq("id", incident_id).execute()
    if not result.data or result.data[0]["status"] != "active":
        return  # already accepted or resolved, nothing to do

    logger.warning(f"[Timeout] Incident {incident_id} not accepted after {TIMEOUT_SECONDS}s — re-alerting wider radius")

    # Fetch ALL available volunteers in 10 km, ignoring skill match this time
    import math
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        a = math.sin(math.radians(lat2-lat1)/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(math.radians(lon2-lon1)/2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))

    all_volunteers = (
        supabase.table("users")
        .select("id, name, phone_number, latitude, longitude, skill, is_available")
        .eq("is_available", True)
        .execute()
        .data
    )

    wider_batch = [
        v for v in all_volunteers
        if haversine(lat, lon, v["latitude"], v["longitude"]) <= 10
    ]

    from utils.whatsapp import send_volunteer_alert
    for v in wider_batch:
        phone = v.get("phone_number")
        if phone:
            send_volunteer_alert(phone, incident_id, message, lat, lon)
            print(f"[Timeout Re-alert] → {v['name']}")

    await broadcast({
        "event": "timeout_rebroadcast",
        "incident_id": incident_id,
        "message": "No response — alerting wider area",
    })


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.get("/all", response_model=List[IncidentResponse])
async def get_all_incidents():
    result = supabase.table("incidents").select("*").order("created_at", desc=True).execute()
    return [IncidentResponse(**_serialize(i)) for i in (result.data or [])]


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: int):
    result = supabase.table("incidents").select("*").eq("id", incident_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse(**_serialize(result.data[0]))


@router.post("/report")
async def report_incident(report: IncidentReport):
    """
    Full pipeline: classify → store → find skill-matched volunteers → WhatsApp alerts.
    Also starts a 3-minute timeout task that re-alerts if no one accepts.
    """
    initial_state = {
        "message":           report.message,
        "latitude":          report.lat,
        "longitude":         report.lon,
        "phone":             report.phone,
        "emergency_type":    "",
        "incident_id":       0,
        "nearby_volunteers": [],
    }

    final_state = graph_app.invoke(initial_state)

    incident_id = final_state["incident_id"]

    # Start timeout task — fire and forget
    asyncio.create_task(
        _timeout_rebroadcast(incident_id, report.lat, report.lon, report.message)
    )

    volunteers_info = [
        {
            "id":           v.get("id"),
            "name":         v.get("name"),
            "skill":        v.get("skill"),
            "distance_km":  float(v.get("distance_km", 0.0)),
        }
        for v in final_state.get("nearby_volunteers", [])
    ]

    return {
        "status":            "success",
        "incident_id":       incident_id,
        "emergency_type":    final_state["emergency_type"],
        "nearby_volunteers": volunteers_info,
    }


@router.post("/accept")
async def accept_incident(payload: AcceptPayload):
    """
    Volunteer accepts → update DB, notify victim via WhatsApp + WebSocket.
    Also increments the volunteer's responses_count.
    """
    # Update incident
    supabase.table("incidents").update({
        "status":      "accepted",
        "accepted_by": payload.volunteer_id,
    }).eq("id", payload.incident_id).execute()

    # Fetch volunteer info
    vol_result = supabase.table("users").select(
        "id, name, skill, phone_number, responses_count"
    ).eq("id", payload.volunteer_id).execute()

    if not vol_result.data:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    volunteer = vol_result.data[0]

    # Increment volunteer's response count
    new_count = (volunteer.get("responses_count") or 0) + 1
    supabase.table("users").update(
        {"responses_count": new_count}
    ).eq("id", payload.volunteer_id).execute()

    # Fetch victim phone from incident
    inc_result = supabase.table("incidents").select("phone").eq(
        "id", payload.incident_id
    ).execute()

    victim_phone = inc_result.data[0].get("phone") if inc_result.data else None

    # Send WhatsApp message to victim
    if victim_phone:
        send_victim_accepted(
            phone=victim_phone,
            incident_id=payload.incident_id,
            volunteer_name=volunteer["name"],
            volunteer_skill=volunteer.get("skill", "Volunteer"),
        )

    # Broadcast to WebSocket clients (victim's open browser tab)
    await broadcast({
        "event":       "volunteer_accepted",
        "incident_id": payload.incident_id,
        "volunteer":   {
            "id":   volunteer["id"],
            "name": volunteer["name"],
            "skill": volunteer.get("skill"),
        },
    })

    return {"status": "accepted", "volunteer": volunteer}


@router.post("/location")
async def update_volunteer_location(payload: LocationUpdate):
    """Streams volunteer GPS to victim's browser via WebSocket."""
    await broadcast({
        "event":       "volunteer_location",
        "incident_id": payload.incident_id,
        "latitude":    payload.latitude,
        "longitude":   payload.longitude,
    })
    return {"status": "ok"}


@router.post("/resolve")
async def resolve_incident(payload: ResolvePayload):
    """
    Volunteer marks victim as rescued.
    - Closes the incident in DB
    - Sends WhatsApp confirmation to victim
    - Broadcasts resolved event to all WebSocket clients
    """
    supabase.table("incidents").update({
        "status":      "resolved",
        "resolved_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", payload.incident_id).execute()

    # Fetch volunteer name + victim phone
    vol_result = supabase.table("users").select("name").eq(
        "id", payload.volunteer_id
    ).execute()
    inc_result = supabase.table("incidents").select("phone").eq(
        "id", payload.incident_id
    ).execute()

    volunteer_name = vol_result.data[0]["name"] if vol_result.data else "Your helper"
    victim_phone   = inc_result.data[0].get("phone") if inc_result.data else None

    if victim_phone:
        send_victim_resolved(phone=victim_phone, volunteer_name=volunteer_name)

    await broadcast({
        "event":       "incident_resolved",
        "incident_id": payload.incident_id,
    })

    return {"status": "resolved"}


@router.get("/volunteer/{volunteer_id}/history")
async def get_volunteer_history(volunteer_id: int):
    """
    Returns all incidents this volunteer has responded to,
    plus their total response count.
    """
    # Fetch volunteer stats
    vol_result = supabase.table("users").select(
        "id, name, skill, responses_count"
    ).eq("id", volunteer_id).execute()

    if not vol_result.data:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    volunteer = vol_result.data[0]

    # Fetch incidents they accepted
    incidents = supabase.table("incidents").select(
        "id, type, message, status, created_at, resolved_at"
    ).eq("accepted_by", volunteer_id).order("created_at", desc=True).execute().data

    return {
        "volunteer":       volunteer,
        "total_responses": volunteer.get("responses_count", 0),
        "incidents":       incidents,
    }