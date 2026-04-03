# utils/whatsapp.py
import os
import requests

INSTANCE_ID = os.getenv("ULTRAMSG_INSTANCE_ID")
TOKEN       = os.getenv("ULTRAMSG_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080/emergency")


def _post(phone: str, text: str) -> bool:
    """Low-level UltraMsg send. Returns True on success."""
    try:
        r = requests.post(
            f"https://api.ultramsg.com/{INSTANCE_ID}/messages/chat",
            data={"token": TOKEN, "to": f"+{phone}", "body": text},
            timeout=10,
        )
        return r.json().get("sent") == "true"
    except Exception as e:
        print(f"[WhatsApp] send error → {phone}: {e}")
        return False


# ── Volunteer alert (on new incident) ──────────────────────────────────────

def send_volunteer_alert(phone: str, incident_id: int, message: str,
                         lat: float, lon: float) -> bool:
    text = f"""🚨 EMERGENCY ALERT 🚨

Someone nearby needs help!

Message: {message}

Open Emergency Page:
{FRONTEND_URL}/{incident_id}

Victim Location:
https://www.google.com/maps?q={lat},{lon}

Respond quickly if you can help."""
    return _post(phone, text)


# ── Victim alert: volunteer accepted ───────────────────────────────────────

def send_victim_accepted(phone: str, incident_id: int,
                         volunteer_name: str, volunteer_skill: str) -> bool:
    text = f"""✅ Help is on the way!

{volunteer_name} ({volunteer_skill}) has accepted your emergency and is heading to you.

Track their location here:
{FRONTEND_URL}/{incident_id}

Stay calm and stay safe. 🙏"""
    return _post(phone, text)


# ── Victim alert: case resolved ────────────────────────────────────────────

def send_victim_resolved(phone: str, volunteer_name: str) -> bool:
    text = f"""✅ Emergency Resolved

{volunteer_name} has marked your emergency as resolved.

Thank you for using the Disaster Network. Stay safe! 🙏

If you still need help, please report a new emergency."""
    return _post(phone, text)