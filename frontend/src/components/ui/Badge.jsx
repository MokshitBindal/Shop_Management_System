import {
  cn,
  STATUS_CONFIG,
  PAYMENT_CONFIG,
  ROLE_CONFIG,
} from "../../lib/utils";

export function Badge({ variant = "default", className, children }) {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border";
  const variants = {
    default: "bg-slate-100 text-slate-600 border-slate-200",
    primary: "bg-brand-50 text-brand-700 border-brand-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span className={cn(base, variants[variant] ?? variant, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        cfg.color,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}

export function PaymentBadge({ method }) {
  const cfg = PAYMENT_CONFIG[method];
  if (!cfg) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        cfg.color,
      )}
    >
      {cfg.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        cfg.color,
      )}
    >
      {cfg.label}
    </span>
  );
}
