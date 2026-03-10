from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict
from Agents.Emergency_classsifier import classify_emergency_node
from DB.client import supabase
from routes.ws_broadcast import broadcast
from utils.whatsapp_link import generate_whatsapp_link
import asyncio
import math

class EmergencyState(TypedDict):
    message: str
    latitude: float
    longitude: float
    emergency_type: str
    incident_id: int
    nearby_volunteers: list


workflow = StateGraph(EmergencyState)


# ---------------------------
# CLASSIFY EMERGENCY
# ---------------------------
def classify_node(state: EmergencyState) -> EmergencyState:

    state["emergency_type"] = classify_emergency_node(state["message"])

    return state


# ---------------------------
# STORE INCIDENT
# ---------------------------
def store_incident_node(state: EmergencyState) -> EmergencyState:

    data = {
        "message": state["message"],
        "latitude": state["latitude"],
        "longitude": state["longitude"],
        "type": state["emergency_type"],
        "status": "active"
    }

    result = supabase.table("incidents").insert(data).execute()

    incident_id = result.data[0]["id"]

    state["incident_id"] = incident_id

    asyncio.create_task(broadcast(data))

    return state


# ---------------------------
# FIND NEARBY VOLUNTEERS
# ---------------------------
def find_nearby_volunteers_node(state: EmergencyState) -> EmergencyState:

    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)

        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2

        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))


    volunteers = supabase.table("users").select(
        "id,name,phone_number,latitude,longitude,skill"
    ).execute().data

    nearby = []

    for v in volunteers:

        distance = haversine(
            state["latitude"],
            state["longitude"],
            v["latitude"],
            v["longitude"]
        )

        if distance <= 5:
            nearby.append(v)

    state["nearby_volunteers"] = nearby

    return state


# ---------------------------
# SEND WHATSAPP ALERTS
# ---------------------------
def send_whatsapp_alert_node(state: EmergencyState) -> EmergencyState:

    for volunteer in state["nearby_volunteers"]:

        phone = volunteer.get("phone_number")

        if phone:

            link = generate_whatsapp_link(
                phone,
                state["incident_id"],
                state["message"],
                state["latitude"],
                state["longitude"]
            )

            print(f"\nSend this to {volunteer['name']}:\n{link}\n")

    return state


# ---------------------------
# GRAPH STRUCTURE
# ---------------------------

workflow.add_node("classify_emergency", classify_node)
workflow.add_node("store_incident", store_incident_node)
workflow.add_node("find_nearby_volunteers", find_nearby_volunteers_node)
workflow.add_node("send_whatsapp_alert", send_whatsapp_alert_node)

workflow.add_edge(START, "classify_emergency")
workflow.add_edge("classify_emergency", "store_incident")
workflow.add_edge("store_incident", "find_nearby_volunteers")
workflow.add_edge("find_nearby_volunteers", "send_whatsapp_alert")
workflow.add_edge("send_whatsapp_alert", END)

graph_app = workflow.compile()