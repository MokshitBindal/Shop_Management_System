import { useState, useMemo } from "react";
import { AlertTriangle, TrendingDown, Package } from "lucide-react";
import { SearchInput } from "../components/ui/Input";
import { formatCurrency, cn } from "../lib/utils";
import {
  MOCK_ITEMS,
  MOCK_UNITS,
  MOCK_LOCATIONS,
  MOCK_VELOCITY,
} from "../lib/mockData";
import { useInventoryStore } from "../store/dataStore";

function getStockStatus(totalStock, itemId) {
  const vel = MOCK_VELOCITY.find((v) => v.itemId === itemId);
  if (!vel) return "normal";
  const daily = vel.sold7 / 7;
  if (daily === 0) return "normal";
  const daysLeft = totalStock / daily;
  if (daysLeft <= 1) return "critical";
  if (daysLeft <= 3) return "low";
  return "normal";
}

const STATUS_STYLE = {
  critical: { badge: "bg-red-100 text-red-700", row: "bg-red-50/30" },
  low: { badge: "bg-amber-100 text-amber-700", row: "bg-amber-50/20" },
  normal: { badge: "", row: "" },
};

export default function Inventory() {
  const { inventory, items } = useInventoryStore();
  const [search, setSearch] = useState("");
  const [view, setView] = useState("items"); // 'items' | 'locations'
  const [locationFilter, setLocationFilter] = useState("all");

  const activeItems = useMemo(
    () => items.filter((i) => i.status === "active"),
    [items],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeItems.filter((i) => !q || i.name.toLowerCase().includes(q));
  }, [activeItems, search]);

  const getStock = (itemId, locationId) =>
    inventory.find(
      (inv) => inv.itemId === itemId && inv.locationId === locationId,
    )?.qty ?? 0;

  const getTotalStock = (itemId) =>
    inventory
      .filter((inv) => inv.itemId === itemId)
      .reduce((s, inv) => s + inv.qty, 0);

  const criticalCount = activeItems.filter(
    (i) => getStockStatus(getTotalStock(i.id), i.id) === "critical",
  ).length;
  const lowCount = activeItems.filter(
    (i) => getStockStatus(getTotalStock(i.id), i.id) === "low",
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Current stock levels across all locations
        </p>
      </div>

      {/* Alert strip */}
      {(criticalCount > 0 || lowCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-medium text-red-700">
                {criticalCount} item{criticalCount > 1 ? "s" : ""} critically
                low
              </span>
            </div>
          )}
          {lowCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <TrendingDown className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-amber-700">
                {lowCount} item{lowCount > 1 ? "s" : ""} running low
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { key: "items", label: "By Item" },
            { key: "locations", label: "By Location" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
                view === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {view === "locations" && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Locations</option>
              {MOCK_LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit</th>
                {MOCK_LOCATIONS.map((loc) => (
                  <th key={loc.id}>{loc.name}</th>
                ))}
                <th>Total Stock</th>
                <th>Base Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const unit = MOCK_UNITS.find((u) => u.id === item.unitId);
                const total = getTotalStock(item.id);
                const statusKey = getStockStatus(total, item.id);
                const style = STATUS_STYLE[statusKey];
                const vel = MOCK_VELOCITY.find((v) => v.itemId === item.id);
                const daily = vel
                  ? Math.round((vel.sold7 / 7) * 10) / 10
                  : null;

                return (
                  <tr key={item.id} className={style.row}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-800">
                          {item.name}
                        </p>
                        {daily && (
                          <p className="text-[11px] text-slate-400">
                            {daily} {unit?.abbr}/day avg
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-500">{unit?.abbr}</span>
                    </td>
                    {MOCK_LOCATIONS.map((loc) => {
                      const q = getStock(item.id, loc.id);
                      return (
                        <td key={loc.id}>
                          <span
                            className={cn(
                              "tabular-nums font-medium",
                              q === 0 ? "text-slate-300" : "text-slate-700",
                            )}
                          >
                            {q > 0 ? q : "—"}
                          </span>
                        </td>
                      );
                    })}
                    <td>
                      <span
                        className={cn(
                          "font-bold tabular-nums text-slate-900",
                          total === 0 && "text-red-500",
                        )}
                      >
                        {total} {unit?.abbr}
                      </span>
                    </td>
                    <td>
                      <span className="tabular-nums text-slate-700">
                        {formatCurrency(item.defaultPrice)}
                      </span>
                    </td>
                    <td>
                      {statusKey !== "normal" && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            style.badge,
                          )}
                        >
                          {statusKey === "critical" ? "🔴 Critical" : "🟡 Low"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-14 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}
