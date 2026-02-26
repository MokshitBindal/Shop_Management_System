import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-slate-100 flex items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn("text-sm font-semibold text-slate-800", className)}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

// Alias so pages can use either name
export const CardContent = CardBody;

export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  title,
  value,
  sub,
  icon: Icon,
  color = "brand",
  trend,
}) {
  // Accept both `label` and `title` prop names
  const heading = label ?? title;
  const colorMap = {
    brand: { bg: "bg-brand-50", icon: "text-brand-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600" },
    red: { bg: "bg-red-50", icon: "text-red-600" },
    sky: { bg: "bg-sky-50", icon: "text-sky-600" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  };
  const c = colorMap[color] ?? colorMap.brand;

  // trend can be a number OR { value: '+12%', positive: true }
  let trendLabel = null;
  let trendPositive = true;
  if (trend !== undefined && trend !== null) {
    if (typeof trend === "number") {
      trendLabel = `${Math.abs(trend)}% vs yesterday`;
      trendPositive = trend >= 0;
    } else if (typeof trend === "object") {
      trendLabel = trend.value;
      trendPositive = trend.positive !== false;
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {heading}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              c.bg,
            )}
          >
            <Icon className={cn("w-5 h-5", c.icon)} />
          </div>
        )}
      </div>
      {trendLabel && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span
            className={cn(
              "text-xs font-medium",
              trendPositive ? "text-emerald-600" : "text-red-500",
            )}
          >
            {trendPositive ? "↑" : "↓"} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
