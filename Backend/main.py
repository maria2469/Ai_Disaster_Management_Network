# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.emergency import router as emergency_router
from websocket.manager import router as ws_router

app = FastAPI(title="AI Disaster Management Network", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow all origins in dev
    allow_credentials=False,      # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emergency_router, tags=["Emergency"])
app.include_router(ws_router, tags=["WebSocket"])

@app.get("/")
def health_check():
    return {"status": "AI Disaster Network Backend Running"}