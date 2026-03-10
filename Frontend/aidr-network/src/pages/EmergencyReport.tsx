import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import { Mic, MicOff, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ReportState = "input" | "sending" | "sent";

interface ReportResponse {
  status: string;
  incident_id: number;
  emergency_type: string;
  nearby_volunteers: {
    id: number;
    name: string;
    phone_number: string;
    distance_km: number;
  }[];
}

const EmergencyReport = () => {
  const [state, setState] = useState<ReportState>("input");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [responseData, setResponseData] = useState<ReportResponse | null>(null);

  // User location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Request live location once
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Please allow location access to send an emergency.");
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId); // cleanup
  }, []);

  const handleSend = async () => {
    if (latitude === null || longitude === null) {
      alert("Waiting for exact location. Please allow location access.");
      return;
    }

    setState("sending");
    try {
      const res = await fetch("http://localhost:8001/emergency/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text || "Voice input emergency",
          lat: latitude,
          lon: longitude,
        }),
      });

      if (!res.ok) throw new Error("Failed to send emergency");

      const data: ReportResponse = await res.json();
      setResponseData(data);
      setState("sent");
    } catch (err) {
      console.error(err);
      alert("Failed to send emergency. Try again.");
      setState("input");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-lg px-4 py-6">
        <AnimatePresence mode="wait">
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
                <p className="text-sm text-muted-foreground mt-1">Describe your emergency</p>
              </div>

              {/* Voice Input */}
              <div className="flex justify-center">
                <button
                  onClick={() => setRecording(!recording)}
                  className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${recording
                      ? "bg-primary text-primary-foreground emergency-pulse"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {recording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {recording ? "Recording... tap to stop" : "Tap to use voice input"}
              </p>

              {/* Text fallback */}
              <Textarea
                placeholder='Example: "There is a fire in my apartment and I cannot get out."'
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] text-base"
              />

              {/* Location */}
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-foreground">Location detected</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {latitude && longitude
                    ? `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`
                    : locationError || "Detecting location..."}
                </p>

                {/* Pass live coordinates to MapView */}
                <MapView
                  latitude={latitude}
                  longitude={longitude}
                  className="h-48 w-full"
                />
              </div>

              <Button
                variant="emergency"
                size="xl"
                className="w-full"
                onClick={handleSend}
                disabled={!text && !recording || latitude === null || longitude === null}
              >
                🚨 SEND EMERGENCY ALERT
              </Button>
            </motion.div>
          )}

          {state === "sending" && (
            <motion.div
              key="sending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[60vh] flex-col items-center justify-center space-y-4"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-semibold text-foreground">Sending alert...</p>
              <p className="text-sm text-muted-foreground">Searching for nearby responders</p>
            </motion.div>
          )}

          {state === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex min-h-[60vh] flex-col items-center justify-center space-y-4"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Emergency Alert Sent</h2>
              <p className="text-center text-sm text-muted-foreground">
                Nearby responders are being notified.<br />Stay calm and stay safe.
              </p>
              {responseData && (
                <p className="text-sm font-medium text-success">
                  {responseData.nearby_volunteers.length} responders notified successfully
                </p>
              )}
              <Button variant="secondary" size="lg" onClick={() => setState("input")}>
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