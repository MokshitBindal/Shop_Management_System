import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Clock, Package2, CheckCircle2, Trash2 } from "lucide-react";
import { formatDateTime, cn } from "../lib/utils";
import { MOCK_NOTIFICATIONS } from "../lib/mockData";
import { differenceInDays, differenceInHours } from "date-fns";

function ttlDisplay(expiresAt) {
  const now = new Date();
  const exp = new Date(expiresAt);
  const daysLeft = differenceInDays(exp, now);
  const hoursLeft = differenceInHours(exp, now);
  if (hoursLeft <= 0)
    return { label: "Expired", expired: true, color: "text-slate-400" };
  if (daysLeft === 0)
    return {
      label: `Expires in ${hoursLeft}h`,
      expired: false,
      color: "text-amber-600",
    };
  if (daysLeft <= 2)
    return {
      label: `${daysLeft}d left`,
      expired: false,
      color: "text-amber-500",
    };
  return {
    label: `${daysLeft}d left`,
    expired: false,
    color: "text-emerald-600",
  };
}

const TYPE_CONFIG = {
  new_order: {
    label: "New Order",
    color: "bg-brand-50 text-brand-700",
    icon: Package2,
  },
  order_update: {
    label: "Order Updated",
    color: "bg-amber-50 text-amber-700",
    icon: CheckCircle2,
  },
  stock_alert: {
    label: "Low Stock",
    color: "bg-red-50 text-red-600",
    icon: Package2,
  },
  restock: {
    label: "Restocked",
    color: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [showExpired, setShowExpired] = useState(false);

  const dismiss = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => setNotifications([]);

  const visible = notifications.filter((n) => {
    const { expired } = ttlDisplay(n.expiresAt);
    return showExpired ? true : !expired;
  });

  const expiredCount = notifications.filter(
    (n) => ttlDisplay(n.expiresAt).expired,
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {visible.length} notification{visible.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {expiredCount > 0 && (
            <button
              onClick={() => setShowExpired((s) => !s)}
              className="text-xs text-slate-500 underline"
            >
              {showExpired ? "Hide" : `Show ${expiredCount} expired`}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-500 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <Bell className="w-10 h-10" />
          <p className="text-sm font-medium">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((notif) => {
            const ttl = ttlDisplay(notif.expiresAt);
            const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.new_order;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() =>
                  notif.orderId && navigate(`/orders/${notif.orderId}`)
                }
                className={cn(
                  "bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4 transition-all duration-150",
                  notif.orderId
                    ? "cursor-pointer hover:border-brand-300 hover:shadow-md"
                    : "",
                  ttl.expired ? "opacity-50" : "",
                  !notif.read ? "border-l-4 border-l-brand-500" : "",
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    cfg.color,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {notif.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                    <button
                      onClick={(e) => dismiss(notif.id, e)}
                      className="text-slate-300 hover:text-slate-500 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Item locations */}
                  {notif.items && notif.items.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {notif.items.map((item, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {item.name} · {item.location}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">
                      {formatDateTime(notif.createdAt)}
                    </span>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        ttl.color,
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {ttl.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
