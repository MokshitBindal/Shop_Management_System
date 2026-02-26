import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Package,
  UserCheck,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { StatusBadge, PaymentBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Input";
import { formatCurrency, formatDateTime, cn } from "../lib/utils";
import { useOrdersStore } from "../store/dataStore";
import { useAuthStore } from "../store/authStore";
import { MOCK_USERS, MOCK_ITEMS, MOCK_UNITS } from "../lib/mockData";
import toast from "react-hot-toast";

function ItemRow({ orderItem, index, canCheck, onCheck }) {
  const item = MOCK_ITEMS.find((i) => i.id === orderItem.itemId);
  const unit = MOCK_UNITS.find((u) => u.id === item?.unitId);
  const lineTotal = orderItem.qty * orderItem.priceApplied;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-3.5 transition-colors",
        orderItem.isChecked ? "bg-emerald-50/40" : "hover:bg-slate-50",
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => canCheck && onCheck(index, !orderItem.isChecked)}
        disabled={!canCheck}
        className={cn(
          "shrink-0",
          canCheck ? "cursor-pointer" : "cursor-default",
        )}
      >
        {orderItem.isChecked ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle
            className={cn(
              "w-5 h-5",
              canCheck
                ? "text-slate-300 hover:text-slate-400"
                : "text-slate-200",
            )}
          />
        )}
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            orderItem.isChecked
              ? "text-emerald-700 line-through decoration-emerald-300"
              : "text-slate-800",
          )}
        >
          {item?.name ?? `Item #${orderItem.itemId}`}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {orderItem.qty} {unit?.abbr} ×{" "}
          {formatCurrency(orderItem.priceApplied)}
        </p>
      </div>

      {/* Line total */}
      <span
        className={cn(
          "text-sm font-semibold tabular-nums shrink-0",
          orderItem.isChecked ? "text-emerald-600" : "text-slate-700",
        )}
      >
        {formatCurrency(lineTotal)}
      </span>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Countdown banner — shown when boss lands here right after creating an order
  const [countdown, setCountdown] = useState(
    location.state?.justCreated && user?.role === "boss" ? 3 : null,
  );
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      navigate("/new-order", { replace: true });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);
  const { orders, updateOrderStatus, updateChecklist } = useOrdersStore();
  const [completeModal, setCompleteModal] = useState(false);
  const [attributeEmployee, setAttributeEmployee] = useState("");
  const [completing, setCompleting] = useState(false);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Order not found</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => navigate("/orders")}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  const employees = MOCK_USERS.filter((u) => u.role === "employee");
  const creator = MOCK_USERS.find((u) => u.id === order.createdBy);
  const completer = MOCK_USERS.find((u) => u.id === order.completedBy);
  const fulfillers = MOCK_USERS.filter((u) =>
    order.fulfilledBy?.includes(u.id),
  );

  const canCheck = user.role === "employee" && order.status === "pending";
  const canComplete =
    (user.role === "manager" || user.role === "boss") &&
    ["pending", "fulfilling"].includes(order.status);
  const canMarkFulfilling =
    (user.role === "manager" || user.role === "boss") &&
    order.isDeliveryOrder &&
    order.status === "pending";
  const allChecked = order.items.every((i) => i.isChecked);
  const checkedCount = order.items.filter((i) => i.isChecked).length;

  const handleComplete = async () => {
    if (!attributeEmployee) {
      toast.error("Select the fulfilling employee");
      return;
    }
    setCompleting(true);
    await new Promise((r) => setTimeout(r, 600));
    updateOrderStatus(id, "completed", {
      completedBy: user.id,
      completedAt: new Date().toISOString(),
      fulfilledBy: [parseInt(attributeEmployee)],
    });
    toast.success("Order marked as Completed");
    setCompleteModal(false);
    setCompleting(false);
  };

  const handleFulfilling = () => {
    updateOrderStatus(id, "fulfilling");
    toast.success("Order marked as In Transit");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Auto-redirect countdown banner */}
      {countdown !== null && (
        <div className="flex items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Order created — returning to New Order in{" "}
              <strong>{countdown}s</strong>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCountdown(null);
                navigate("/orders");
              }}
              className="text-xs text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
            >
              View orders
            </button>
            <button
              onClick={() => {
                setCountdown(null);
                navigate("/new-order", { replace: true });
              }}
              className="text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
            >
              New order now →
            </button>
          </div>
        </div>
      )}

      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {order.id}
              </h1>
              {order.isDeliveryOrder && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-medium">
                  <Truck className="w-3 h-3" /> Delivery
                </span>
              )}
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Created {formatDateTime(order.createdAt)} by {creator?.name}
            </p>
          </div>
          {order.paymentMethod && <PaymentBadge method={order.paymentMethod} />}
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" /> Customer
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Name</p>
            <p className="text-sm font-medium text-slate-800">
              {order.customerName || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Phone</p>
            <p className="text-sm font-medium text-slate-800">
              {order.customerPhone || "—"}
            </p>
          </div>
          {order.isDeliveryOrder && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-0.5">Delivery Agent</p>
              <p className="text-sm font-medium text-slate-800">
                {order.deliveryAgentName || "—"}
              </p>
            </div>
          )}
          {order.notes && (
            <div className="col-span-2 pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Notes
              </p>
              <p className="text-sm text-slate-600 italic">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Checklist progress (employee context) */}
      {order.status === "pending" && user.role === "employee" && (
        <div
          className={cn(
            "px-4 py-3 rounded-xl border flex items-center gap-3",
            allChecked
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200",
          )}
        >
          <Package
            className={cn(
              "w-5 h-5 shrink-0",
              allChecked ? "text-emerald-600" : "text-amber-600",
            )}
          />
          <div className="flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                allChecked ? "text-emerald-800" : "text-amber-800",
              )}
            >
              {allChecked
                ? "All items packed! Waiting for manager to verify."
                : `${checkedCount} / ${order.items.length} items packed`}
            </p>
            <div className="mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  allChecked ? "bg-emerald-500" : "bg-amber-500",
                )}
                style={{
                  width: `${(checkedCount / order.items.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-slate-400" />
            Items · {checkedCount}/{order.items.length} packed
          </h2>
          <span className="text-xs text-slate-400">
            {order.items.length} line items
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {order.items.map((item, i) => (
            <ItemRow
              key={i}
              orderItem={item}
              index={i}
              canCheck={canCheck}
              onCheck={(idx, val) => updateChecklist(id, idx, val)}
            />
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="flex flex-col gap-1.5 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="tabular-nums">
                  −{formatCurrency(order.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 text-base pt-1.5 border-t border-slate-200">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(order.finalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fulfillment info (completed orders) */}
      {order.status === "completed" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400" /> Fulfillment
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Verified by</p>
              <p className="font-medium text-slate-800">
                {completer?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Packed by</p>
              <p className="font-medium text-slate-800">
                {fulfillers.length > 0
                  ? fulfillers.map((f) => f.name).join(", ")
                  : "—"}
              </p>
            </div>
            {order.completedAt && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Completed at</p>
                <p className="font-medium text-slate-800">
                  {formatDateTime(order.completedAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {(canComplete || canMarkFulfilling) && (
        <div className="flex gap-3 pt-2">
          {canMarkFulfilling && (
            <Button variant="secondary" icon={Truck} onClick={handleFulfilling}>
              Mark as In Transit
            </Button>
          )}
          {canComplete && (
            <Button
              variant="success"
              icon={CheckCircle2}
              onClick={() => setCompleteModal(true)}
            >
              Mark as Completed
            </Button>
          )}
        </div>
      )}

      {/* Complete modal */}
      <Modal
        open={completeModal}
        onClose={() => setCompleteModal(false)}
        title="Complete Order"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCompleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              loading={completing}
              onClick={handleComplete}
            >
              Confirm Complete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Before completing, record which employee fulfilled this order.
          </p>
          <Select
            label="Fulfilled by (employee)"
            value={attributeEmployee}
            onChange={(e) => setAttributeEmployee(e.target.value)}
            options={[
              { value: "", label: "Select employee…" },
              ...employees.map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
          {!allChecked && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {order.items.length - checkedCount} item(s) not yet checked off.
                Confirm if they're accounted for.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
