import { cn } from "@/lib/utils";

interface CompanyRevenueItemProps {
  name: string;
  revenue: number;
  percentage: number;
  onClick?: () => void;
}

export function CompanyRevenueItem({
  name,
  revenue,
  percentage,
  onClick,
}: CompanyRevenueItemProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-lg",
        "bg-muted/50 hover:bg-muted transition-colors duration-200",
        "group cursor-pointer"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <span className="text-sm font-bold text-accent">
            {name.charAt(0)}
          </span>
        </div>
        <div className="text-left">
          <p className="font-medium text-foreground group-hover:text-accent transition-colors">
            {name}
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage.toFixed(1)}% of total revenue
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-foreground">
          {formatCurrency(revenue)}
        </p>
        <p className="text-xs text-muted-foreground">Revenue</p>
      </div>
    </button>
  );
}
