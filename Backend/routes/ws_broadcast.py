# routes/ws_broadcast.py
from websocket.manager import connections
import asyncio

async def broadcast(message: dict):
    """
    Broadcast a message to all connected WebSocket clients.
    """
    to_remove = []
    for ws in connections:
        try:
            await ws.send_json(message)
        except Exception:
            to_remove.append(ws)

    for ws in to_remove:
        connections.remove(ws)