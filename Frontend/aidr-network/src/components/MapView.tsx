import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface Marker {
  id: string;
  x: number;
  y: number;
  type: "emergency" | "responder" | "user";
  label?: string;
}

interface MapViewProps {
  markers?: Marker[];
  className?: string;
  showUserLocation?: boolean;
}

const MapView = ({ markers = [], className, showUserLocation = true }: MapViewProps) => {
  const defaultMarkers: Marker[] = showUserLocation
    ? [{ id: "user", x: 50, y: 50, type: "user", label: "You" }, ...markers]
    : markers;

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-muted", className)}>
      {/* Simulated map background */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Simulated roads */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.3" />
          <line x1="20%" y1="0" x2="80%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.2" />
          <line x1="0" y1="30%" x2="100%" y2="70%" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.2" />
        </svg>
      </div>

      {/* Markers */}
      {defaultMarkers.map((marker) => (
        <div
          key={marker.id}
          className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        >
          {marker.label && (
            <span className="mb-1 rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm border border-border">
              {marker.label}
            </span>
          )}
          <MapPin
            className={cn(
              "h-6 w-6 drop-shadow-md",
              marker.type === "emergency" && "text-primary",
              marker.type === "responder" && "text-success",
              marker.type === "user" && "text-secondary"
            )}
            fill="currentColor"
          />
          {marker.type === "emergency" && (
            <span className="absolute bottom-0 h-3 w-3 rounded-full bg-primary/30 animate-ping" />
          )}
        </div>
      ))}

      {/* Map label */}
      <div className="absolute bottom-2 right-2 rounded bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
        Simulated Map View
      </div>
    </div>
  );
};

export default MapView;
