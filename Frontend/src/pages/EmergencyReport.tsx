import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import { Mic, MicOff, MapPin, CheckCircle, Loader2, Phone, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@/lib/api";

type ReportState = "input" | "sending" | "sent";

interface Volunteer {
  id: number;
  name: string;
  skill: string;
  distance_km: number;
}

interface ReportResponse {
  status: string;
  incident_id: number;
  emergency_type: string;
  nearby_volunteers: Volunteer[];
}

function skillLabel(skill: string): string {
  const map: Record<string, string> = {
    doctor: "🏥 Doctor",
    nurse: "🏥 Nurse",
    firefighter: "🚒 Firefighter",
    "first-aid": "🩹 First Aid",
    paramedic: "🚑 Paramedic",
    police: "👮 Police",
  };
  return map[skill?.toLowerCase()] ?? `🤝 ${skill ?? "Volunteer"}`;
}

const EmergencyReport = () => {
  const [state, setState] = useState<ReportState>("input");
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [recording, setRecording] = useState(false);
  const [responseData, setResponseData] = useState<ReportResponse | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Speech recognition ref
  const [recognition, setRecognition] = useState<any>(null);

  // Get live GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); },
      () => setLocationError("Please allow location access."),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.continuous = false;
    r.onresult = (e: any) => {
      setText(e.results[0][0].transcript);
      setRecording(false);
    };
    r.onend = () => setRecording(false);
    setRecognition(r);
  }, []);

  const toggleRecording = () => {
    if (!recognition) return;
    if (recording) {
      recognition.stop();
      setRecording(false);
    } else {
      recognition.start();
      setRecording(true);
    }
  };

  const handleSend = async () => {
    if (!latitude || !longitude) {
      alert("Waiting for GPS. Please allow location access.");
      return;
    }
    if (!phone.trim()) {
      alert("Please enter your phone number so helpers can reach you.");
      return;
    }

    setState("sending");
    try {
      const res = await fetch(`${API_BASE}/emergency/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || "Voice emergency",
          lat: latitude,
          lon: longitude,
          phone: phone.replace(/\D/g, ""), // strip non-digits
        }),
      });

      if (!res.ok) throw new Error("Failed to send");
      const data: ReportResponse = await res.json();
      setResponseData(data);
      setState("sent");
    } catch {
      alert("Failed to send emergency. Try again.");
      setState("input");
    }
  };

  const canSend = (text.trim() || recording) && latitude !== null && longitude !== null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-lg px-4 py-6">
        <AnimatePresence mode="wait">

          {/* ── INPUT ── */}
          {state === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Report Emergency</h1>
                <p className="text-sm text-muted-foreground mt-1">Describe what's happening</p>
              </div>

              {/* Voice button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleRecording}
                  className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${recording
                      ? "bg-primary text-primary-foreground emergency-pulse"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {recording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </button>
                <p className="text-xs text-muted-foreground">
                  {recognition
                    ? recording ? "Recording… tap to stop" : "Tap to use voice"
                    : "Voice not supported in this browser"}
                </p>
              </div>

              {/* Text input */}
              <Textarea
                placeholder='e.g. "There is a fire in my building and I cannot get out."'
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] text-base"
              />

              {/* Phone number — so victim can receive WhatsApp updates */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Your WhatsApp Number
                </label>
                <Input
                  placeholder="923001234567 (no + sign)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">
                  You'll receive WhatsApp updates when a helper accepts your request
                </p>
              </div>

              {/* Location */}
              <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-foreground">Your Location</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {latitude && longitude
                    ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                    : locationError || "Detecting…"}
                </p>
                <MapView latitude={latitude} longitude={longitude} className="h-48 w-full" />
              </div>

              <Button
                variant="emergency"
                size="xl"
                className="w-full"
                onClick={handleSend}
                disabled={!canSend}
              >
                🚨 SEND EMERGENCY ALERT
              </Button>
            </motion.div>
          )}

          {/* ── SENDING ── */}
          {state === "sending" && (
            <motion.div
              key="sending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex min-h-[60vh] flex-col items-center justify-center space-y-4"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-semibold text-foreground">Sending alert…</p>
              <p className="text-sm text-muted-foreground">Finding nearby responders</p>
            </motion.div>
          )}

          {/* ── SENT ── */}
          {state === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Emergency Alert Sent</h2>
                <p className="text-sm text-muted-foreground">
                  Nearby responders are being notified.<br />You'll receive a WhatsApp update when someone accepts.
                </p>
              </div>

              {/* Notified volunteers list */}
              {responseData && responseData.nearby_volunteers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {responseData.nearby_volunteers.length} responder{responseData.nearby_volunteers.length > 1 ? "s" : ""} alerted
                  </p>
                  {responseData.nearby_volunteers.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{skillLabel(v.skill)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{v.distance_km} km</span>
                    </div>
                  ))}
                </div>
              )}

              {responseData && responseData.nearby_volunteers.length === 0 && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                  ⚠️ No skill-matched volunteers found nearby. The system will automatically search a wider area in 3 minutes.
                </div>
              )}

              <Button variant="secondary" size="lg" className="w-full" onClick={() => setState("input")}>
                Report Another Emergency
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default EmergencyReport;