import os
import requests

INSTANCE_ID = os.getenv("ULTRAMSG_INSTANCE_ID")
TOKEN = os.getenv("ULTRAMSG_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080/emergency")


# ──────────────────────────────────────────────
# Phone normalization (VERY IMPORTANT)
# ──────────────────────────────────────────────

def normalize_phone(phone: str) -> str:
    phone = str(phone).strip()

    # already correct format
    if phone.startswith("+"):
        return phone

    # Pakistan number fix
    if phone.startswith("0"):
        return "+92" + phone[1:]

    # fallback
    return "+92" + phone


# ──────────────────────────────────────────────
# Low-level sender
# ──────────────────────────────────────────────

def _post(phone: str, text: str) -> bool:
    """Send WhatsApp message via UltraMsg"""
    try:
        phone = normalize_phone(phone)

        url = f"https://api.ultramsg.com/{INSTANCE_ID}/messages/chat"

        payload = {
            "token": TOKEN,
            "to": phone,
            "body": text
        }

        print("[WhatsApp DEBUG] Sending to:", phone)

        r = requests.post(url, data=payload, timeout=10)

        # DEBUG RESPONSE (VERY IMPORTANT)
        print("[WhatsApp RESPONSE]", r.status_code, r.text)

        try:
            data = r.json()
        except Exception:
            print("[WhatsApp] Invalid JSON response")
            return False

        # UltraMsg success patterns
        if data.get("sent") == "true" or data.get("sent") is True:
            return True

        print("[WhatsApp] Failed response:", data)
        return False

    except Exception as e:
        print(f"[WhatsApp ERROR] → {phone}: {e}")
        return False


# ──────────────────────────────────────────────
# Volunteer alert
# ──────────────────────────────────────────────

def send_volunteer_alert(phone: str, incident_id: int, message: str,
                         lat: float, lon: float) -> bool:

    text = f"""🚨 EMERGENCY ALERT 🚨

Someone nearby needs help!

Message: {message}

Open Emergency:
{FRONTEND_URL}/{incident_id}

Location:
https://www.google.com/maps?q={lat},{lon}

Respond immediately if available.
"""

    return _post(phone, text)


# ──────────────────────────────────────────────
# Victim: accepted
# ──────────────────────────────────────────────

def send_victim_accepted(phone: str, incident_id: int,
                         volunteer_name: str, volunteer_skill: str) -> bool:

    text = f"""✅ Help is on the way!

{volunteer_name} ({volunteer_skill}) has accepted your emergency.

Track here:
{FRONTEND_URL}/{incident_id}

Stay safe 🙏
"""

    return _post(phone, text)


# ──────────────────────────────────────────────
# Victim: resolved
# ──────────────────────────────────────────────

def send_victim_resolved(phone: str, volunteer_name: str) -> bool:

    text = f"""✅ Emergency Resolved

{volunteer_name} has marked your case as resolved.

Stay safe 🙏
"""

    return _post(phone, text)