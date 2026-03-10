import { cn } from "@/lib/utils";

type SkillType = "citizen" | "volunteer" | "first-aid" | "doctor" | "nurse" | "firefighter";

const skillConfig: Record<SkillType, { label: string; className: string }> = {
  citizen: { label: "Citizen", className: "bg-muted text-muted-foreground" },
  volunteer: { label: "Volunteer", className: "bg-secondary text-secondary-foreground" },
  "first-aid": { label: "First Aid", className: "bg-success/15 text-success" },
  doctor: { label: "Doctor", className: "bg-success text-success-foreground" },
  nurse: { label: "Nurse", className: "bg-accent/15 text-accent" },
  firefighter: { label: "Firefighter", className: "bg-primary/15 text-primary" },
};

interface SkillBadgeProps {
  skill: SkillType;
  className?: string;
}

const SkillBadge = ({ skill, className }: SkillBadgeProps) => {
  const config = skillConfig[skill];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.className, className)}>
      {config.label}
    </span>
  );
};

export default SkillBadge;
export type { SkillType };
