# utils/whatsapp.py
import os
import requests

INSTANCE_ID = os.getenv("ULTRAMSG_INSTANCE_ID")
TOKEN = os.getenv("ULTRAMSG_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080/emergency")


def send_whatsapp_alert(phone: str, incident_id: int, message: str, lat: float, lon: float) -> bool:
    """
    Send a WhatsApp alert to a volunteer via UltraMsg.
    Phone must be in international format without + (e.g. 923001234567)
    Returns True if sent successfully.
    """
    page_url = f"{FRONTEND_URL}/{incident_id}"
    maps_url = f"https://www.google.com/maps?q={lat},{lon}"

    text = f"""🚨 EMERGENCY ALERT 🚨

Someone nearby needs help.

Message: {message}

Emergency Page: {page_url}
Victim Location: {maps_url}

Respond quickly if you can help."""

    try:
        response = requests.post(
            f"https://api.ultramsg.com/{INSTANCE_ID}/messages/chat",
            data={
                "token": TOKEN,
                "to": f"+{phone}",
                "body": text,
            },
            timeout=10
        )
        result = response.json()
        return result.get("sent") == "true"

    except Exception as e:
        print(f"[WhatsApp] Error sending to {phone}: {e}")
        return False
