import { useState } from "react";
import {
  Users2,
  ChevronRight,
  TrendingDown,
  IndianRupee,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import { useCustomersStore } from "../store/dataStore";
import toast from "react-hot-toast";

function CustomerCard({ customer, onClick }) {
  const outstanding = customer.totalOwed - customer.totalPaid;
  const isPaid = outstanding <= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow",
        isPaid
          ? "border-emerald-200"
          : outstanding > 2000
            ? "border-red-200"
            : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-900">{customer.name}</p>
          <p className="text-sm text-slate-400 mt-0.5">{customer.phone}</p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-xl font-bold tabular-nums",
              isPaid ? "text-emerald-600" : "text-red-600",
            )}
          >
            {formatCurrency(outstanding)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">outstanding</p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>{customer.transactions.length} transactions</span>
        <div className="flex items-center gap-1 text-brand-600 font-medium">
          View history <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const { customers, recordPayment } = useCustomersStore();
  const [selected, setSelected] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("Cash payment");
  const [submitting, setSubmitting] = useState(false);

  const customer = customers.find((c) => c.id === selected);
  const outstanding = customer ? customer.totalOwed - customer.totalPaid : 0;

  const totalOutstanding = customers.reduce(
    (s, c) => s + (c.totalOwed - c.totalPaid),
    0,
  );

  const handlePayment = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    recordPayment(selected, amt, payNote);
    toast.success(`₹${amt} recorded for ${customer.name}`);
    setPayModal(false);
    setPayAmount("");
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Udhaar (Credit)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Customer outstanding balances
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total outstanding</p>
          <p className="text-2xl font-bold text-red-600 tabular-nums">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Customer grid */}
      {!selected ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onClick={() => setSelected(c.id)}
            />
          ))}
          {customers.length === 0 && (
            <div className="col-span-3 py-16 text-center text-slate-400">
              <Users2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-slate-500">No credit customers</p>
              <p className="text-sm">
                Customers with credit orders will appear here
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Customer detail */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to all customers
            </button>
            <Button
              size="sm"
              variant="success"
              icon={IndianRupee}
              onClick={() => setPayModal(true)}
              disabled={outstanding <= 0}
            >
              Record Payment
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {customer.name}
                </h2>
                <p className="text-sm text-slate-400">{customer.phone}</p>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <p className="text-xs text-slate-400">Total Owed</p>
                  <p className="text-lg font-bold text-slate-700 tabular-nums">
                    {formatCurrency(customer.totalOwed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Paid</p>
                  <p className="text-base font-semibold text-emerald-600 tabular-nums">
                    {formatCurrency(customer.totalPaid)}
                  </p>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Outstanding</p>
                  <p
                    className={cn(
                      "text-xl font-bold tabular-nums",
                      outstanding > 0 ? "text-red-600" : "text-emerald-600",
                    )}
                  >
                    {formatCurrency(outstanding)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">
                Transaction History
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {customer.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        tx.type === "payment" ? "bg-emerald-100" : "bg-red-100",
                      )}
                    >
                      {tx.type === "payment" ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {tx.note}
                      </p>
                      {tx.orderId && (
                        <p className="text-xs text-brand-600 font-mono">
                          {tx.orderId}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      tx.type === "payment"
                        ? "text-emerald-600"
                        : "text-red-600",
                    )}
                  >
                    {tx.type === "payment" ? "+" : "−"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title={`Record Payment — ${customer?.name}`}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPayModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              loading={submitting}
              onClick={handlePayment}
            >
              Record Payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between">
            <span className="text-slate-500">Outstanding</span>
            <span className="font-bold text-red-600">
              {formatCurrency(outstanding)}
            </span>
          </div>
          <Input
            label="Amount (₹)"
            type="number"
            min="1"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="Enter amount received"
            icon={IndianRupee}
          />
          <Input
            label="Payment Note"
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
            placeholder="Cash payment, UPI, etc."
          />
        </div>
      </Modal>
    </div>
  );
}
