from Agents.Emergency_classsifier import classify_emergency
from Backend.DB.client import SessionLocal
from models.models import Incident, User
from websocket.manager import broadcast


def classify_node(state):

    emergency_type = classify_emergency(state["message"])

    state["emergency_type"] = emergency_type

    return state


def store_incident_node(state):

    db = SessionLocal()

    incident = Incident(
        type=state["emergency_type"],
        description=state["message"],
        latitude=state["latitude"],
        longitude=state["longitude"],
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    state["incident_id"] = incident.id

    return state


def find_nearby_node(state):

    db = SessionLocal()

    users = db.query(User).all()

    nearby = []

    for user in users:

        distance = abs(user.latitude - state["latitude"]) + abs(
            user.longitude - state["longitude"]
        )

        if distance < 0.02:
            nearby.append({
                "id": user.id,
                "skill": user.skill
            })

    state["responders"] = nearby

    return state


def broadcast_node(state):

    message = {
        "incident_id": state["incident_id"],
        "type": state["emergency_type"],
        "location": [
            state["latitude"],
            state["longitude"]
        ],
        "responders": state["responders"]
    }

    import asyncio
    asyncio.create_task(broadcast(message))

    return state