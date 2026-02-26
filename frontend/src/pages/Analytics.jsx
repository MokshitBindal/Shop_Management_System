import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Users2,
  Package2,
  ChevronDown,
} from "lucide-react";
import { Card, CardHeader, CardContent, StatCard } from "../components/ui/Card";
import { formatCurrency } from "../lib/utils";
import { MOCK_ORDERS, MOCK_ITEMS, MOCK_CUSTOMERS } from "../lib/mockData";
import { useAuthStore } from "../store/authStore";
import { subDays, format } from "date-fns";

/* ── synthetic chart data ─────────────────────────────────── */
const today = new Date();
const DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = subDays(today, 29 - i);
  return {
    date: format(d, "MMM d"),
    revenue: Math.round(2000 + Math.random() * 8000),
    orders: Math.round(3 + Math.random() * 12),
  };
});

const TOP_ITEMS = MOCK_ITEMS.slice(0, 6)
  .map((item) => ({
    name: item.name,
    units: Math.round(20 + Math.random() * 200),
    revenue: Math.round(500 + Math.random() * 5000),
  }))
  .sort((a, b) => b.revenue - a.revenue);

const PAYMENT_PIE = [
  { name: "Cash", value: 45, color: "#22c55e" },
  { name: "UPI", value: 35, color: "#6366f1" },
  { name: "Credit", value: 15, color: "#f59e0b" },
  { name: "Mixed", value: 5, color: "#64748b" },
];

const PERIODS = ["7D", "30D", "90D"];

export default function Analytics() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState("30D");

  if (user.role !== "boss") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <TrendingUp className="w-10 h-10" />
        <p className="text-sm font-medium">Access restricted to Boss only</p>
      </div>
    );
  }

  const filtered =
    period === "7D" ? DAILY.slice(-7) : period === "90D" ? DAILY : DAILY;
  const totalRevenue = filtered.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = filtered.reduce((s, d) => s + d.orders, 0);
  const totalUdhaar = MOCK_CUSTOMERS.reduce((s, c) => s + (c.balance || 0), 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.name === "Revenue" ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Business performance overview
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          color="brand"
          trend={{ value: "+12%", positive: true }}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          color="blue"
          trend={{ value: "+5%", positive: true }}
        />
        <StatCard
          title="Active Customers"
          value={MOCK_CUSTOMERS.length}
          icon={Users2}
          color="emerald"
        />
        <StatCard
          title="Udhaar Outstanding"
          value={formatCurrency(totalUdhaar)}
          icon={Users2}
          color="amber"
          trend={{ value: "-3%", positive: true }}
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Revenue Trend</h2>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={filtered}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#grad-rev)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top items by revenue */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              Top Items by Revenue
            </h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={TOP_ITEMS}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment method pie */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Payment Methods</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={PAYMENT_PIE}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {PAYMENT_PIE.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(v) => (
                    <span className="text-sm text-slate-600">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
