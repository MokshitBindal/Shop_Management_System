import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatTimeAgo(date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatTime(date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "hh:mm a");
}

export const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  fulfilling: {
    label: "In Transit",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  partial: {
    label: "Partial",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  delayed: { label: "Delayed", color: "bg-red-50 text-red-700 border-red-200" },
  changes_made: {
    label: "Changes Made",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export const PAYMENT_CONFIG = {
  cash: { label: "Cash", color: "bg-green-50 text-green-700" },
  upi: { label: "UPI", color: "bg-blue-50 text-blue-700" },
  credit: { label: "Credit", color: "bg-red-50 text-red-700" },
  mixed: { label: "Mixed", color: "bg-purple-50 text-purple-700" },
};

export const ROLE_CONFIG = {
  boss: { label: "Boss", color: "bg-brand-50 text-brand-700" },
  manager: { label: "Manager", color: "bg-teal-50 text-teal-700" },
  employee: { label: "Employee", color: "bg-slate-100 text-slate-600" },
};

export function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
