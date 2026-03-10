import urllib.parse
import os

# Use environment variable if deploying
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080/emergency")

def generate_whatsapp_link(phone: str, incident_id: int, message: str, lat: float, lon: float) -> str:
    """
    Generates a WhatsApp link for volunteers that opens the emergency page.
    """
    # Link to your React EmergencyPage
    emergency_page_url = f"{FRONTEND_URL}/{incident_id}"

    # Message text
    text = f"""
🚨 EMERGENCY ALERT 🚨

Someone nearby needs help.

Message:
{message}

Emergency Page:
{emergency_page_url}

Victim Location:
https://www.google.com/maps?q={lat},{lon}

Respond quickly if you can help.
"""

    encoded_text = urllib.parse.quote(text.strip())
    return f"https://wa.me/{phone}?text={encoded_text}"