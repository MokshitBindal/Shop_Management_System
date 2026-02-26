import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trash2,
  Truck,
  IndianRupee,
  User,
  Tag,
  AlertCircle,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { formatCurrency, cn } from "../lib/utils";
import { MOCK_ITEMS, MOCK_UNITS } from "../lib/mockData";
import { useCartStore, useOrdersStore } from "../store/dataStore";
import toast from "react-hot-toast";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "💵 Cash" },
  { value: "upi", label: "📱 UPI" },
  { value: "credit", label: "📒 Udhaar" },
  { value: "mixed", label: "🔀 Mixed" },
];

function ItemSearch({ onAdd }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return MOCK_ITEMS.filter(
      (i) => i.status === "active" && i.name.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  const handleSelect = (item) => {
    onAdd(item);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search and add items…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
                     focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {results.map((item) => {
            const unit = MOCK_UNITS.find((u) => u.id === item.unitId);
            return (
              <button
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-brand-50 transition-colors text-left"
              >
                <span className="text-sm font-medium text-slate-800">
                  {item.name}
                </span>
                <span className="text-xs text-slate-400">
                  {formatCurrency(item.defaultPrice)}/{unit?.abbr}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartRow({ cartItem, onUpdate, onRemove }) {
  const unit = MOCK_UNITS.find((u) => u.id === cartItem.unitId);
  const lineTotal = cartItem.qty * cartItem.priceApplied;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {cartItem.name}
        </p>
        <p className="text-xs text-slate-400">{unit?.abbr}</p>
      </div>
      {/* Qty */}
      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            cartItem.qty > 1 &&
            onUpdate(cartItem.itemId, "qty", cartItem.qty - 1)
          }
          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold transition-colors"
        >
          −
        </button>
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={cartItem.qty}
          onChange={(e) =>
            onUpdate(cartItem.itemId, "qty", parseFloat(e.target.value) || 0)
          }
          className="w-14 text-center text-sm font-semibold border border-slate-200 rounded-lg py-0.5 focus:outline-none focus:border-brand-400"
        />
        <button
          onClick={() => onUpdate(cartItem.itemId, "qty", cartItem.qty + 1)}
          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold transition-colors"
        >
          +
        </button>
      </div>
      {/* Price */}
      <div className="relative w-24">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
          ₹
        </span>
        <input
          type="number"
          min="0"
          value={cartItem.priceApplied}
          onChange={(e) =>
            onUpdate(
              cartItem.itemId,
              "priceApplied",
              parseFloat(e.target.value) || 0,
            )
          }
          className="w-full pl-6 pr-2 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 tabular-nums"
        />
      </div>
      {/* Line total */}
      <span className="text-sm font-bold text-slate-900 tabular-nums w-20 text-right">
        {formatCurrency(lineTotal)}
      </span>
      <button
        onClick={() => onRemove(cartItem.itemId)}
        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function NewOrder() {
  const navigate = useNavigate();
  const {
    items,
    customerName,
    customerPhone,
    discount,
    paymentMethod,
    isDeliveryOrder,
    deliveryAgentName,
    notes,
    setCustomer,
    setDiscount,
    setPaymentMethod,
    setDelivery,
    setNotes,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  } = useCartStore();
  const { addOrder } = useOrdersStore();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const subtotal = items.reduce((s, i) => s + i.qty * i.priceApplied, 0);
  const finalTotal = Math.max(0, subtotal - (parseFloat(discount) || 0));

  const handleAddItem = (item) => {
    addItem(item, 1, item.defaultPrice);
    toast.success(`${item.name} added`, { duration: 1200 });
  };

  const validate = () => {
    const e = {};
    if (items.length === 0) e.items = "Add at least one item";
    if (paymentMethod === "credit" && !customerPhone)
      e.phone = "Phone required for credit orders";
    if (isDeliveryOrder && !customerName)
      e.name = "Customer name required for delivery";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const order = {
      id: `ORD-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      customerName,
      customerPhone,
      isDeliveryOrder,
      deliveryAgentName: isDeliveryOrder ? deliveryAgentName : null,
      status: "pending",
      paymentMethod,
      totalAmount: subtotal,
      discount: parseFloat(discount) || 0,
      finalAmount: finalTotal,
      createdBy: 1,
      completedBy: null,
      fulfilledBy: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
      items: items.map((i) => ({
        itemId: i.itemId,
        qty: i.qty,
        priceApplied: i.priceApplied,
        isChecked: false,
      })),
      notes,
    };

    addOrder(order);
    clearCart();
    toast.success(`Order ${order.id} created!`);
    navigate(`/orders/${order.id}`, { state: { justCreated: true } });
    setTimeout(() => navigate("/new-order", { replace: true }), 3000);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Order</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            POS — create a customer order
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear cart
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── LEFT col (3/5): cart + delivery + notes ────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Cart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-400" /> Cart
            </h2>
            <ItemSearch onAdd={handleAddItem} />
            {errors.items && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.items}
              </p>
            )}

            {items.length > 0 ? (
              <div className="mt-4">
                <div className="hidden sm:flex items-center gap-3 pb-2 border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <span className="flex-1">Item</span>
                  <span className="w-28 text-center">Qty</span>
                  <span className="w-24 text-center">Price (₹)</span>
                  <span className="w-20 text-right">Total</span>
                  <span className="w-6" />
                </div>
                {items.map((item) => (
                  <CartRow
                    key={item.itemId}
                    cartItem={item}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 py-10 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Search and add items above</p>
              </div>
            )}
          </div>

          {/* Delivery toggle + agent name */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" /> Delivery Order
              </h2>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setDelivery(!isDeliveryOrder, deliveryAgentName)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0",
                  isDeliveryOrder ? "bg-brand-600" : "bg-slate-200",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                    isDeliveryOrder ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {isDeliveryOrder && (
              <div className="mt-3">
                <Input
                  label="Delivery Agent Name"
                  placeholder="e.g. Ramesh, local courier…"
                  value={deliveryAgentName}
                  onChange={(e) => setDelivery(true, e.target.value)}
                  icon={Truck}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  For your records only — not linked to any account
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Notes{" "}
              <span className="text-xs font-normal text-slate-400">
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Delivery address, special instructions…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>

        {/* ── RIGHT col (2/5): customer + payment + totals ───── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" /> Customer
            </h2>
            <Input
              label="Name"
              placeholder="Rajesh Kumar"
              value={customerName}
              onChange={(e) => setCustomer(e.target.value, customerPhone)}
              error={errors.name}
            />
            <Input
              label="Phone"
              placeholder="98765 43210"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomer(customerName, e.target.value)}
              error={errors.phone}
            />
          </div>

          {/* Payment mode */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-slate-400" /> Payment
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all duration-100 text-left",
                    paymentMethod === opt.value
                      ? "border-brand-400 bg-brand-50 text-brand-800 font-medium"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Input
              label="Discount (₹)"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              icon={Tag}
            />
          </div>

          {/* Totals + submit */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>
                  Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})
                </span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {parseFloat(discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    −{formatCurrency(parseFloat(discount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              loading={submitting}
              onClick={handleSubmit}
              disabled={items.length === 0}
            >
              {submitting ? "Creating…" : "Create Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
