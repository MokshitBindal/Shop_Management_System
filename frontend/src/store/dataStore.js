import { create } from "zustand";
import {
  MOCK_ORDERS,
  MOCK_INVENTORY,
  MOCK_CUSTOMERS,
  MOCK_DAILY_LEDGER,
  MOCK_ITEMS,
} from "../lib/mockData";

// Orders store
export const useOrdersStore = create((set, get) => ({
  orders: [...MOCK_ORDERS],

  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),

  updateOrderStatus: (id, status, extra = {}) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id ? { ...o, status, ...extra } : o,
      ),
    })),

  updateChecklist: (orderId, itemIndex, checked) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((item, i) =>
                i === itemIndex ? { ...item, isChecked: checked } : item,
              ),
            }
          : o,
      ),
    })),
}));

// Inventory store
export const useInventoryStore = create((set) => ({
  inventory: [...MOCK_INVENTORY],
  items: [...MOCK_ITEMS],

  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),

  updateItem: (id, data) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
    })),

  updateStock: (itemId, locationId, qty) =>
    set((s) => ({
      inventory: s.inventory.map((inv) =>
        inv.itemId === itemId && inv.locationId === locationId
          ? { ...inv, qty }
          : inv,
      ),
    })),
}));

// Customers store
export const useCustomersStore = create((set) => ({
  customers: [...MOCK_CUSTOMERS],

  recordPayment: (customerId, amount, note) =>
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              totalPaid: c.totalPaid + amount,
              transactions: [
                {
                  id: Date.now(),
                  orderId: null,
                  type: "payment",
                  amount,
                  date: new Date().toISOString(),
                  note,
                },
                ...c.transactions,
              ],
            }
          : c,
      ),
    })),
}));

// Ledger store
export const useLedgerStore = create((set) => ({
  ledger: [...MOCK_DAILY_LEDGER],

  commitEOD: (date) =>
    set((s) => ({
      ledger: s.ledger.map((l) =>
        l.date === date ? { ...l, isCommitted: true } : l,
      ),
    })),
}));

// Cart store (POS)
export const useCartStore = create((set) => ({
  items: [],
  customerName: "",
  customerPhone: "",
  discount: 0,
  paymentMethod: "cash",
  isDeliveryOrder: false,
  deliveryAgentName: "",
  notes: "",

  setCustomer: (name, phone) =>
    set({ customerName: name, customerPhone: phone }),
  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setDelivery: (flag, agentName) =>
    set({ isDeliveryOrder: flag, deliveryAgentName: agentName }),
  setNotes: (notes) => set({ notes }),

  addItem: (item, qty, price) =>
    set((s) => {
      const existing = s.items.find((i) => i.itemId === item.id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.itemId === item.id
              ? { ...i, qty: i.qty + qty, priceApplied: price }
              : i,
          ),
        };
      }
      return {
        items: [
          ...s.items,
          {
            itemId: item.id,
            name: item.name,
            unitId: item.unitId,
            qty,
            priceApplied: price,
          },
        ],
      };
    }),

  updateItem: (itemId, field, value) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.itemId === itemId ? { ...i, [field]: value } : i,
      ),
    })),

  removeItem: (itemId) =>
    set((s) => ({ items: s.items.filter((i) => i.itemId !== itemId) })),

  clearCart: () =>
    set({
      items: [],
      customerName: "",
      customerPhone: "",
      discount: 0,
      paymentMethod: "cash",
      isDeliveryOrder: false,
      deliveryAgentName: "",
      notes: "",
    }),

  get total() {
    return this.items.reduce((sum, i) => sum + i.qty * i.priceApplied, 0);
  },
}));
