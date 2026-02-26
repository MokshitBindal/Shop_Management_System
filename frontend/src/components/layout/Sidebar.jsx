import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package2,
  Users2,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  ShieldCheck,
} from "lucide-react";
import { cn, getInitials, ROLE_CONFIG } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["boss"],
  },
  {
    to: "/orders",
    label: "Orders",
    icon: ClipboardList,
    roles: ["boss", "manager", "employee"],
  },
  { to: "/new-order", label: "New Order", icon: ShoppingCart, roles: ["boss"] },
  {
    to: "/inventory",
    label: "Inventory",
    icon: Package2,
    roles: ["boss", "manager"],
  },
  { to: "/customers", label: "Udhaar", icon: Users2, roles: ["boss"] },
  { to: "/ledger", label: "Ledger", icon: BookOpen, roles: ["boss"] },
  { to: "/eod", label: "EOD", icon: ShieldCheck, roles: ["boss"] },
  {
    to: "/attendance",
    label: "Attendance",
    icon: CalendarDays,
    roles: ["boss", "manager"],
  },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["boss"] },
];

export function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const visibleNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(user?.role),
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-white border-r border-slate-200",
        mobile ? "w-64" : "w-[240px]",
      )}
    >
      {/* Brand */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Vyapar-Sync</p>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Shop Manager
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="px-3 py-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50">
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">
            LAN Connected
          </span>
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 group">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-700">
              {getInitials(user?.name ?? "?")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {ROLE_CONFIG[user?.role]?.label}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
