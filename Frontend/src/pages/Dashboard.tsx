import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import EmergencyCard from "@/components/EmergencyCard";
import { AlertTriangle, Radio, MapPin } from "lucide-react";
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

  // WebSocket for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("ws://localhost:8001/ws");
      ws.onmessage = () => {
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
      };
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
      <main className="container px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Report Emergency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Report an emergency to alert nearby responders
                </p>
                <Link to="/report">
                  <Button variant="emergency" size="xl" className="w-full">
                    🚨 REPORT EMERGENCY
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radio className="h-5 w-5 text-success" />
                  Volunteer Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Toggle your availability for emergency alerts
                </p>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className={`text-sm font-semibold ${volunteerMode ? "text-success" : "text-muted-foreground"}`}>
                    {volunteerMode ? "Available" : "Unavailable"}
                  </span>
                  <Switch checked={volunteerMode} onCheckedChange={setVolunteerMode} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-secondary" />
                  Nearby Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{activeCount}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{respondersCount}</p>
                    <p className="text-xs text-muted-foreground">Responders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
                    <p className="text-xs text-muted-foreground">Resolved Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Incidents</h2>
            <div className="space-y-3">
              {recentIncidents.length === 0 && (
                <p className="text-sm text-muted-foreground">No incidents reported yet.</p>
              )}
              {recentIncidents.map((incident) => (
                <Link to={`/emergency/${incident.id}`} key={incident.id}>
                  <EmergencyCard {...incident} />
                </Link>
              ))}
            </div>
          </div>
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
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default Dashboard;
