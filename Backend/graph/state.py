from typing import TypedDict, List


class EmergencyState(TypedDict):

    message: str

    latitude: float
    longitude: float

    emergency_type: str

    incident_id: int

    responders: List[dict]