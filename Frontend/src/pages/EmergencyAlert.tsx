import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Bell } from "lucide-react";
import { motion } from "framer-motion";

const EmergencyAlert = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Emergency Alerts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time emergency notifications
            </p>
          </div>

          {/* Card */}
          <Card className="border border-border shadow-lg rounded-2xl">
            <CardContent className="p-6 text-center space-y-4">

              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Bell className="h-8 w-8 text-primary" />
              </div>

              {/* Title */}
              <div>
                <p className="text-base font-semibold text-foreground">
                  WhatsApp Alert View
                </p>

                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  This page is opened from a WhatsApp emergency link when an incident
                  is reported near your location.
                  <br /><br />
                  You can view details and respond instantly using the incident ID
                  shared with you.
                </p>
              </div>

              {/* Info box */}
              <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
                💡 Tip: Keep notifications enabled to receive instant emergency alerts.
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default EmergencyAlert;