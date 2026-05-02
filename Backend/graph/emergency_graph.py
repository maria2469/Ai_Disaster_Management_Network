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
from utils.whatsapp import send_volunteer_alert

# ──────────────────────────────────────────────
# Skill matching map
# If emergency type has no match, all volunteers are alerted.
# ──────────────────────────────────────────────
SKILL_MAP = {
    "medical":  ["doctor", "nurse", "paramedic", "first-aid"],
    "fire":     ["firefighter"],
    "accident": ["firefighter", "doctor", "nurse", "paramedic", "first-aid"],
    "crime":    ["police", "security"],
    "other":    [],  # empty = alert everyone
}


# ──────────────────────────────────────────────
# State
# ──────────────────────────────────────────────

class EmergencyState(TypedDict):
    message: str
    latitude: float
    longitude: float
    phone: str              # victim phone number
    emergency_type: str
    incident_id: int
    nearby_volunteers: List[dict]


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _skill_matches(volunteer_skill: str, emergency_type: str) -> bool:
    """Return True if the volunteer's skill is relevant to the emergency type."""
    required = SKILL_MAP.get(emergency_type.lower(), [])
    if not required:          # "other" or unknown type → alert everyone
        return True
    return (volunteer_skill or "").lower() in required


# ──────────────────────────────────────────────
# Node 1 — classify
# ──────────────────────────────────────────────

def classify_node(state: EmergencyState) -> EmergencyState:
    state["emergency_type"] = classify_emergency(state["message"])
    return state


# ──────────────────────────────────────────────
# Node 2 — store incident + broadcast
# ──────────────────────────────────────────────

def store_incident_node(state: EmergencyState) -> EmergencyState:
    payload = {
        "message":    state["message"],
        "latitude":   state["latitude"],
        "longitude":  state["longitude"],
        "type":       state["emergency_type"],
        "status":     "active",
        "phone":      state.get("phone", ""),   # victim phone stored for later alerts
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = supabase.table("incidents").insert(payload).execute()
    state["incident_id"] = result.data[0]["id"]

    asyncio.create_task(broadcast({**payload, "id": state["incident_id"]}))
    return state


# ──────────────────────────────────────────────
# Node 3 — find nearby + skill-matched volunteers
# ──────────────────────────────────────────────

def find_nearby_volunteers_node(state: EmergencyState) -> EmergencyState:
    # Fetch only AVAILABLE volunteers
    volunteers = (
        supabase.table("users")
        .select("id, name, phone_number, latitude, longitude, skill, status, responses_count")
        .eq("status", "available")   # ✅ FIXED (was is_available)
        .execute()
        .data
    )

    matched = []
    for v in volunteers:
        # Skip invalid coordinates (important safety)
        if v.get("latitude") is None or v.get("longitude") is None:
            continue

        distance = _haversine_km(
            state["latitude"], state["longitude"],
            v["latitude"],     v["longitude"]
        )

        skill_ok = _skill_matches(v.get("skill", ""), state["emergency_type"])

        if distance <= 5 and skill_ok:
            matched.append({
                **v,
                "distance_km": round(distance, 2)
            })

    # Sort by nearest first
    matched.sort(key=lambda v: v["distance_km"])

    state["nearby_volunteers"] = matched
    return state
# ──────────────────────────────────────────────
# Node 4 — send WhatsApp alerts to matched volunteers
# ──────────────────────────────────────────────

def send_whatsapp_alert_node(state: EmergencyState) -> EmergencyState:
    print("🔥 WhatsApp NODE EXECUTING")
    for volunteer in state["nearby_volunteers"]:
        phone = str(volunteer.get("phone_number"))

        # 🔥 FIX: normalize Pakistan number
        if not phone.startswith("+"):
            if phone.startswith("0"):
                phone = "+92" + phone[1:]
            else:
                phone = "+92" + phone

        print("[DEBUG WhatsApp]", phone)

        success = send_volunteer_alert(
            phone=phone,
            incident_id=state["incident_id"],
            message=state["message"],
            lat=state["latitude"],
            lon=state["longitude"],
        )

        print(f"[WhatsApp] → {volunteer['name']} → {'SENT' if success else 'FAILED'}")

    return state


# ──────────────────────────────────────────────
# Build graph
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