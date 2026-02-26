import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Package,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { ConfirmModal } from "../components/ui/Modal";
import { formatCurrency, cn } from "../lib/utils";
import { MOCK_ITEMS, MOCK_UNITS, MOCK_LOCATIONS } from "../lib/mockData";
import { useOrdersStore, useLedgerStore } from "../store/dataStore";
import toast from "react-hot-toast";

function buildStagingLedger(orders) {
  const map = {};
  orders
    .filter((o) => o.status === "completed")
    .forEach((order) => {
      order.items.forEach((oi) => {
        const key = `${oi.itemId}-1`; // default to Main Shop (loc 1) for demo
        if (!map[key])
          map[key] = {
            itemId: oi.itemId,
            locationId: 1,
            totalQty: 0,
            orders: [],
          };
        map[key].totalQty += oi.qty;
        map[key].orders.push(order.id);
      });
    });
  return Object.values(map);
}

export default function EOD() {
  const { orders } = useOrdersStore();
  const { ledger, commitEOD } = useLedgerStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [committing, setCommitting] = useState(false);

  const todayLedger = ledger.find((l) => {
    const ld = new Date(l.date);
    const now = new Date();
    return ld.getDate() === now.getDate() && ld.getMonth() === now.getMonth();
  });

  const isCommitted = todayLedger?.isCommitted ?? false;

  const todayCompleted = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return (
      o.status === "completed" &&
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth()
    );
  });

  const staging = buildStagingLedger(todayCompleted);

  const todayRevenue =
    todayLedger?.grandTotal ??
    todayCompleted.reduce((s, o) => s + o.finalAmount, 0);

  const handleCommit = async () => {
    setCommitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    commitEOD(todayLedger?.date);
    toast.success("EOD committed! Inventory updated and ledger locked.");
    setConfirmOpen(false);
    setCommitting(false);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">End of Day</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review today's completed orders and commit to permanent inventory
        </p>
      </div>

      {/* Status banner */}
      {isCommitted ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Today's EOD is committed
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Inventory has been updated. Ledger is locked.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Unlock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Pending — not yet committed
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Review the staging ledger below and commit when ready.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Orders Today",
            value: todayCompleted.length,
            sub: "completed",
          },
          {
            label: "Today's Revenue",
            value: formatCurrency(todayRevenue),
            sub: "gross",
          },
          {
            label: "Items to Deduct",
            value: staging.length,
            sub: "item-location pairs",
          },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {label}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Staging ledger table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">
            Staging Ledger — Stock Deductions
          </h2>
        </div>

        {staging.length > 0 ? (
          <table className="table-base">
            <thead>
              <tr>
                <th>Item</th>
                <th>Location</th>
                <th>Total Deduction</th>
                <th>From Orders</th>
              </tr>
            </thead>
            <tbody>
              {staging.map((entry, i) => {
                const item = MOCK_ITEMS.find((it) => it.id === entry.itemId);
                const unit = MOCK_UNITS.find((u) => u.id === item?.unitId);
                const location = MOCK_LOCATIONS.find(
                  (l) => l.id === entry.locationId,
                );
                return (
                  <tr key={i}>
                    <td>
                      <span className="font-medium text-slate-800">
                        {item?.name}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-500">{location?.name}</span>
                    </td>
                    <td>
                      <span className="font-bold text-red-600 tabular-nums">
                        −{entry.totalQty} {unit?.abbr}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {entry.orders.map((oid) => (
                          <span
                            key={oid}
                            className="text-[11px] font-mono bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded"
                          >
                            {oid}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-14 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No completed orders to commit today</p>
          </div>
        )}
      </div>

      {/* Commit button */}
      {!isCommitted && staging.length > 0 && (
        <div className="flex justify-end">
          <Button
            size="lg"
            variant="primary"
            icon={CheckCircle2}
            onClick={() => setConfirmOpen(true)}
          >
            Commit EOD
          </Button>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCommit}
        title="Commit End of Day"
        message={`This will permanently update inventory for ${staging.length} item-location pair(s) and lock today's ledger. This action cannot be undone (but corrections are possible afterwards).`}
        confirmText="Commit EOD"
        variant="primary"
        loading={committing}
      />
    </div>
  );
}
