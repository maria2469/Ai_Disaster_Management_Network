# graph/emergency_graph.py
import math
import asyncio
from datetime import datetime, timezone
from typing import List
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END

from agents.emergency_classifier import classify_emergency
from db.client import supabase
from websocket.manager import broadcast
from utils.whatsapp import send_whatsapp_alert


# ──────────────────────────────────────────────
# State definition
# ──────────────────────────────────────────────

class EmergencyState(TypedDict):
    message: str
    latitude: float
    longitude: float
    emergency_type: str         # filled by classify_node
    incident_id: int            # filled by store_incident_node
    nearby_volunteers: List[dict]  # filled by find_nearby_volunteers_node


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometres between two coordinates."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ──────────────────────────────────────────────
# Node 1 — classify the emergency message
# ──────────────────────────────────────────────

def classify_node(state: EmergencyState) -> EmergencyState:
    state["emergency_type"] = classify_emergency(state["message"])
    return state


# ──────────────────────────────────────────────
# Node 2 — store incident in Supabase + broadcast over WebSocket
# ──────────────────────────────────────────────

def store_incident_node(state: EmergencyState) -> EmergencyState:
    payload = {
        "message":    state["message"],
        "latitude":   state["latitude"],
        "longitude":  state["longitude"],
        "type":       state["emergency_type"],
        "status":     "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = supabase.table("incidents").insert(payload).execute()
    state["incident_id"] = result.data[0]["id"]

    # Broadcast to any live dashboard clients (fire-and-forget)
    asyncio.create_task(broadcast(payload))

    return state


# ──────────────────────────────────────────────
# Node 3 — find volunteers within 5 km
# ──────────────────────────────────────────────

def find_nearby_volunteers_node(state: EmergencyState) -> EmergencyState:
    volunteers = (
        supabase.table("users")
        .select("id, name, phone_number, latitude, longitude, skill")
        .execute()
        .data
    )

    state["nearby_volunteers"] = [
        v for v in volunteers
        if _haversine_km(
            state["latitude"], state["longitude"],
            v["latitude"],     v["longitude"]
        ) <= 5
    ]
    return state


# ──────────────────────────────────────────────
# Node 4 — send real WhatsApp alerts via UltraMsg
# ──────────────────────────────────────────────

def send_whatsapp_alert_node(state: EmergencyState) -> EmergencyState:
    for volunteer in state["nearby_volunteers"]:
        phone = volunteer.get("phone_number")
        if not phone:
            continue

        success = send_whatsapp_alert(
            phone=phone,
            incident_id=state["incident_id"],
            message=state["message"],
            lat=state["latitude"],
            lon=state["longitude"],
        )

        status = "✅ sent" if success else "❌ failed"
        print(f"[WhatsApp] → {volunteer['name']} ({phone}): {status}")

    return state


# ──────────────────────────────────────────────
# Build & compile the graph
# ──────────────────────────────────────────────

_workflow = StateGraph(EmergencyState)

_workflow.add_node("classify_emergency",     classify_node)
_workflow.add_node("store_incident",         store_incident_node)
_workflow.add_node("find_nearby_volunteers", find_nearby_volunteers_node)
_workflow.add_node("send_whatsapp_alert",    send_whatsapp_alert_node)

_workflow.add_edge(START,                    "classify_emergency")
_workflow.add_edge("classify_emergency",     "store_incident")
_workflow.add_edge("store_incident",         "find_nearby_volunteers")
_workflow.add_edge("find_nearby_volunteers", "send_whatsapp_alert")
_workflow.add_edge("send_whatsapp_alert",    END)

graph_app = _workflow.compile()
