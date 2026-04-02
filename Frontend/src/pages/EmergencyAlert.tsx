import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";

const EmergencyAlert = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-lg px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Emergency Alerts</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time emergency notifications</p>
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto">
                <Info className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">WhatsApp Alert View</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This view is triggered via WhatsApp alert link when an emergency is reported near you.
                  You will receive a link with the incident ID to respond directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default EmergencyAlert;
