import { useMemo, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle, Activity, Clock, TrendingUp, Radio, ShieldAlert, BarChart2,
} from "lucide-react";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
// @ts-ignore
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { API_BASE, WS_BASE } from "@/lib/api";

interface Incident {
    id: number;
    type: string;
    message: string;
    latitude: number;
    longitude: number;
    status: string;
    created_at: string;
    resolved_at?: string;
}

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

const CHART_THEME = {
    grid: "hsl(220 15% 18%)",
    tick: "hsl(220 10% 45%)",
    tooltip: {
        contentStyle: {
            background: "hsl(220 18% 10%)",
            border: "1px solid hsl(220 15% 18%)",
            borderRadius: "8px",
            color: "hsl(210 20% 92%)",
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
        },
        cursor: { fill: "hsl(220 15% 18% / 0.5)" },
    },
};

function getDay(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}
function getHour(dateStr: string) {
    return new Date(dateStr).getHours();
}
function calculateResponseMinutes(created: string, resolved?: string) {
    if (!resolved) return null;
    return Math.floor((new Date(resolved).getTime() - new Date(created).getTime()) / 60000);
}

const stagger = {
    container: { animate: { transition: { staggerChildren: 0.08 } } },
    item: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
    },
};

const AnalyticsPage = () => {
    const [liveFeed, setLiveFeed] = useState<string[]>([]);

    const { data: incidents = [] } = useQuery<Incident[]>({
        queryKey: ["analytics-incidents"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/emergency/all`);
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        refetchInterval: 15000,
    });

    useEffect(() => {
        const ws = new WebSocket(`${WS_BASE}/ws`);
        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                const event = `[${new Date().toLocaleTimeString()}] ${data.event || "UPDATE"} — #${data.incident_id || "?"}`;
                setLiveFeed((prev) => [event, ...prev.slice(0, 14)]);
            } catch { /* skip */ }
        };
        return () => ws.close();
    }, []);

    const totalIncidents = incidents.length;
    const activeIncidents = incidents.filter((i) => i.status === "active" || i.status === "critical").length;
    const resolvedIncidents = incidents.filter((i) => i.status === "resolved").length;
    const criticalIncidents = incidents.filter((i) => i.status === "critical").length;

    const incidentTypeData = useMemo(() => {
        const counts: Record<string, number> = {};
        incidents.forEach((i) => { const t = i.type || "Unknown"; counts[t] = (counts[t] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [incidents]);

    const trendData = useMemo(() => {
        const days: Record<string, number> = {};
        incidents.forEach((i) => { const d = getDay(i.created_at); days[d] = (days[d] || 0) + 1; });
        return Object.entries(days).map(([day, incidents]) => ({ day, incidents }));
    }, [incidents]);

    const hourData = useMemo(() => {
        const hours: Record<number, number> = {};
        incidents.forEach((i) => { const h = getHour(i.created_at); hours[h] = (hours[h] || 0) + 1; });
        return Object.entries(hours).map(([hour, count]) => ({ hour: `${hour}:00`, count }));
    }, [incidents]);

    const averageResponse = useMemo(() => {
        const resolved = incidents
            .map((i) => calculateResponseMinutes(i.created_at, i.resolved_at))
            .filter(Boolean) as number[];
        if (!resolved.length) return 0;
        return Math.floor(resolved.reduce((a, b) => a + b, 0) / resolved.length);
    }, [incidents]);

    const hotspotAreas = useMemo(() => {
        const hotspots: Record<string, number> = {};
        incidents.forEach((i) => {
            const key = `${i.latitude.toFixed(2)}, ${i.longitude.toFixed(2)}`;
            hotspots[key] = (hotspots[key] || 0) + 1;
        });
        return Object.entries(hotspots).filter(([_, c]) => c >= 3).slice(0, 5);
    }, [incidents]);

    const stats = [
        { label: "Total Incidents", value: totalIncidents, icon: AlertTriangle, color: "text-foreground", border: "border-border", bg: "bg-muted/20" },
        { label: "Active / Critical", value: activeIncidents, icon: Radio, color: "text-primary", border: "border-primary/25", bg: "bg-primary/8" },
        { label: "Resolved", value: resolvedIncidents, icon: ShieldAlert, color: "text-success", border: "border-success/25", bg: "bg-success/8" },
        { label: "Avg Response", value: `${averageResponse}m`, icon: Clock, color: "text-accent", border: "border-accent/25", bg: "bg-accent/8" },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container px-4 py-8 space-y-8 max-w">
                <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-8">

                    {/* ── Header ── */}
                    <motion.div variants={stagger.item} className="flex items-end justify-between">
                        <div>
                            <p className="text-xs font-mono text-muted-foreground tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
                                <BarChart2 className="h-3 w-3" /> Intelligence Platform
                            </p>
                            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-mono text-muted-foreground">
                                {incidents.length} records indexed
                            </p>
                            <p className="text-[10px] font-mono text-success flex items-center gap-1 justify-end mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE REFRESH
                            </p>
                        </div>
                    </motion.div>

                    {/* ── Stat Cards ── */}
                    <motion.div variants={stagger.item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((s) => (
                            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-5 card-hover`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{s.label}</p>
                                        <p className={`text-4xl font-bold font-mono ${s.color}`}>{s.value}</p>
                                    </div>
                                    <s.icon className={`h-5 w-5 mt-0.5 ${s.color} opacity-60`} />
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* ── Charts Row ── */}
                    <motion.div variants={stagger.item} className="grid gap-6 lg:grid-cols-2">

                        {/* Trend Line */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-foreground">Incident Trends</h3>
                                <span className="ml-auto text-[10px] font-mono text-muted-foreground">BY DAY</span>
                            </div>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="2 4" stroke={CHART_THEME.grid} />
                                        <XAxis dataKey="day" tick={{ fill: CHART_THEME.tick, fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                                        <Tooltip {...CHART_THEME.tooltip} />
                                        <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#ef4444" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="rounded-xl border border-border bg-card p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Activity className="h-4 w-4 text-accent" />
                                <h3 className="font-bold text-foreground">Emergency Distribution</h3>
                            </div>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={incidentTypeData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={40} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: CHART_THEME.tick }}>
                                            {incidentTypeData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip {...CHART_THEME.tooltip} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Bar Chart ── */}
                    <motion.div variants={stagger.item} className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Clock className="h-4 w-4 text-accent" />
                            <h3 className="font-bold text-foreground">Peak Emergency Hours</h3>
                            <span className="ml-auto text-[10px] font-mono text-muted-foreground">24H CYCLE</span>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourData} barSize={16}>
                                    <CartesianGrid strokeDasharray="2 4" stroke={CHART_THEME.grid} vertical={false} />
                                    <XAxis dataKey="hour" tick={{ fill: CHART_THEME.tick, fontSize: 9, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 9, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                                    <Tooltip {...CHART_THEME.tooltip} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}
                                        label={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* ── Map ── */}
                    <motion.div variants={stagger.item} className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center gap-2 p-5 border-b border-border">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <h3 className="font-bold text-foreground">Emergency Hotspot Map</h3>
                            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{incidents.length} PLOTTED</span>
                        </div>
                        <div className="h-[480px]">
                            <MapContainer center={[31.4504, 73.1350]} zoom={11} style={{ height: "100%", width: "100%" }}>
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {incidents.map((incident) => (
                                    <CircleMarker
                                        key={incident.id}
                                        center={[incident.latitude, incident.longitude]}
                                        radius={10}
                                        pathOptions={{
                                            color: incident.status === "critical" ? "#ef4444" : incident.status === "resolved" ? "#10b981" : "#f59e0b",
                                            fillColor: incident.status === "critical" ? "#ef4444" : incident.status === "resolved" ? "#10b981" : "#f59e0b",
                                            fillOpacity: 0.6,
                                            weight: 2,
                                        }}
                                    >
                                        <Popup>
                                            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11 }}>
                                                <p style={{ fontWeight: 700, marginBottom: 4 }}>{incident.type}</p>
                                                <p style={{ opacity: 0.7, marginBottom: 2 }}>{incident.message}</p>
                                                <p style={{ opacity: 0.5 }}>Status: {incident.status}</p>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </div>
                    </motion.div>

                    {/* ── Live Feed + Hotspots ── */}
                    <motion.div variants={stagger.item} className="grid gap-6 lg:grid-cols-2">

                        {/* Live Feed */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center gap-2 p-5 border-b border-border">
                                <Radio className="h-4 w-4 text-success" />
                                <h3 className="font-bold text-foreground">Live Incident Stream</h3>
                                <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-success">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> WS
                                </span>
                            </div>
                            <div className="p-3 space-y-1.5 max-h-[320px] overflow-y-auto">
                                {liveFeed.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-xs font-mono text-muted-foreground">AWAITING EVENTS...</p>
                                        <div className="flex justify-center gap-1 mt-2">
                                            {[0, 1, 2].map((i) => (
                                                <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    liveFeed.map((event, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-xs font-mono text-muted-foreground"
                                        >
                                            {event}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Hotspots */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center gap-2 p-5 border-b border-border">
                                <AlertTriangle className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-foreground">Detected Hotspots</h3>
                                <span className="ml-auto text-[10px] font-mono text-muted-foreground">{hotspotAreas.length} ZONES</span>
                            </div>
                            <div className="p-3 space-y-2">
                                {hotspotAreas.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-xs font-mono text-success">NO HOTSPOTS DETECTED</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Area density is normal</p>
                                    </div>
                                ) : (
                                    hotspotAreas.map(([location, count]) => (
                                        <div key={location} className="rounded-xl border border-primary/25 bg-primary/8 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                        HIGH DENSITY ZONE
                                                    </p>
                                                    <p className="text-xs font-mono text-muted-foreground mt-1">{location}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-2xl font-bold font-mono text-primary">{count}</p>
                                                    <p className="text-[9px] font-mono text-muted-foreground">incidents</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </motion.div>
                </motion.div>
            </main>
        </div>
    );
};

export default AnalyticsPage;