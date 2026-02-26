import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Truck, ArrowRight, Search } from "lucide-react";
import { StatusBadge, PaymentBadge } from "../components/ui/Badge";
import { SearchInput } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { formatCurrency, formatTimeAgo } from "../lib/utils";
import { useOrdersStore } from "../store/dataStore";
import { useAuthStore } from "../store/authStore";
import { MOCK_USERS } from "../lib/mockData";
import { cn } from "../lib/utils";

const TABS = [
  { key: "all", label: "All", roles: ["boss"] },
  { key: "pending", label: "Pending", roles: ["boss", "manager", "employee"] },
  { key: "fulfilling", label: "In Transit", roles: ["boss", "manager"] },
  { key: "completed", label: "Completed", roles: ["boss", "manager"] },
  { key: "partial", label: "Partial", roles: ["boss", "manager"] },
];

function EmptyState({ tab }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
      <ShoppingBag className="w-10 h-10 opacity-30" />
      <div className="text-center">
        <p className="font-medium text-slate-500">No {tab} orders</p>
        <p className="text-sm mt-0.5">Orders will appear here once created</p>
      </div>
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders } = useOrdersStore();
  const [tab, setTab] = useState(user.role === "boss" ? "all" : "pending");
  const [search, setSearch] = useState("");

  const visibleTabs = TABS.filter((t) => t.roles.includes(user.role));

  // Role-based visibility: manager/employee only see active orders (not completed history)
  const roleFiltered =
    user.role === "boss"
      ? orders
      : orders.filter((o) =>
          [
            "pending",
            "fulfilling",
            "partial",
            "delayed",
            "changes_made",
          ].includes(o.status),
        );

  const filtered = roleFiltered.filter((o) => {
    const matchTab = tab === "all" || o.status === tab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user.role === "boss"
              ? "Full order history"
              : "Active orders requiring attention"}
          </p>
        </div>
        {user.role === "boss" && (
          <Button icon={ShoppingBag} onClick={() => navigate("/new-order")}>
            New Order
          </Button>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all duration-150",
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "ml-1.5 text-xs px-1.5 py-0.5 rounded-full tabular-nums",
                  tab === t.key
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-200 text-slate-500",
                )}
              >
                {
                  roleFiltered.filter(
                    (o) => t.key === "all" || o.status === t.key,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order or customer…"
          className="w-full sm:w-64"
        />
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => {
                  const creator = MOCK_USERS.find(
                    (u) => u.id === order.createdBy,
                  );
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          {order.isDeliveryOrder && (
                            <Truck
                              className="w-3.5 h-3.5 text-sky-500 shrink-0"
                              title="Delivery Order"
                            />
                          )}
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {order.id}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-800">
                            {order.customerName || "—"}
                          </p>
                          {order.customerPhone && (
                            <p className="text-xs text-slate-400">
                              {order.customerPhone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-slate-500 text-xs">
                          {order.items.length} items
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(order.finalAmount)}
                          </p>
                          {order.discount > 0 && (
                            <p className="text-xs text-emerald-600">
                              −{formatCurrency(order.discount)} disc.
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        {order.paymentMethod ? (
                          <PaymentBadge method={order.paymentMethod} />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <div>
                          <p className="text-xs text-slate-500">
                            {formatTimeAgo(order.createdAt)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {creator?.name}
                          </p>
                        </div>
                      </td>
                      <td>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
