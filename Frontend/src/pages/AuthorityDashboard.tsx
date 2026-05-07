import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import EmergencyCard from "@/components/EmergencyCard";
import VolunteerCard from "@/components/VolunteerCard";
import StatusIndicator from "@/components/StatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Shield, Users, CheckSquare, AlertOctagon } from "lucide-react";
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

const volunteers = [
  { name: "Dr. Sarah Chen", skill: "doctor" as const, distance: "200m", available: true },
  { name: "Mike Torres", skill: "firefighter" as const, distance: "350m", available: true },
  { name: "Lisa Park", skill: "nurse" as const, distance: "500m", available: true },
  { name: "James Wilson", skill: "first-aid" as const, distance: "750m", available: false },
];

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

const statusDot: Record<string, string> = {
  critical: "bg-primary",
  active: "bg-accent",
  resolved: "bg-success",
  pending: "bg-muted-foreground",
};

const AuthorityDashboard = () => {
  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/emergency/all`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const activeCount = incidents.filter((i) => i.status === "active" || i.status === "critical").length;
  const respondersCount = incidents.filter((i) => i.status === "active").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;
  const criticalCount = incidents.filter((i) => i.status === "critical").length;

  const mappedIncidents = incidents.map((i) => ({
    id: String(i.id),
    type: i.emergency_type || "Emergency",
    distance: "—",
    time: getTimeAgo(i.created_at),
    status: mapStatus(i.status),
    description: i.message,
    responders: 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top status bar */}
      <div className="border-b border-border bg-card/50 px-4 py-2">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono font-bold text-foreground uppercase tracking-widest">Authority Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "CRITICAL", val: criticalCount, color: "text-primary" },
              { label: "ACTIVE", val: activeCount, color: "text-accent" },
              { label: "RESOLVED", val: resolvedCount, color: "text-success" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs font-mono">
                <span className={`font-bold ${s.color}`}>{s.val}</span>
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex flex-col lg:flex-row h-[calc(100vh-7rem)]">

        {/* ── Sidebar ── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full lg:w-[380px] shrink-0 flex flex-col border-r border-border bg-card/30 overflow-hidden"
        >
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-primary" />
                Incident Feed
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-mono text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: AlertOctagon, label: "Active", val: activeCount, color: "text-primary", border: "border-primary/20", bg: "bg-primary/8" },
                { icon: Users, label: "Responding", val: respondersCount, color: "text-success", border: "border-success/20", bg: "bg-success/8" },
                { icon: CheckSquare, label: "Closed", val: resolvedCount, color: "text-muted-foreground", border: "border-border", bg: "bg-muted/30" },
              ].map((s) => (
                <div key={s.label} className={`rounded-lg border ${s.border} ${s.bg} p-2.5 text-center`}>
                  <p className={`text-xl font-bold font-mono ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-muted-foreground">
              {Object.entries(statusDot).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${v}`} />
                  {k.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Incident list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : mappedIncidents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center mt-4">
                <p className="text-sm font-mono text-muted-foreground">NO INCIDENTS</p>
              </div>
            ) : (
              mappedIncidents.map((incident, i) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-background/60 hover:border-primary/20 hover:bg-background/80 transition-all duration-200 p-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[incident.status]}`} />
                      <p className="text-sm font-semibold text-foreground capitalize">{incident.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider
                        ${incident.status === "critical" ? "status-critical" :
                          incident.status === "active" ? "status-active" :
                            incident.status === "resolved" ? "status-resolved" :
                              "status-pending"}`}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate pl-4">{incident.description}</p>
                  <div className="flex items-center justify-between mt-2 pl-4">
                    <span className="text-[10px] font-mono text-muted-foreground/60">ID #{incident.id}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{incident.time}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Responders section */}
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3.5 w-3.5 text-success" />
              <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                Active Responders
              </h3>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {volunteers.map((v) => (
                <div key={v.name} className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors
                  ${v.available ? "border-success/20 bg-success/5" : "border-border bg-muted/30 opacity-60"}`}>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{v.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{v.skill}</p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <p className="text-[10px] font-mono text-muted-foreground">{v.distance}</p>
                    <span className={`h-2 w-2 rounded-full ${v.available ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* ── Map ── */}
        <div className="flex-1 relative p-3">
          <div className="absolute inset-3 rounded-xl overflow-hidden border border-border">
            <MapView className="h-full w-full" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthorityDashboard;