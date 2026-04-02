import { cn } from "@/lib/utils";

type StatusType = "active" | "resolved" | "pending" | "critical";

const statusConfig: Record<StatusType, { label: string; dotClass: string; textClass: string }> = {
  active: { label: "Active", dotClass: "bg-primary", textClass: "text-primary" },
  resolved: { label: "Resolved", dotClass: "bg-success", textClass: "text-success" },
  pending: { label: "Pending", dotClass: "bg-warning", textClass: "text-warning" },
  critical: { label: "Critical", dotClass: "bg-primary animate-pulse", textClass: "text-primary font-bold" },
};

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
}

const StatusIndicator = ({ status, className }: StatusIndicatorProps) => {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", config.textClass, className)}>
      <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
};

export default StatusIndicator;
export type { StatusType };
