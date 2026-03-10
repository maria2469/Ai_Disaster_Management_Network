# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.emergency import router as emergency_router
# from routes.ws_broadcast import broadcast as websocket_router  # optional if using websockets

app = FastAPI(
    title="AI Disaster Management Network",
    version="1.0.0"
)

# ---------------------------
# CORS (allow React frontend)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Routers
# ---------------------------
app.include_router(emergency_router, prefix="/emergency", tags=["Emergency"])
# app.include_router(websocket_router, tags=["WebSocket"])  # optional

# ---------------------------
# Health check
# ---------------------------
@app.get("/")
def home():
    return {"status": "AI Disaster Network Backend Running"}