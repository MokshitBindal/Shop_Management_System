import { useState } from "react";
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PaymentBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import { useLedgerStore } from "../store/dataStore";
import { MOCK_USERS } from "../lib/mockData";
import toast from "react-hot-toast";

function LedgerRow({ entry, expanded, onToggle }) {
  const verifier = entry.verifiedBy
    ? MOCK_USERS.find((u) => u.id === entry.verifiedBy)
    : null;

  return (
    <div
      className={cn(
        "border-b border-slate-100 last:border-0",
        expanded && "bg-slate-50/50",
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">
                {formatDate(entry.date)}
              </p>
              {entry.isCommitted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-medium">
                  <Lock className="w-2.5 h-2.5" /> Committed
                </span>
              )}
              {!entry.isCommitted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-medium">
                  Today
                </span>
              )}
              {entry.isCorrected && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] rounded-full font-medium">
                  Corrected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {entry.orders.length} orders
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold tabular-nums text-slate-900">
            {formatCurrency(entry.grandTotal)}
          </p>
          <div className="flex gap-1 justify-end mt-1">
            {entry.totalCash > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium">
                Cash {formatCurrency(entry.totalCash)}
              </span>
            )}
            {entry.totalUpi > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">
                UPI {formatCurrency(entry.totalUpi)}
              </span>
            )}
            {entry.totalCredit > 0 && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-medium">
                Credit {formatCurrency(entry.totalCredit)}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded orders */}
      {expanded && (
        <div className="px-5 pb-4">
          <table className="table-base">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Verified by</th>
              </tr>
            </thead>
            <tbody>
              {entry.orders.map((o) => {
                const v = o.verifiedBy
                  ? MOCK_USERS.find((u) => u.id === o.verifiedBy)
                  : null;
                return (
                  <tr key={o.orderId}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-brand-700">
                        {o.orderId}
                      </span>
                    </td>
                    <td>{o.customerName || "—"}</td>
                    <td>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(o.finalAmount)}
                      </span>
                    </td>
                    <td>
                      <PaymentBadge method={o.paymentMethod} />
                    </td>
                    <td>
                      <span className="text-slate-500">{v?.name ?? "—"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Ledger() {
  const { ledger } = useLedgerStore();
  const [expanded, setExpanded] = useState(null);

  const sorted = [...ledger].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const totalRevenue = ledger.reduce((s, l) => s + l.grandTotal, 0);

  const toggle = (i) => setExpanded((prev) => (prev === i ? null : i));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daily transaction records (Boss access only)
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">All-time revenue</p>
          <p className="text-xl font-bold text-brand-700 tabular-nums">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Payment summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Cash",
            val: ledger.reduce((s, l) => s + l.totalCash, 0),
            color: "emerald",
          },
          {
            label: "UPI",
            val: ledger.reduce((s, l) => s + l.totalUpi, 0),
            color: "sky",
          },
          {
            label: "Credit",
            val: ledger.reduce((s, l) => s + l.totalCredit, 0),
            color: "red",
          },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className={`text-lg font-bold tabular-nums text-${color}-600`}>
              {formatCurrency(val)}
            </p>
          </div>
        ))}
      </div>

      {/* Ledger entries */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">
            Daily Records
          </h2>
        </div>
        {sorted.map((entry, i) => (
          <LedgerRow
            key={i}
            entry={entry}
            expanded={expanded === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </div>
  );
}
