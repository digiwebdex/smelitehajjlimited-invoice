import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: "revenue" | "due" | "invoices" | "default";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    revenue: "stat-revenue text-white",
    due: "stat-due text-white",
    invoices: "stat-invoices text-white",
    default: "bg-card text-card-foreground",
  };

  const iconStyles = {
    revenue: "bg-white/20 text-white",
    due: "bg-white/20 text-white",
    invoices: "bg-white/20 text-white",
    default: "bg-accent/10 text-accent",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-6 shadow-card transition-all duration-300 hover:shadow-card-hover",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-muted-foreground" : "text-white/80"
            )}
          >
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "text-sm",
                variant === "default" ? "text-muted-foreground" : "text-white/70"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            iconStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
