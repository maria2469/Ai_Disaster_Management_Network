import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import StatusIndicator from "@/components/StatusIndicator";
import { AlertTriangle, MapPin, Clock, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const EmergencyAlert = () => {
  const [accepted, setAccepted] = useState(false);

  const markers = [
    { id: "victim", x: 55, y: 40, type: "emergency" as const, label: "Victim" },
    { id: "user", x: 45, y: 60, type: "responder" as const, label: "You" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Alert banner */}
      <div className="gradient-emergency px-4 py-3 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-primary-foreground"
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="font-bold text-lg">🚨 EMERGENCY NEAR YOU</span>
        </motion.div>
      </div>

      <main className="container max-w-lg px-4 py-6 space-y-6">
        {!accepted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Emergency details */}
            <Card className="border-l-4 border-l-primary shadow-lg border-0">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                      <Flame className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Fire Emergency</h3>
                      <StatusIndicator status="critical" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-lg font-bold text-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> 120m
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Reported</p>
                    <p className="text-lg font-bold text-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" /> 2 min ago
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <p className="text-sm font-medium text-foreground">Person trapped on 3rd floor</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Apartment fire, smoke visible, person calling for help from window
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <MapView markers={markers} className="h-48" showUserLocation={false} />

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="emergency"
                size="xl"
                className="w-full"
                onClick={() => setAccepted(true)}
              >
                Accept Rescue Task
              </Button>
              <Button variant="outline" size="lg" className="w-full">
                Dismiss
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
            <MapView markers={markers} className="h-48 w-full" showUserLocation={false} />
            <Button variant="outline" size="lg" onClick={() => setAccepted(false)}>
              Cancel Response
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default EmergencyAlert;
