import { cn } from "@/lib/utils";

interface MapViewProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

const MapView = ({ latitude, longitude, className }: MapViewProps) => {
  const hasLocation = latitude != null && longitude != null;

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-muted", className)}>
      {hasLocation ? (
        <iframe
          title="User Location"
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: "inherit" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.005}%2C${longitude + 0.005}%2C${latitude + 0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Detecting location...
        </div>
      )}
    </div>
  );
};

export default MapView;
