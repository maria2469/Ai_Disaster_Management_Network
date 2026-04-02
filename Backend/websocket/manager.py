# websocket/manager.py
from fastapi import WebSocket, APIRouter

router = APIRouter()

# Active WebSocket connections
_connections: list[WebSocket] = []


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    _connections.append(ws)
    try:
        while True:
            await ws.receive_text()  # Keep connection alive
    except Exception:
        pass
    finally:
        _connections.remove(ws)


async def broadcast(message: dict):
    """Broadcast a JSON message to all connected WebSocket clients."""
    dead = []
    for ws in _connections:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _connections.remove(ws)
