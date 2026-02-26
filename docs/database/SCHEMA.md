# Database Schema & Design

## Document Version: 1.0

**Date:** February 26, 2026

---

## 1. Overview

This document defines the complete PostgreSQL database schema using **Drizzle ORM** in TypeScript. The schema is designed to support:

- Real-time inventory tracking across multiple storage locations
- Order creation with dynamic pricing
- Temporary stock deductions via EOD staging area
- Customer credit (Udhaar) management
- Ledger-based financial tracking
- Employee attendance and user management

---

## 2. Core Schema Tables

### 2.1 USERS Table

**Purpose:** Store user accounts with role-based access control

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: pgEnum("role", ["boss", "manager", "employee"])("role").notNull(),
  passcode: varchar("passcode", { length: 255 }).notNull(), // bcrypt hash
  macAddress: varchar("mac_address", { length: 50 }).unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});
```

**Columns:**

- `id`: Primary key, auto-increment
- `name`: Employee/Manager/Boss name (e.g., "Rajesh Kumar")
- `role`: ENUM - "boss", "manager", or "employee"
- `passcode`: bcrypt-hashed password (never store plaintext)
- `macAddress`: Device MAC address for whitelisting (e.g., "AA:BB:CC:DD:EE:FF")
- `isActive`: Soft delete flag (deactivate instead of deleting)
- `createdAt`: Account creation timestamp
- `lastLogin`: Last successful login timestamp

**Indexes:**

```sql
CREATE INDEX idx_users_role ON users(role);
CREATE UNIQUE INDEX idx_users_mac ON users(mac_address) WHERE is_active = true;
```

**Example Data:**
| id | name | role | macAddress | isActive |
|---|---|---|---|---|
| 1 | Vikram | boss | AA:11:22:33:44:55 | true |
| 2 | Priya | manager | BB:11:22:33:44:55 | true |
| 3 | Arun | employee | CC:11:22:33:44:55 | true |

---

### 2.2 UNITS Table

**Purpose:** Define custom measurement units for items

```typescript
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  abbreviation: varchar("abbreviation", { length: 10 }).notNull(),
  description: varchar("description", { length: 200 }),
});
```

**Columns:**

- `id`: Primary key
- `name`: Full name of unit (e.g., "Kilogram", "Piece")
- `abbreviation`: Short form (e.g., "kg", "pcs")
- `description`: Optional notes

**Example Data:**
| id | name | abbreviation | description |
|---|---|---|---|
| 1 | Kilogram | kg | Weight unit |
| 2 | Piece | pcs | Individual items |
| 3 | Liter | L | Volume unit |
| 4 | Dozen | doz | 12 units |

---

### 2.3 STORAGE_LOCATIONS Table

**Purpose:** Define physical warehouse/storage locations

```typescript
export const storageLocations = pgTable("storage_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 300 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Columns:**

- `id`: Primary key
- `name`: Location name (e.g., "Main Shop", "Warehouse 1", "Basement")
- `description`: Location details
- `isActive`: Is location currently in use?

**Example Data:**
| id | name | description |
|---|---|---|
| 1 | Main Shop | Front counter and display shelves |
| 2 | Warehouse 1 | Separate building, high-value stock |
| 3 | Basement | Temperature-controlled, perishables |

---

### 2.4 ITEMS Table

**Purpose:** Master catalog of all products

```typescript
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
  unitId: integer("unit_id")
    .references(() => units.id)
    .notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // For metrics
  category: varchar("category", { length: 100 }), // e.g., "Groceries", "Spices"
  barcode: varchar("barcode", { length: 50 }).unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});
```

**Columns:**

- `id`: Primary key
- `name`: Product name (e.g., "Basmati Rice")
- `defaultPrice`: Base selling price in rupees
- `unitId`: Foreign key to units table
- `costPrice`: Optional cost to calculate margins
- `category`: Product category for filtering
- `barcode`: Optional barcode for quick scanning
- `isActive`: Is item available for purchase?
- `createdAt`: When item was added
- `createdBy`: Which user added this item

**Indexes:**

```sql
CREATE INDEX idx_items_category ON items(category);
CREATE UNIQUE INDEX idx_items_barcode ON items(barcode) WHERE barcode IS NOT NULL;
```

**Example Data:**
| id | name | defaultPrice | unitId | category | isActive |
|---|---|---|---|---|---|
| 1 | Basmati Rice | 45.00 | 1 | Groceries | true |
| 2 | Sugar | 40.00 | 1 | Groceries | true |
| 3 | Mustard Oil | 150.00 | 3 | Oils | true |

---

### 2.5 INVENTORY Table

**Purpose:** Current stock levels for each item at each location

```typescript
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  locationId: integer("location_id")
    .references(() => storageLocations.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 })
    .notNull()
    .default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Composite unique constraint (only one record per item-location pair)
export const inventoryUniqueConstraint = unique().on(
  inventory.itemId,
  inventory.locationId,
);
```

**Columns:**

- `id`: Primary key
- `itemId`: Foreign key to items
- `locationId`: Foreign key to storage locations
- `quantity`: Current stock quantity (3 decimal places for sub-unit precision)
- `lastUpdated`: When was this quantity last changed

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_inventory_item_location ON inventory(item_id, location_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
```

**Example Data:**
| itemId | locationId | quantity | lastUpdated |
|---|---|---|---|
| 1 (Rice) | 1 (Main Shop) | 250.000 | 2026-02-26 |
| 1 (Rice) | 2 (Warehouse 1) | 100.000 | 2026-02-26 |
| 2 (Sugar) | 1 (Main Shop) | 50.000 | 2026-02-25 |

---

### 2.6 ORDERS Table

**Purpose:** Track all customer orders (bills)

```typescript
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: pgEnum("order_status", [
    "pending",
    "fulfilling", // NEW: delivery orders in transit
    "completed",
    "partial",
    "delayed",
    "changed",
  ])("status")
    .default("pending")
    .notNull(),
  paymentMethod: pgEnum("payment_method", ["cash", "upi", "credit", "mixed"])(
    "payment_method",
  ).notNull(), // Set by Boss at order creation
  paymentNote: varchar("payment_note", { length: 500 }), // Details if "mixed"
  isDeliveryOrder: boolean("is_delivery_order").default(false).notNull(), // NEW
  deliveryAssigneeId: integer("delivery_assignee_id").references(
    () => users.id,
  ), // NEW
  deliveryAddress: varchar("delivery_address", { length: 500 }), // NEW
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(), // Boss only
  verifiedBy: integer("verified_by").references(() => users.id), // Manager/Boss who completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  notes: varchar("notes", { length: 500 }),
});
```

**Columns:**

- `id`: Order ID (primary key, auto-increment)
- `customerName`: Customer name if known
- `customerPhone`: Customer phone (unique identifier for credit tracking)
- `subtotal`: Sum of (quantity × price) for all items
- `discount`: Flat discount amount applied
- `finalAmount`: subtotal - discount (what customer actually pays)
- `status`: Current order status (ENUM) — `fulfilling` is only valid for delivery orders
- `paymentMethod`: Set by Boss at order creation time (not on completion)
- `paymentNote`: If mixed payment, breakdown details
- `isDeliveryOrder`: Is this order to be physically delivered to customer?
- `deliveryAssigneeId`: Which employee will deliver (for delivery orders)
- `deliveryAddress`: Customer's delivery address (required for delivery orders)
- `createdBy`: User ID who created the order (Boss only)
- `verifiedBy`: Manager or Boss who marked the order as Completed
- `createdAt`: When order was created
- `completedAt`: When order was marked completed
- `notes`: Internal notes

**Indexes:**

```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_is_delivery ON orders(is_delivery_order);
```

**Example Data:**
| id | customerName | status | paymentMethod | isDeliveryOrder | deliveryAssigneeId |
|---|---|---|---|---|---|
| 1 | Rajesh | completed | cash | false | null |
| 2 | Suresh | fulfilling | credit | true | 3 |

---

### 2.7 ORDER_ITEMS Table

**Purpose:** Detailed line items for each order

```typescript
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Price override
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(), // quantity × unitPrice
  isChecked: boolean("is_checked").default(false).notNull(), // Fulfillment checklist
  locationPacked: integer("location_packed").references(
    () => storageLocations.id,
  ), // Where was item picked from
});
```

**Columns:**

- `id`: Primary key
- `orderId`: Foreign key to orders
- `itemId`: Foreign key to items
- `quantity`: How many units ordered
- `unitPrice`: Actual price charged (may differ from default)
- `lineTotal`: quantity × unitPrice (for quick billing)
- `isChecked`: Is this item confirmed packed?
- `locationPacked`: Which storage location was item taken from?

**Indexes:**

```sql
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
```

**Example Data:**
| orderId | itemId | quantity | unitPrice | lineTotal | isChecked |
|---|---|---|---|---|---|
| 1 | 1 (Rice) | 5.000 | 40.00 | 200.00 | true |
| 1 | 2 (Sugar) | 3.000 | 40.00 | 120.00 | true |

---

### 2.8 TEMPORARY_STOCK_LEDGER Table

**Purpose:** Staging area for stock deductions before EOD commit

```typescript
export const temporaryStockLedger = pgTable("temp_stock_ledger", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  locationId: integer("location_id")
    .references(() => storageLocations.id)
    .notNull(),
  quantityDeducted: decimal("quantity_deducted", {
    precision: 10,
    scale: 3,
  }).notNull(),
  isCommitted: boolean("is_committed").default(false).notNull(), // Flipped to true after EOD
  createdAt: timestamp("created_at").defaultNow().notNull(),
  committedAt: timestamp("committed_at"), // When was this committed in EOD
});
```

**Columns:**

- `id`: Primary key
- `orderId`: Foreign key to orders
- `itemId`: Foreign key to items
- `locationId`: Which location's stock to deduct from
- `quantityDeducted`: How many units to remove
- `isCommitted`: Has this been finalized in EOD?
- `createdAt`: When order was completed (and temp ledger record created)
- `committedAt`: When EOD commit happened

**Indexes:**

```sql
CREATE INDEX idx_temp_ledger_is_committed ON temp_stock_ledger(is_committed);
CREATE INDEX idx_temp_ledger_created_at ON temp_stock_ledger(created_at);
```

**Why this table exists:**
During business hours, multiple orders are created rapidly. If we updated the `inventory` table directly for each order, the table would be locked frequently, causing slowdowns. Instead:

1. Each completed order logs a record here (uncommitted)
2. At EOD, we read all uncommitted records
3. Aggregate by item-location pair
4. Single bulk update to the `inventory` table
5. Mark all records as committed

**Example Data:**
| orderId | itemId | locationId | quantityDeducted | isCommitted |
|---|---|---|---|---|
| 1 | 1 (Rice) | 1 (Main Shop) | 5.000 | false |
| 2 | 2 (Sugar) | 1 (Main Shop) | 3.000 | false |

---

### 2.9 CUSTOMER_LEDGER Table

**Purpose:** Track customer credit (Udhaar) balances

```typescript
export const customerLedger = pgTable("customer_ledger", {
  id: serial("id").primaryKey(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  orderId: integer("order_id").references(() => orders.id),
  amountOwed: decimal("amount_owed", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  outstanding: decimal("outstanding", { precision: 10, scale: 2 })
    .generatedAlwaysAs(sql`amount_owed - amount_paid`)
    .stored(),
  isSettled: boolean("is_settled")
    .generatedAlwaysAs(sql`amount_owed <= amount_paid`)
    .stored(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});
```

**Columns:**

- `id`: Primary key
- `customerPhone`: Customer identifier (unique contact)
- `customerName`: Customer name
- `orderId`: Which order triggered this credit entry
- `amountOwed`: Total amount customer owes
- `amountPaid`: Total amount customer has paid
- `outstanding`: Calculated field (owed - paid)
- `isSettled`: Calculated field (owed ≤ paid?)
- `createdAt`: When credit was first given
- `lastUpdated`: When was last payment recorded?

**Indexes:**

```sql
CREATE INDEX idx_customer_ledger_phone ON customer_ledger(customer_phone);
CREATE INDEX idx_customer_ledger_is_settled ON customer_ledger(is_settled);
```

**Example Data:**
| customerPhone | customerName | amountOwed | amountPaid | outstanding | isSettled |
|---|---|---|---|---|---|
| 98765-43210 | Rajesh | 1500.00 | 600.00 | 900.00 | false |
| 98765-11111 | Priya | 500.00 | 500.00 | 0.00 | true |

---

### 2.10 DAILY_LEDGER Table

**Purpose:** Permanent record of all completed transactions for a day (correctable by Boss with audit trail)

```typescript
export const dailyLedger = pgTable("daily_ledger", {
  id: serial("id").primaryKey(),
  transactionDate: date("transaction_date").notNull(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // cash|upi|credit|mixed
  paymentBreakdown: varchar("payment_breakdown", { length: 500 }), // JSON details
  recordedBy: integer("recorded_by")
    .references(() => users.id)
    .notNull(), // Boss who created order
  verifiedBy: integer("verified_by").references(() => users.id), // Manager/Boss who completed
  isLocked: boolean("is_locked").default(false).notNull(), // Locked after EOD (soft lock; Boss can correct)
  isCorrected: boolean("is_corrected").default(false).notNull(), // Has a correction been applied?
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Columns:**

- `id`: Primary key
- `transactionDate`: Date of transaction (YYYY-MM-DD)
- `orderId`: Link to actual order
- `customerName`, `customerPhone`: Snapshot of customer info
- `totalAmount`: Final bill amount
- `paymentMethod`: How was payment made
- `paymentBreakdown`: JSON if mixed payment ({"cash": 500, "upi": 200})
- `recordedBy`: Boss who created the original order
- `verifiedBy`: Manager/Boss who marked the order Completed
- `isLocked`: True after EOD commit (soft lock; Boss can still correct)
- `isCorrected`: True if a correction has been applied to this record
- `createdAt`: When record was created

**Indexes:**

```sql
CREATE INDEX idx_daily_ledger_date ON daily_ledger(transaction_date);
CREATE INDEX idx_daily_ledger_is_locked ON daily_ledger(is_locked);
CREATE INDEX idx_daily_ledger_is_corrected ON daily_ledger(is_corrected);
```

---

### 2.11 ATTENDANCE Table

**Purpose:** Track employee attendance

```typescript
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  attendanceDate: date("attendance_date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  status: pgEnum("attendance_status", [
    "present",
    "absent",
    "leave",
    "half-day",
  ])("status").notNull(),
  markedBy: integer("marked_by")
    .references(() => users.id)
    .notNull(), // Manager/Boss
  notes: varchar("notes", { length: 300 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Columns:**

- `id`: Primary key
- `userId`: Which employee
- `attendanceDate`: Date of attendance (YYYY-MM-DD)
- `checkInTime`: When did they arrive?
- `checkOutTime`: When did they leave?
- `status`: Attendance status (ENUM)
- `markedBy`: Who recorded this?
- `notes`: Optional notes (e.g., "Left early for doctor's appointment")
- `createdAt`: When was this record created?

**Indexes:**

```sql
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(user_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
```

---

### 2.12 ORDER_FULFILLMENTS Table

**Purpose:** Records which employee(s) physically packed/delivered each completed order

```typescript
export const orderFulfillments = pgTable("order_fulfillments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  employeeId: integer("employee_id")
    .references(() => users.id)
    .notNull(),
  role: pgEnum("fulfillment_role", ["packer", "delivery"])("role").notNull(),
  attributedBy: integer("attributed_by")
    .references(() => users.id)
    .notNull(), // Manager/Boss who attributed
  attributedAt: timestamp("attributed_at").defaultNow().notNull(),
});
```

**Columns:**

- `id`: Primary key
- `orderId`: Which order was fulfilled
- `employeeId`: Which employee performed the fulfillment
- `role`: Whether this employee packed (`packer`) or delivered (`delivery`) the order
- `attributedBy`: Manager/Boss who selected this employee
- `attributedAt`: When the attribution was recorded

**Indexes:**

```sql
CREATE INDEX idx_fulfillments_order_id ON order_fulfillments(order_id);
CREATE INDEX idx_fulfillments_employee_id ON order_fulfillments(employee_id);
```

**Example Data:**
| orderId | employeeId | role | attributedBy |
|---|---|---|---|
| 42 | 3 (Arun) | packer | 2 (Manager Suresh) |
| 43 | 3 (Arun) | delivery | 1 (Boss Vikram) |

---

### 2.13 NOTIFICATIONS Table

**Purpose:** Stores order notification messages for employees with automatic 7-day expiry

```typescript
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(), // Recipient employee
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: varchar("content", { length: 1000 }).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // createdAt + 7 days
});
```

**Columns:**

- `id`: Primary key
- `userId`: The employee this notification is for
- `orderId`: Which order triggered this notification
- `title`: Short notification title
- `content`: Full notification message (includes item list)
- `isRead`: Has the employee viewed this notification?
- `createdAt`: When the notification was created
- `expiresAt`: **Exactly 7 days after `createdAt`** — server CRON purges expired rows daily at 2:00 AM

**Indexes:**

```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at); -- for CRON cleanup
```

**CRON Cleanup SQL (runs nightly):**

```sql
DELETE FROM notifications WHERE expires_at < NOW();
```

---

### 2.14 LEDGER_CORRECTIONS Table

**Purpose:** Audit log of all Boss-initiated corrections to locked daily ledger records

```typescript
export const ledgerCorrections = pgTable("ledger_corrections", {
  id: serial("id").primaryKey(),
  ledgerEntryId: integer("ledger_entry_id")
    .references(() => dailyLedger.id)
    .notNull(), // Which daily_ledger row was corrected
  field: varchar("field", { length: 100 }).notNull(), // e.g., 'total_amount', 'payment_method'
  originalValue: varchar("original_value", { length: 500 }).notNull(),
  correctedValue: varchar("corrected_value", { length: 500 }).notNull(),
  reason: varchar("reason", { length: 1000 }).notNull(), // Mandatory explanation
  correctedBy: integer("corrected_by")
    .references(() => users.id)
    .notNull(), // Boss only
  correctedAt: timestamp("corrected_at").defaultNow().notNull(),
});
```

**Columns:**

- `id`: Primary key
- `ledgerEntryId`: Which `daily_ledger` row was corrected
- `field`: Which field was changed (e.g., `total_amount`, `payment_method`)
- `originalValue`: The value before correction (stored as string for flexibility)
- `correctedValue`: The new value after correction
- `reason`: Mandatory explanation from Boss for why the correction was made
- `correctedBy`: Boss user ID (only Boss can create corrections)
- `correctedAt`: When the correction was applied

**Indexes:**

```sql
CREATE INDEX idx_corrections_ledger_entry ON ledger_corrections(ledger_entry_id);
CREATE INDEX idx_corrections_corrected_by ON ledger_corrections(corrected_by);
```

**Example Data:**
| ledgerEntryId | field | originalValue | correctedValue | reason | correctedBy |
|---|---|---|---|---|---|
| 1 | total_amount | 270.00 | 250.00 | Customer was given extra 20 rupee discount | 1 (Boss) |

### Entity Relationship Diagram

```
USERS
  ├─ has-many → ORDERS (created_by, verified_by, delivery_assignee_id)
  ├─ has-many → ATTENDANCE (marked_by / user_id)
  ├─ has-many → ITEMS (created_by)
  ├─ has-many → ORDER_FULFILLMENTS (employee_id, attributed_by)
  └─ has-many → NOTIFICATIONS (user_id)

ITEMS
  ├─ belongs-to → UNITS (unit_id)
  ├─ has-many → INVENTORY (item_id)
  └─ has-many → ORDER_ITEMS (item_id)

STORAGE_LOCATIONS
  ├─ has-many → INVENTORY (location_id)
  └─ has-many → TEMP_STOCK_LEDGER (location_id)

UNITS
  └─ has-many → ITEMS (unit_id)

ORDERS
  ├─ belongs-to → USERS (created_by, verified_by, delivery_assignee_id)
  ├─ has-many → ORDER_ITEMS (order_id)
  ├─ has-many → ORDER_FULFILLMENTS (order_id)
  ├─ has-many → NOTIFICATIONS (order_id)
  ├─ has-many → TEMP_STOCK_LEDGER (order_id)
  ├─ has-many → CUSTOMER_LEDGER (order_id)
  └─ has-many → DAILY_LEDGER (order_id)

INVENTORY
  ├─ belongs-to → ITEMS (item_id)
  └─ belongs-to → STORAGE_LOCATIONS (location_id)

TEMP_STOCK_LEDGER
  ├─ belongs-to → ORDERS (order_id)
  ├─ belongs-to → ITEMS (item_id)
  └─ belongs-to → STORAGE_LOCATIONS (location_id)

CUSTOMER_LEDGER
  └─ belongs-to → ORDERS (order_id, optional)

DAILY_LEDGER
  ├─ belongs-to → ORDERS (order_id)
  ├─ belongs-to → USERS (recorded_by, verified_by)
  └─ has-many → LEDGER_CORRECTIONS (ledger_entry_id)

ORDER_FULFILLMENTS
  ├─ belongs-to → ORDERS (order_id)
  └─ belongs-to → USERS (employee_id, attributed_by)

NOTIFICATIONS
  ├─ belongs-to → USERS (user_id)
  └─ belongs-to → ORDERS (order_id)
  (auto-purged after 7 days)

LEDGER_CORRECTIONS
  ├─ belongs-to → DAILY_LEDGER (ledger_entry_id)
  └─ belongs-to → USERS (corrected_by / Boss only)
```

---

## 4. SQL Queries for Key Operations

### 4.1 Create Order (Insert Order + Order Items)

```sql
BEGIN TRANSACTION;

-- Insert order
INSERT INTO orders (customer_name, customer_phone, subtotal, discount, final_amount, status, payment_method, created_by)
VALUES ('Rajesh', '98765-43210', 1000, 100, 900, 'pending', NULL, 2)
RETURNING id;
-- Returns: order_id = 42

-- Insert order items
INSERT INTO order_items (order_id, item_id, quantity, unit_price, line_total, location_packed)
VALUES
  (42, 1, 5.0, 40.0, 200.0, 1),
  (42, 2, 3.0, 40.0, 120.0, 1);

COMMIT;
```

### 4.2 Mark Order as Completed (+ Create Temp Stock Ledger)

```sql
BEGIN TRANSACTION;

-- Update order status
UPDATE orders
SET status = 'completed', completed_at = NOW()
WHERE id = 42;

-- Create temporary stock ledger records
INSERT INTO temp_stock_ledger (order_id, item_id, location_id, quantity_deducted, is_committed)
SELECT
  42,
  item_id,
  location_packed,
  quantity,
  false
FROM order_items
WHERE order_id = 42;

-- If payment is credit, update customer ledger
INSERT INTO customer_ledger (customer_phone, customer_name, order_id, amount_owed, amount_paid)
VALUES ('98765-43210', 'Rajesh', 42, 900, 0)
ON CONFLICT (customer_phone)
DO UPDATE SET amount_owed = customer_ledger.amount_owed + 900;

COMMIT;
```

### 4.3 End of Day (EOD) Commit

```sql
BEGIN TRANSACTION;

-- Step 1: Get all uncommitted deductions, grouped by item-location
WITH daily_deductions AS (
  SELECT
    item_id,
    location_id,
    SUM(quantity_deducted) as total_deducted
  FROM temp_stock_ledger
  WHERE is_committed = false
  GROUP BY item_id, location_id
)

-- Step 2: Update inventory
UPDATE inventory
SET quantity = quantity - daily_deductions.total_deducted,
    last_updated = NOW()
FROM daily_deductions
WHERE inventory.item_id = daily_deductions.item_id
  AND inventory.location_id = daily_deductions.location_id;

-- Step 3: Mark all temp ledger records as committed
UPDATE temp_stock_ledger
SET is_committed = true, committed_at = NOW()
WHERE is_committed = false;

-- Step 4: Lock today's daily ledger
UPDATE daily_ledger
SET is_locked = true
WHERE transaction_date = CURRENT_DATE;

COMMIT;
```

### 4.4 Calculate 7-Day Sales Velocity

```sql
SELECT
  i.id,
  i.name,
  ROUND(
    SUM(oi.quantity) / 7.0::numeric,
    2
  ) as velocity_7day
FROM items i
LEFT JOIN order_items oi ON i.id = oi.item_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= NOW() - INTERVAL '7 days'
  AND o.status = 'completed'
GROUP BY i.id, i.name
ORDER BY velocity_7day DESC;
```

### 4.5 Restock Alert: Items Below Threshold

```sql
WITH velocities AS (
  SELECT
    i.id,
    i.name,
    ROUND(SUM(oi.quantity) / 7.0::numeric, 2) as velocity_7day
  FROM items i
  LEFT JOIN order_items oi ON i.id = oi.item_id
  LEFT JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at >= NOW() - INTERVAL '7 days'
    AND o.status = 'completed'
  GROUP BY i.id, i.name
)

SELECT
  v.id,
  v.name,
  v.velocity_7day,
  COALESCE(SUM(inv.quantity), 0) as current_stock,
  (v.velocity_7day * 3) as alert_threshold
FROM velocities v
LEFT JOIN inventory inv ON v.id = inv.item_id
GROUP BY v.id, v.name, v.velocity_7day
HAVING COALESCE(SUM(inv.quantity), 0) < (v.velocity_7day * 3)
ORDER BY alert_threshold - COALESCE(SUM(inv.quantity), 0) DESC;
```

---

## 5. Drizzle ORM Implementation File

Complete TypeScript file for integration:

```typescript
// src/db/schema.ts

import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  pgEnum,
  date,
  unique,
  relations,
  sql,
} from "drizzle-orm/pg-core";

// ============ ENUMS ============
export const roleEnum = pgEnum("role", ["boss", "manager", "employee"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "completed",
  "partial",
  "delayed",
  "changed",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "credit",
  "mixed",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "leave",
  "half-day",
]);

// ============ TABLES ============

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull(),
  passcode: varchar("passcode", { length: 255 }).notNull(),
  macAddress: varchar("mac_address", { length: 50 }).unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  abbreviation: varchar("abbreviation", { length: 10 }).notNull(),
  description: varchar("description", { length: 200 }),
});

