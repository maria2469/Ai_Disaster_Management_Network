import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import EmergencyCard from "@/components/EmergencyCard";
import VolunteerCard from "@/components/VolunteerCard";
import StatusIndicator from "@/components/StatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

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
      <main className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-96 overflow-y-auto border-r border-border bg-card p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Incidents</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Emergency</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Responder</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 bg-primary/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{activeCount}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-success/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">{respondersCount}</p>
                <p className="text-[10px] text-muted-foreground">Responders</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
                <p className="text-[10px] text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {mappedIncidents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No incidents reported.</p>
              )}
              {mappedIncidents.map((incident) => (
                <div key={incident.id} className="space-y-1">
                  <EmergencyCard {...incident} />
                  <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                    <span>{incident.responders} responders</span>
                    <StatusIndicator status={incident.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Active Responders</h3>
            <div className="space-y-2">
              {volunteers.map((v) => (
                <VolunteerCard key={v.name} {...v} />
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex-1 p-4">
          <MapView className="h-full min-h-[300px]" />
        </div>
      </main>
    </div>
  );
};

export default AuthorityDashboard;
