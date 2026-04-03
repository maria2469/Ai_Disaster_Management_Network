import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import StatusIndicator from "@/components/StatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Clock, Loader2, User, CheckCircle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, WS_BASE } from "@/lib/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Incident {
    id: number;
    type: string;
    message: string;
    latitude: number;
    longitude: number;
    status: string;
    created_at: string;
}

interface Volunteer {
    id: number;
    name: string;
    skill: string;
}

interface LatLon { lat: number; lon: number; }

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function mapStatus(s: string): "critical" | "active" | "pending" | "resolved" {
    if (s === "critical") return "critical";
    if (s === "active") return "active";
    if (s === "resolved") return "resolved";
    return "pending";
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

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const EmergencyPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // ── Volunteer workflow ──────────────────────
    const [accepted, setAccepted] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [resolved, setResolved] = useState(false);
    const [resolving, setResolving] = useState(false);

    // ── Victim-side: populated via WebSocket ────
    const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
    const [volunteerLocation, setVolunteerLocation] = useState<LatLon | null>(null);
    const [volunteerAccepted, setVolunteerAccepted] = useState(false);

    // ── Volunteer's own live GPS ─────────────────
    // Use a ref so the interval always reads the latest value (avoids stale closure)
    const myLocationRef = useRef<LatLon | null>(null);
    const [myLocationDisplay, setMyLocationDisplay] = useState<LatLon | null>(null);

    const locationWatchRef = useRef<number | null>(null);
    const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const volunteerIdRef = useRef<number>(1); // TODO: replace with real auth

    // ── Fetch incident ──────────────────────────
    const { data: incident, isLoading, error } = useQuery<Incident>({
        queryKey: ["incident", id],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/emergency/${id}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
    });

    // ── WebSocket listener ──────────────────────
    useEffect(() => {
        if (!id) return;
        const ws = new WebSocket(`${WS_BASE}/ws`);

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (Number(data.incident_id) !== Number(id)) return;

                if (data.event === "volunteer_accepted") {
                    setVolunteer(data.volunteer);
                    setVolunteerAccepted(true);
                }
                if (data.event === "volunteer_location") {
                    setVolunteerLocation({ lat: data.latitude, lon: data.longitude });
                }
                if (data.event === "incident_resolved") {
                    setResolved(true);
                }
            } catch { /* ignore bad frames */ }
        };

        return () => ws.close();
    }, [id]);

    // ── Stop streaming helper ───────────────────
    const stopStreaming = useCallback(() => {
        if (locationWatchRef.current !== null) {
            navigator.geolocation.clearWatch(locationWatchRef.current);
            locationWatchRef.current = null;
        }
        if (locationIntervalRef.current !== null) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => () => stopStreaming(), [stopStreaming]);

    // ── Start streaming — only called after accept ──
    const startStreaming = useCallback((volunteerId: number) => {
        if (!navigator.geolocation) return;

        // Watch GPS and store in ref (not state) so interval sees latest value
        locationWatchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                myLocationRef.current = loc;
                setMyLocationDisplay(loc); // update display separately
            },
            (err) => console.error("GPS error:", err),
            { enableHighAccuracy: true }
        );

        // POST to backend every 5 seconds using ref value (always fresh)
        locationIntervalRef.current = setInterval(() => {
            const loc = myLocationRef.current;
            if (!loc) return; // GPS not ready yet — skip this tick

            fetch(`${API_BASE}/emergency/location`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    incident_id: Number(id),
                    volunteer_id: volunteerId,
                    latitude: loc.lat,
                    longitude: loc.lon,
                }),
            }).catch(console.error);
        }, 5000);
    }, [id]);

    // ── Accept handler ──────────────────────────
    const handleAccept = async () => {
        setAccepting(true);
        try {
            const volunteerId = volunteerIdRef.current;

            const res = await fetch(`${API_BASE}/emergency/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    incident_id: Number(id),
                    volunteer_id: volunteerId,
                }),
            });

            if (!res.ok) throw new Error("Accept failed");

            // Only start streaming AFTER successful accept
            setAccepted(true);
            startStreaming(volunteerId);
        } catch (e) {
            console.error(e);
            alert("Failed to accept. Check backend is running.");
        } finally {
            setAccepting(false);
        }
    };

    // ── Resolve handler ─────────────────────────
    const handleResolve = async () => {
        setResolving(true);
        try {
            const res = await fetch(`${API_BASE}/emergency/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    incident_id: Number(id),
                    volunteer_id: volunteerIdRef.current,
                }),
            });

            if (!res.ok) throw new Error("Resolve failed");

            stopStreaming();
            setResolved(true);
        } catch (e) {
            console.error(e);
            alert("Failed to resolve. Try again.");
        } finally {
            setResolving(false);
        }
    };

    // ── Loading / error ─────────────────────────
    if (isLoading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </div>
    );

    if (error || !incident) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Incident not found</p>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>Back</Button>
            </div>
        </div>
    );

    // ── Resolved screen ─────────────────────────
    if (resolved) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container max-w-lg px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center"
                >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
                        <Trophy className="h-10 w-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Case Closed ✅</h2>
                    <p className="text-sm text-muted-foreground">
                        The victim has been rescued. Thank you for your help. 🙏<br />
                        This response has been added to your history.
                    </p>
                    <Button size="lg" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </motion.div>
            </main>
        </div>
    );

    // ── Main render ─────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="gradient-emergency px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2 text-primary-foreground">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-bold text-lg">🚨 EMERGENCY NEAR YOU</span>
                </div>
            </div>

            <main className="container max-w-lg px-4 py-6 space-y-6">
                <AnimatePresence mode="wait">

                    {/* ── BEFORE ACCEPT ── */}
                    {!accepted && (
                        <motion.div
                            key="pre"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Show if victim's page — volunteer already accepted */}
                            {volunteerAccepted && volunteer && (
                                <div className="rounded-xl bg-success/10 border border-success/30 p-4">
                                    <p className="text-sm font-semibold text-success">
                                        ✅ {volunteer.name} ({skillLabel(volunteer.skill)}) is on the way!
                                    </p>
                                </div>
                            )}

                            <Card className="border-l-4 border-l-primary shadow-lg border-0">
                                <CardContent className="p-5 space-y-4">
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg capitalize">
                                            {incident.type || "Emergency"}
                                        </h3>
                                        <StatusIndicator status={mapStatus(incident.status)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-muted p-3">
                                            <p className="text-xs text-muted-foreground">Location</p>
                                            <p className="text-sm font-bold text-foreground flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-muted p-3">
                                            <p className="text-xs text-muted-foreground">Reported</p>
                                            <p className="text-sm font-bold text-foreground flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {getTimeAgo(incident.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                                        <p className="text-sm font-medium text-foreground">{incident.message}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <MapView
                                latitude={incident.latitude}
                                longitude={incident.longitude}
                                className="h-48"
                            />

                            <div className="space-y-3">
                                <Button
                                    variant="emergency"
                                    size="xl"
                                    className="w-full"
                                    onClick={handleAccept}
                                    disabled={accepting}
                                >
                                    {accepting
                                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Accepting…</>
                                        : "Accept Rescue Task"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Decline
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── AFTER ACCEPT ── */}
                    {accepted && (
                        <motion.div
                            key="post"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            {/* Status */}
                            <div className="rounded-xl bg-success/10 border border-success/30 p-4 flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-success shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-success">Task Accepted</p>
                                    <p className="text-xs text-muted-foreground">
                                        Victim notified via WhatsApp. Your location is being shared live.
                                    </p>
                                </div>
                            </div>

                            {/* Volunteer info card */}
                            {volunteer && (
                                <Card className="border-0 shadow-md">
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Sent to victim
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{volunteer.name}</p>
                                                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                                                    {skillLabel(volunteer.skill)}
                                                </span>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                                                    <p className="text-xs text-muted-foreground">Live location streaming</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Live map */}
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">Live Map</p>
                                <MapView
                                    latitude={incident.latitude}
                                    longitude={incident.longitude}
                                    className="h-64 w-full"
                                />
                            </div>

                            {/* Coordinates */}
                            <Card className="border-0 bg-muted/50">
                                <CardContent className="p-4 grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Victim</p>
                                        <p className="text-xs font-mono font-bold text-foreground">
                                            {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">You (live)</p>
                                        <p className="text-xs font-mono font-bold text-foreground">
                                            {myLocationDisplay
                                                ? `${myLocationDisplay.lat.toFixed(5)}, ${myLocationDisplay.lon.toFixed(5)}`
                                                : "Detecting GPS…"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Navigate */}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full"
                            >
                                <Button variant="default" size="lg" className="w-full">
                                    <MapPin className="h-4 w-4 mr-2" /> Open Navigation
                                </Button>
                            </a>

                            {/* Rescue button */}
                            <Button
                                size="lg"
                                className="w-full bg-success hover:bg-success/90 text-white font-bold"
                                onClick={handleResolve}
                                disabled={resolving}
                            >
                                {resolving
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Closing case…</>
                                    : "✅ Victim Rescued — Close Case"}
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                onClick={() => { stopStreaming(); setAccepted(false); }}
                            >
                                Cancel Response
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};

export default EmergencyPage;