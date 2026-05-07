import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import EmergencyCard from "@/components/EmergencyCard";
import { AlertTriangle, Radio, MapPin, Activity, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

const Dashboard = () => {
  const [volunteerMode, setVolunteerMode] = useState(true);
  const queryClient = useQueryClient();

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/emergency/all`);
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("ws://localhost:8001/ws");
      ws.onmessage = () => queryClient.invalidateQueries({ queryKey: ["incidents"] });
      ws.onerror = (e) => console.warn("WebSocket error:", e);
    } catch (e) {
      console.warn("WebSocket connection failed:", e);
    }
    return () => ws?.close();
  }, [queryClient]);

  const activeCount = incidents.filter((i) => i.status === "active" || i.status === "critical").length;
  const respondersCount = incidents.filter((i) => i.status === "active").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  const recentIncidents = incidents.slice(0, 5).map((i) => ({
    id: String(i.id),
    type: i.emergency_type || "Emergency",
    distance: "—",
    time: getTimeAgo(i.created_at),
    status: mapStatus(i.status),
    description: i.message,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="w-full min-h-screen px-6 py-10">
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-8">

          {/* ── Header ── */}
          <motion.div variants={stagger.item} className="flex items-end justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground tracking-[0.2em] uppercase mb-1">
                AI Disaster Network
              </p>
              <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                Command Center
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              SYSTEM LIVE
            </div>
          </motion.div>

          {/* ── Stat Strip ── */}
          <motion.div variants={stagger.item}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Active", value: activeCount, color: "text-primary", bg: "bg-primary/8", border: "border-primary/20" },
                { label: "Responding", value: respondersCount, color: "text-success", bg: "bg-success/8", border: "border-success/20" },
                { label: "Resolved", value: resolvedCount, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
              ].map((s) => (
                <div key={s.label} className={`rounded-lg border ${s.border} ${s.bg} p-4 text-center`}>
                  <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Action Cards ── */}
          <motion.div variants={stagger.item} className="grid gap-4 sm:grid-cols-2">

            {/* Report Emergency */}
            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-card p-6 card-hover group">
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-3xl" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Report Emergency</p>
                    <p className="text-xs text-muted-foreground">Alert nearby responders</p>
                  </div>
                </div>
                <Link to="/report">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide emergency-pulse border-0 h-12"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    SEND EMERGENCY ALERT
                  </Button>
                </Link>
              </div>
            </div>

            {/* Volunteer Mode */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 card-hover">
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl transition-colors duration-300 ${volunteerMode ? "bg-success/10" : "bg-muted/30"}`} />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-300 ${volunteerMode ? "bg-success/15 border-success/30" : "bg-muted border-border"}`}>
                    <Radio className={`h-5 w-5 transition-colors duration-300 ${volunteerMode ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Volunteer Mode</p>
                    <p className="text-xs text-muted-foreground">Toggle availability</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${volunteerMode ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                    <span className={`text-sm font-mono font-bold transition-colors duration-300 ${volunteerMode ? "text-success" : "text-muted-foreground"}`}>
                      {volunteerMode ? "AVAILABLE" : "OFF-DUTY"}
                    </span>
                  </div>
                  <Switch checked={volunteerMode} onCheckedChange={setVolunteerMode} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Nearby Incidents Summary */}
          <motion.div variants={stagger.item}>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 border border-accent/30">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Area Status</p>
                  <p className="text-xs font-mono text-muted-foreground">Rawalpindi / Islamabad Region</p>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border">
                {[
                  { label: "Active Incidents", val: activeCount, color: "text-primary" },
                  { label: "Responders On-Site", val: respondersCount, color: "text-success" },
                  { label: "Resolved Today", val: resolvedCount, color: "text-muted-foreground" },
                ].map((s) => (
                  <div key={s.label} className="px-4 first:pl-0 last:pr-0 text-center">
                    <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Recent Incidents ── */}
          <motion.div variants={stagger.item} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-bold text-foreground">Recent Incidents</h2>
              </div>
              <Link to="/authority" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-mono">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {recentIncidents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground font-mono">NO ACTIVE INCIDENTS</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Area is clear</p>
                </div>
              ) : (
                recentIncidents.map((incident, i) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link to={`/emergency/${incident.id}`}>
                      <div className="group relative rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold
                              ${incident.status === "critical" ? "bg-primary/15 text-primary border border-primary/30" :
                                incident.status === "active" ? "bg-accent/15 text-accent border border-accent/30" :
                                  "bg-success/15 text-success border border-success/30"}`}>
                              #{incident.id}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground capitalize text-sm">{incident.type}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{incident.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide
                              ${incident.status === "critical" ? "status-critical" :
                                incident.status === "active" ? "status-active" :
                                  incident.status === "resolved" ? "status-resolved" :
                                    "status-pending"}`}>
                              {incident.status}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">{incident.time}</span>
                          </div>
                        </div>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-200" />
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
};

function mapStatus(status: string): "critical" | "active" | "pending" | "resolved" {
  if (status === "critical") return "critical";
  if (status === "active") return "active";
  if (status === "resolved") return "resolved";
  return "pending";
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default Dashboard;