export const storageLocations = pgTable("storage_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 300 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
  unitId: integer("unit_id")
    .references(() => units.id)
    .notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 100 }),
  barcode: varchar("barcode", { length: 50 }).unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

export const inventory = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .references(() => items.id)
      .notNull(),
    locationId: integer("location_id")
      .references(() => storageLocations.id)
      .notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 3 })
      .notNull()
      .default("0"),
    lastUpdated: timestamp("last_updated").defaultNow(),
  },
  (table) => ({
    unq: unique().on(table.itemId, table.locationId),
  }),
);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentNote: varchar("payment_note", { length: 500 }),
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  notes: varchar("notes", { length: 500 }),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  isChecked: boolean("is_checked").default(false).notNull(),
  locationPacked: integer("location_packed").references(
    () => storageLocations.id,
  ),
});

export const temporaryStockLedger = pgTable("temp_stock_ledger", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => items.id)
    .notNull(),
  locationId: integer("location_id")
    .references(() => storageLocations.id)
    .notNull(),
  quantityDeducted: decimal("quantity_deducted", {
    precision: 10,
    scale: 3,
  }).notNull(),
  isCommitted: boolean("is_committed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  committedAt: timestamp("committed_at"),
});

export const customerLedger = pgTable("customer_ledger", {
  id: serial("id").primaryKey(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }),
  orderId: integer("order_id").references(() => orders.id),
  amountOwed: decimal("amount_owed", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  outstanding: decimal("outstanding", {
    precision: 10,
    scale: 2,
  }).generatedAlwaysAs(sql`amount_owed - amount_paid`),
  isSettled: boolean("is_settled").generatedAlwaysAs(
    sql`amount_owed <= amount_paid`,
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const dailyLedger = pgTable("daily_ledger", {
  id: serial("id").primaryKey(),
  transactionDate: date("transaction_date").notNull(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentBreakdown: varchar("payment_breakdown", { length: 500 }),
  recordedBy: integer("recorded_by")
    .references(() => users.id)
    .notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    attendanceDate: date("attendance_date").notNull(),
    checkInTime: timestamp("check_in_time"),
    checkOutTime: timestamp("check_out_time"),
    status: attendanceStatusEnum("status").notNull(),
    markedBy: integer("marked_by")
      .references(() => users.id)
      .notNull(),
    notes: varchar("notes", { length: 300 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.userId, table.attendanceDate),
  }),
);

// ============ RELATIONS ============
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  attendance: many(attendance),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  unit: one(units, { fields: [items.unitId], references: [units.id] }),
  inventory: many(inventory),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  orderItems: many(orderItems),
  tempLedger: many(temporaryStockLedger),
  customerLedger: many(customerLedger),
  dailyLedger: many(dailyLedger),
}));
```

---

## 6. Database Initialization Script

```bash
#!/bin/bash
# scripts/init-db.sh

set -e

echo "Creating PostgreSQL database..."
createdb vyapar_sync || echo "Database already exists"

echo "Running Drizzle migrations..."
npm run db:migrate

echo "Seeding initial data..."
psql vyapar_sync << EOF
-- Insert default storage locations
INSERT INTO storage_locations (name, description) VALUES
  ('Main Shop', 'Front counter and display shelves'),
  ('Warehouse 1', 'Separate building for overflow stock')
ON CONFLICT (name) DO NOTHING;

-- Insert default units
INSERT INTO units (name, abbreviation) VALUES
  ('Kilogram', 'kg'),
  ('Piece', 'pcs'),
  ('Liter', 'L'),
  ('Dozen', 'doz')
ON CONFLICT (name) DO NOTHING;

-- Insert test user (Boss)
INSERT INTO users (name, role, passcode) VALUES
  ('Vikram (Test)', 'boss', '\$2b\$10\$...')  -- bcrypt hash of "password"
ON CONFLICT DO NOTHING;
EOF

echo "✅ Database initialization complete"
```

---

## 7. Backup & Restore Scripts

```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/vyapar_sync_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Backing up database..."
pg_dump vyapar_sync > "$BACKUP_FILE"

echo "Encrypting backup..."
openssl enc -aes-256-cbc -in "$BACKUP_FILE" -out "$BACKUP_FILE.enc" -k "$(cat /etc/vyapar/backup-key)"

rm "$BACKUP_FILE"
echo "✅ Backup complete: $BACKUP_FILE.enc"
```
