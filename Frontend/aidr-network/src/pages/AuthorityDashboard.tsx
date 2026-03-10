import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import EmergencyCard from "@/components/EmergencyCard";
import VolunteerCard from "@/components/VolunteerCard";
import StatusIndicator from "@/components/StatusIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const incidents = [
  { id: "1", type: "Building Fire", distance: "120m", time: "2 min ago", status: "critical" as const, description: "Person trapped, 3rd floor", responders: 4 },
  { id: "2", type: "Medical Emergency", distance: "450m", time: "8 min ago", status: "active" as const, description: "Person collapsed", responders: 2 },
  { id: "3", type: "Flood Warning", distance: "1.2km", time: "15 min ago", status: "pending" as const, description: "Water rising near park", responders: 0 },
  { id: "4", type: "Car Accident", distance: "800m", time: "22 min ago", status: "resolved" as const, description: "Two vehicles, minor injuries", responders: 3 },
];

const volunteers = [
  { name: "Dr. Sarah Chen", skill: "doctor" as const, distance: "200m", available: true },
  { name: "Mike Torres", skill: "firefighter" as const, distance: "350m", available: true },
  { name: "Lisa Park", skill: "nurse" as const, distance: "500m", available: true },
  { name: "James Wilson", skill: "first-aid" as const, distance: "750m", available: false },
];

const mapMarkers = [
  { id: "e1", x: 55, y: 35, type: "emergency" as const, label: "Fire" },
  { id: "e2", x: 30, y: 55, type: "emergency" as const, label: "Medical" },
  { id: "e3", x: 75, y: 70, type: "emergency" as const, label: "Flood" },
  { id: "r1", x: 48, y: 45, type: "responder" as const },
  { id: "r2", x: 35, y: 40, type: "responder" as const },
  { id: "r3", x: 60, y: 55, type: "responder" as const },
  { id: "r4", x: 42, y: 65, type: "responder" as const },
];

const AuthorityDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Sidebar */}
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 bg-primary/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">3</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-success/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">9</p>
                <p className="text-[10px] text-muted-foreground">Responders</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-foreground">1</p>
                <p className="text-[10px] text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
          </div>

          {/* Incident list */}
          <div className="space-y-2">
            {incidents.map((incident) => (
              <div key={incident.id} className="space-y-1">
                <EmergencyCard {...incident} />
                <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                  <span>{incident.responders} responders</span>
                  <StatusIndicator status={incident.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Volunteers */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Active Responders</h3>
            <div className="space-y-2">
              {volunteers.map((v) => (
                <VolunteerCard key={v.name} {...v} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Map area */}
        <div className="flex-1 p-4">
          <MapView markers={mapMarkers} className="h-full min-h-[300px]" showUserLocation={false} />
        </div>
      </main>
    </div>
  );
};

export default AuthorityDashboard;
