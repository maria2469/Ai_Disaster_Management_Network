import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import StatusIndicator from "@/components/StatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { API_BASE } from "@/lib/api";

interface Incident {
    id: number;
    emergency_type: string;
    message: string;
    latitude: number;
    longitude: number;
    status: string;
    created_at: string;
}

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function mapStatus(status: string): "critical" | "active" | "pending" | "resolved" {
    if (status === "critical") return "critical";
    if (status === "active") return "active";
    if (status === "resolved") return "resolved";
    return "pending";
}

const EmergencyPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);

    const { data: incident, isLoading, error } = useQuery<Incident>({
        queryKey: ["incident", id],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/emergency/${id}`);
            if (!res.ok) throw new Error("Failed to fetch incident");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error || !incident) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                    <p className="text-muted-foreground">Incident not found</p>
                    <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Alert banner */}
            <div className="gradient-emergency px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2 text-primary-foreground">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-bold text-lg">🚨 EMERGENCY NEAR YOU</span>
                </div>
            </div>

            <main className="container max-w-lg px-4 py-6 space-y-6">
                {!accepted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Card className="border-l-4 border-l-primary shadow-lg border-0">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg">{incident.emergency_type || "Emergency"}</h3>
                                        <StatusIndicator status={mapStatus(incident.status)} />
                                    </div>
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
                                            <Clock className="h-4 w-4" /> {getTimeAgo(incident.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                                    <p className="text-sm font-medium text-foreground">{incident.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(incident.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <MapView latitude={incident.latitude} longitude={incident.longitude} className="h-48" />

                        <div className="space-y-3">
                            <Button
                                variant="emergency"
                                size="xl"
                                className="w-full"
                                onClick={() => setAccepted(true)}
                            >
                                Accept Rescue Task
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
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center"
                    >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
                            <MapPin className="h-10 w-10 text-success" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Task Accepted</h2>
                        <p className="text-sm text-muted-foreground">
                            Navigate to the emergency location.<br />Stay safe and follow protocols.
                        </p>
                        <MapView latitude={incident.latitude} longitude={incident.longitude} className="h-48 w-full" />
                        <Button variant="outline" size="lg" onClick={() => setAccepted(false)}>
                            Cancel Response
                        </Button>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default EmergencyPage;
