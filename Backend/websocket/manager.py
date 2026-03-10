from fastapi import WebSocket, APIRouter
from haversine import haversine

router = APIRouter()
connections = []

@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connections.append(ws)
    try:
        while True:
            await ws.receive_text()  # placeholder
    except:
        connections.remove(ws)

async def broadcast(message: dict):
    for conn in connections:
        try:
            await conn.send_json(message)
        except:
            connections.remove(conn)


async def broadcast_nearby(message, user_lat, user_lon, radius_km=5):
    for ws, (lat, lon) in connections.items():
        distance = haversine((user_lat, user_lon), (lat, lon))
        if distance <= radius_km:
            await ws.send_json(message)