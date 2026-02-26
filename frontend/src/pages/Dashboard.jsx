import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Package,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "../components/ui/Card";
import { StatusBadge, PaymentBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatCurrency, formatTimeAgo, formatDate } from "../lib/utils";
import {
  MOCK_REVENUE_CHART,
  MOCK_ITEMS,
  MOCK_INVENTORY,
  MOCK_VELOCITY,
  MOCK_UNITS,
} from "../lib/mockData";
import { useOrdersStore } from "../store/dataStore";

function useRestockAlerts() {
  return MOCK_ITEMS.filter((item) => item.status === "active")
    .map((item) => {
      const vel = MOCK_VELOCITY.find((v) => v.itemId === item.id);
      if (!vel) return null;
      const totalStock = MOCK_INVENTORY.filter(
        (inv) => inv.itemId === item.id,
      ).reduce((s, inv) => s + inv.qty, 0);
      const dailyVel = vel.sold7 / 7;
      const threshold = dailyVel * 3;
      const unit = MOCK_UNITS.find((u) => u.id === item.unitId);
      if (totalStock < threshold) {
        return {
          item,
          totalStock,
          dailyVel: Math.round(dailyVel * 10) / 10,
          threshold: Math.round(threshold),
          daysLeft: totalStock > 0 ? Math.round(totalStock / dailyVel) : 0,
          unit,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-brand-600 font-bold">
        {formatCurrency(payload[0]?.value)}
      </p>
      <p className="text-slate-400 text-xs">{payload[1]?.value} orders</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { orders } = useOrdersStore();
  const restockAlerts = useRestockAlerts();

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth();
  });
  const todayRevenue = todayOrders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + o.finalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const creditOutstanding = 1900 + 2200; // from mock customers

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatDate(new Date())} · Good morning!
          </p>
        </div>
        <Button icon={ShoppingBag} onClick={() => navigate("/new-order")}>
          New Order
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          sub={`${todayOrders.filter((o) => o.status === "completed").length} orders completed`}
          icon={IndianRupee}
          color="brand"
          trend={12}
        />
        <StatCard
          label="Pending Orders"
          value={pendingOrders}
          sub="Awaiting fulfillment"
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Udhaar Outstanding"
          value={formatCurrency(creditOutstanding)}
          sub="2 customers"
          icon={TrendingUp}
          color="red"
        />
        <StatCard
          label="Restock Alerts"
          value={restockAlerts.length}
          sub="Items running low"
          icon={AlertTriangle}
          color="emerald"
        />
      </div>

      {/* Charts + Restock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Revenue — Last 7 Days
            </h2>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
              Daily
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={MOCK_REVENUE_CHART}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#4f46e5" }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#e2e8f0"
                strokeWidth={0}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Restock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Restock Alerts
            </h2>
            <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full text-[11px] font-bold flex items-center justify-center">
              {restockAlerts.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {restockAlerts.map(
              ({ item, totalStock, daysLeft, dailyVel, unit }) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {dailyVel} {unit?.abbr}/day · {totalStock} {unit?.abbr}{" "}
                      left
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      daysLeft <= 1
                        ? "bg-red-100 text-red-700"
                        : daysLeft <= 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {daysLeft}d left
                  </span>
                </div>
              ),
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <button
              onClick={() => navigate("/inventory")}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all inventory <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent Orders
          </h2>
          <Button
            variant="ghost"
            size="xs"
            iconRight={ArrowRight}
            onClick={() => navigate("/orders")}
          >
            View all
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td>
                    <div className="flex items-center gap-1.5">
                      {order.isDeliveryOrder && (
                        <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      )}
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {order.id}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-slate-800">
                      {order.customerName || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(order.finalAmount)}
                    </span>
                  </td>
                  <td>
                    {order.paymentMethod ? (
                      <PaymentBadge method={order.paymentMethod} />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>
                    <span className="text-slate-400 text-xs">
                      {formatTimeAgo(order.createdAt)}
                    </span>
                  </td>
                  <td>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
