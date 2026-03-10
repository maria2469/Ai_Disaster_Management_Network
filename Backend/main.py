# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.emergency import router as emergency_router
# from routes.ws_broadcast import router as websocket_router  # uncomment if using websockets

app = FastAPI(
    title="AI Disaster Management Network",
    version="1.0.0"
)

# ---------------------------
# CORS (allow React frontend)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",  # current setup
        "http://localhost:3000",  # typical React dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Routers
# ---------------------------
app.include_router(emergency_router, tags=["Emergency"])
# app.include_router(websocket_router, tags=["WebSocket"])  # optional

# ---------------------------
# Health check
# ---------------------------
@app.get("/")
def home():
    return {"status": "AI Disaster Network Backend Running"}