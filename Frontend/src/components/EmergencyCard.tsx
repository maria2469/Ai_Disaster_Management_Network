import { MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StatusIndicator, { type StatusType } from "./StatusIndicator";
import { cn } from "@/lib/utils";

interface EmergencyCardProps {
  type: string;
  distance: string;
  time: string;
  status: StatusType;
  description?: string;
  onClick?: () => void;
  className?: string;
}

const EmergencyCard = ({ type, distance, time, status, description, onClick, className }: EmergencyCardProps) => {
  return (
    <Card
      className={cn(
        "cursor-pointer border-l-4 transition-all hover:shadow-md",
        status === "critical" ? "border-l-primary" : status === "active" ? "border-l-warning" : "border-l-success",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between p-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{type}</h4>
            <StatusIndicator status={status} />
          </div>
          {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {distance}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {time}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyCard;
