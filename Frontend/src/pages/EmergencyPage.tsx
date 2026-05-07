import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import StatusIndicator from "@/components/StatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    MapPin,
    Clock,
    Loader2,
    User,
    CheckCircle,
    Trophy,
} from "lucide-react";
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

interface LatLon {
    lat: number;
    lon: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const mapStatus = (s: string) =>
    (["critical", "active", "resolved"].includes(s) ? s : "pending") as any;

const skillLabel = (skill: string) => {
    const map: Record<string, string> = {
        doctor: "🏥 Doctor",
        nurse: "🏥 Nurse",
        firefighter: "🚒 Firefighter",
        "first-aid": "🩹 First Aid",
        paramedic: "🚑 Paramedic",
        police: "👮 Police",
    };
    return map[skill?.toLowerCase()] ?? `🤝 ${skill ?? "Volunteer"}`;
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const EmergencyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [accepted, setAccepted] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [resolved, setResolved] = useState(false);
    const [resolving, setResolving] = useState(false);

    const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
    const [volunteerLocation, setVolunteerLocation] = useState<LatLon | null>(null);
    const [volunteerAccepted, setVolunteerAccepted] = useState(false);

    const myLocationRef = useRef<LatLon | null>(null);
    const [myLocationDisplay, setMyLocationDisplay] = useState<LatLon | null>(null);

    const watchRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);
    const volunteerIdRef = useRef(1);

    const { data: incident, isLoading } = useQuery<Incident>({
        queryKey: ["incident", id],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/emergency/${id}`);
            return res.json();
        },
    });

    // ── WebSocket ──
    useEffect(() => {
        if (!id) return;
        const ws = new WebSocket(`${WS_BASE}/ws`);

        ws.onmessage = (e) => {
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
        };

        return () => ws.close();
    }, [id]);

    const stopStreaming = useCallback(() => {
        if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const startStreaming = useCallback((volunteerId: number) => {
        if (!navigator.geolocation) return;

        watchRef.current = navigator.geolocation.watchPosition((pos) => {
            const loc = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
            };
            myLocationRef.current = loc;
            setMyLocationDisplay(loc);
        });

        intervalRef.current = setInterval(() => {
            const loc = myLocationRef.current;
            if (!loc) return;

            fetch(`${API_BASE}/emergency/location`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    incident_id: Number(id),
                    volunteer_id: volunteerId,
                    latitude: loc.lat,
                    longitude: loc.lon,
                }),
            });
        }, 5000);
    }, [id]);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            const res = await fetch(`${API_BASE}/emergency/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    incident_id: Number(id),
                    volunteer_id: volunteerIdRef.current,
                }),
            });

            if (!res.ok) throw new Error();

            setAccepted(true);
            startStreaming(volunteerIdRef.current);
        } finally {
            setAccepting(false);
        }
    };

    const handleResolve = async () => {
        setResolving(true);
        try {
            await fetch(`${API_BASE}/emergency/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    incident_id: Number(id),
                    volunteer_id: volunteerIdRef.current,
                }),
            });

            stopStreaming();
            setResolved(true);
        } finally {
            setResolving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    if (!incident) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* HEADER */}
            <div className="w-full flex justify-center py-4 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Response Panel
                </div>
            </div>

            {/* MAIN WRAPPER (CENTERED) */}
            <div className="flex justify-center px-4 py-8">
                <div className="w-full max-w-2xl space-y-6">

                    {/* INCIDENT CARD */}
                    <Card className="shadow-md border-0 rounded-2xl">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold capitalize">
                                    {incident.type}
                                </h2>
                                <StatusIndicator status={mapStatus(incident.status)} />
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {incident.message}
                            </p>

                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {incident.latitude.toFixed(3)}, {incident.longitude.toFixed(3)}
                                </span>

                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {getTimeAgo(incident.created_at)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* MAP */}
                    <div className="rounded-2xl overflow-hidden shadow-md">
                        <MapView
                            latitude={incident.latitude}
                            longitude={incident.longitude}
                            className="h-64 w-full"
                        />
                    </div>

                    {/* ACTIONS */}
                    <AnimatePresence mode="wait">

                        {!accepted && (
                            <motion.div className="space-y-3">
                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={handleAccept}
                                    disabled={accepting}
                                >
                                    {accepting ? (
                                        <Loader2 className="animate-spin mr-2" />
                                    ) : null}
                                    Accept Emergency
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Decline
                                </Button>
                            </motion.div>
                        )}

                        {accepted && (
                            <motion.div className="space-y-5">

                                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border">
                                    <CheckCircle className="text-green-600" />
                                    <div>
                                        <p className="font-semibold">Accepted</p>
                                        <p className="text-xs text-muted-foreground">
                                            You are now responding
                                        </p>
                                    </div>
                                </div>

                                <Card className="rounded-2xl">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <User />
                                            <div>
                                                <p className="font-bold">{volunteer?.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {skillLabel(volunteer?.skill || "")}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`}
                                    target="_blank"
                                >
                                    <Button className="w-full">
                                        Open Navigation
                                    </Button>
                                </a>

                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={handleResolve}
                                    disabled={resolving}
                                >
                                    {resolving ? "Closing..." : "Mark as Resolved"}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        stopStreaming();
                                        setAccepted(false);
                                    }}
                                >
                                    Cancel
                                </Button>

                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default EmergencyPage;