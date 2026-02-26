import { useState } from "react";
import { Menu, Bell, X } from "lucide-react";
import { cn, getInitials, ROLE_CONFIG } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { useOrdersStore } from "../../store/dataStore";
import { Sidebar } from "./Sidebar";

export function TopBar({ onMenuClick }) {
  const { user } = useAuthStore();
  const { orders } = useOrdersStore();
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="hidden lg:block" /> {/* spacer */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">
              {getInitials(user?.name ?? "?")}
            </span>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-800 leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {ROLE_CONFIG[user?.role]?.label}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileDrawer({ open, onClose }) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-200",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar mobile onClose={onClose} />
      </div>
    </>
  );
}
