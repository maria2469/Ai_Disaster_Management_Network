import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SkillBadge, { type SkillType } from "./SkillBadge";
import { MapPin } from "lucide-react";

interface VolunteerCardProps {
  name: string;
  skill: SkillType;
  distance: string;
  available: boolean;
}

const VolunteerCard = ({ name, skill, distance, available }: VolunteerCardProps) => {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${available ? "bg-success" : "bg-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <SkillBadge skill={skill} />
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {distance}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VolunteerCard;
