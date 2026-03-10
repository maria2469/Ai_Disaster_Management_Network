import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import EmergencyCard from "@/components/EmergencyCard";
import { AlertTriangle, Radio, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

// Backend response type
interface BackendIncident {
  id: number;
  created_at: string;
  message: string;
  latitude: number;
  longitude: number;
  type: string;
  status: "critical" | "active" | "pending" | "resolved";
}

// UI-friendly type
interface Incident {
  id: number;
  type: string;
  distance: string;      // For display (optional)
  time: string;          // Formatted from created_at
  status: "critical" | "active" | "pending" | "resolved";
  description: string;   // From message
}

// Fetch incidents from backend
const fetchIncidents = async (): Promise<Incident[]> => {
  const res = await fetch("http://localhost:8001/emergency/all");
  if (!res.ok) throw new Error("Failed to fetch incidents");
  const data: BackendIncident[] = await res.json();

  // Map backend data to UI-friendly structure
  return data.map((i) => ({
    id: i.id,
    type: i.type,
    status: i.status,
    distance: "N/A", // calculate based on user location if available
    time: new Date(i.created_at).toLocaleString(),
    description: i.message,
  }));
};

const Dashboard = () => {
  const [volunteerMode, setVolunteerMode] = useState(true);

  const { data: incidents = [], isLoading, isError } = useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 30000, // refresh every 30s
  });

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
          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, John</p>
          </div>

          {/* Action cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Report Emergency */}
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

            {/* Volunteer Mode */}
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
                  <span
                    className={`text-sm font-semibold ${volunteerMode ? "text-success" : "text-muted-foreground"
                      }`}
                  >
                    {volunteerMode ? "Available" : "Unavailable"}
                  </span>
                  <Switch checked={volunteerMode} onCheckedChange={setVolunteerMode} />
                </div>
              </CardContent>
            </Card>

            {/* Nearby Stats */}
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
                    <p className="text-2xl font-bold text-primary">{incidents.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">12</p>
                    <p className="text-xs text-muted-foreground">Responders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">7</p>
                    <p className="text-xs text-muted-foreground">Resolved Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incident list */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Incidents</h2>
            <div className="space-y-3">
              {isLoading && <p>Loading incidents...</p>}
              {isError && <p className="text-red-600">Failed to load incidents.</p>}
              {!isLoading &&
                !isError &&
                incidents.map((incident) => (
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

export default Dashboard;