import urllib.parse

FRONTEND_URL = "http://localhost:8000/emergency"

def generate_whatsapp_link(phone, incident_id, message, lat, lon):

    text = f"""
🚨 EMERGENCY ALERT 🚨

Someone nearby needs help.

Message:
{message}

Emergency Dashboard:
{FRONTEND_URL}/{incident_id}

Victim Location:
https://www.google.com/maps?q={lat},{lon}

Respond quickly if you can help.
"""

    encoded_text = urllib.parse.quote(text)

    return f"https://wa.me/{phone}?text={encoded_text}"