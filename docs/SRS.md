# System Requirements Specification (SRS)

## Project Name: Local-First Shop Management System (Vyapar-Sync)

**Document Version:** 1.0  
**Date:** February 26, 2026  
**Target Audience:** Single-store Indian retail and wholesale businesses

---

## 1. Introduction

### 1.1 Purpose

This document specifies the complete functional and non-functional requirements for a secure, air-gapped Shop Management System designed for family-run retail and wholesale businesses in India. The system manages inventory, point-of-sale (POS) billing, order fulfillment, employee attendance, ledgers, and predictive stock metrics.

### 1.2 System Philosophy

The system operates on a strict **"Local-First, Zero-Cloud"** architecture where all data remains physically on the premises. This ensures:

- **Complete data sovereignty** - No external access or monitoring
- **Privacy protection** - Protection from corporate data harvesting and government agencies
- **Offline resilience** - Functions entirely without internet connectivity
- **Local control** - Owner maintains physical custody of all backups and configurations

### 1.3 Target Users

- **Primary:** Single-store owners (small family businesses with 1 shop + up to 2-3 warehouses)
- **Secondary:** Managers and employees who operate the system daily
- The system is explicitly NOT designed for multi-location chains requiring central coordination

---

## 2. System Environment & Constraints

### 2.1 Infrastructure

| Component                  | Specification                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| **Central Server**         | Local Mini-PC (Intel NUC, i3+8GB RAM) running Node.js + PostgreSQL + WireGuard VPN                  |
| **Network (In-Premises)**  | Dedicated local Wi-Fi router (802.11ac minimum) for Boss/in-shop devices                            |
| **Network (Remote Staff)** | WireGuard VPN tunnel over internet for employees at remote warehouses (5-10km away)                 |
| **Client Devices**         | Android phones/tablets (API 7.0+) or desktop browsers                                               |
| **Internet Dependency**    | Minimal — only for remote employee VPN connectivity. Core billing/EOD functions work fully offline. |
| **Data Location**          | Exclusively on-premises; no cloud sync, no remote servers                                           |

### 2.2 Key Constraints

- **Single-location focus:** System designed for one shop with optional local warehouses/godowns (no multi-store sync)
- **Primary network:** Local Wi-Fi LAN for in-premises devices; WireGuard VPN tunnel for remote employees up to 5-10km away
- **Remote employee support:** Employees/warehouse staff at separate locations connect to the shop's central server via a **self-hosted WireGuard VPN** - no third-party cloud required
- **Notification TTL:** All order notifications/messages are **automatically deleted from the employee's device within 7 days**
- **Manual backups:** Owner plugs USB drive and initiates backup manually; no automated cloud sync
- **No telemetry:** Zero external API calls, analytics, or crash reporting
- **Printer connectivity:** ESC/POS thermal printers via Bluetooth or local LAN only
- **Order creation:** Only Boss can create orders and define payment methods; Managers can only verify and close orders
- **Order history:** Full order history is visible to Boss only; Managers see only active/pending orders

---

## 3. Stakeholder & User Roles

### 3.1 User Roles & Permissions

#### Boss (Owner)

- **Access Level:** Complete administrative control
- **Key Responsibilities:**
  - Define items, units, and base prices
  - Override prices dynamically during bill creation
  - View business metrics and predictive restock recommendations
  - Initiate End-of-Day (EOD) reconciliation and permanent stock commits
  - Manage employee accounts and permissions
  - Execute and control manual data backups
  - Review financial ledgers and outstanding credit (Udhaar)

#### Manager

- **Access Level:** Order verification, fulfillment oversight, and stock visibility — no order creation or payment control
- **Key Responsibilities:**
  - **Verify and mark orders as "Completed"** (sole authority over order closure, along with Boss)
  - **Specify which employee fulfilled a given order** (fulfillment attribution per order)
  - Mark employee attendance
  - View current stock levels and storage location details
  - View only **active/pending orders** (not full historical order records)
  - Cannot create orders, apply discounts, or define payment methods
  - Cannot view profit metrics, revenue analytics, or business financial summaries
  - Cannot modify item configurations or base prices

#### Employee

- **Access Level:** Notification receipt and physical fulfillment checklist only
- **Key Responsibilities:**
  - Receive incoming order notifications **securely over VPN** (auto-deleted from device within 7 days)
  - View assigned order details and fulfillment checklist on their device
  - Check off items as they are physically gathered
  - View personal attendance records
  - **Cannot** mark orders as Completed or Verified
  - **Cannot** access pricing, payment information, financial data, or business metrics
  - **Cannot** view order history or other employees' fulfillment data

---

## 4. Core Functional Requirements

### 4.1 Inventory & Storage Management

#### 4.1.1 Item Master Database

- **Create Items:** Boss can add new items with the following attributes:
  - Item name
  - Default unit price (can be overridden at bill time)
  - Associated unit of measurement (kg, pieces, bags, dozen, etc.)
  - Status (active/inactive)

#### 4.1.2 Unit of Measurement

- Support custom, user-defined units:
  - Standard units: kg, gram, liter, piece, dozen, bag
  - Custom units: "Bundle", "Case", "Carton" (as needed by the business)
  - Each unit has an abbreviation for display on bills and reports

#### 4.1.3 Storage Locations (Warehouses)

- Define multiple physical storage locations:
  - Examples: "Main Shop Floor", "Warehouse 1", "Basement", "Stockroom"
  - Each location tracks inventory quantities independently
  - Stock can be transferred between locations (future enhancement)

#### 4.1.4 Permanent Inventory Tracking

- Central `inventory` table maintains the master stock levels per item per location
- Updated only during the EOD (End of Day) reconciliation process
- During business hours, transactions affect a temporary staging ledger only

---

### 4.2 Point of Sale (POS) & Billing System

#### 4.2.1 Bill Creation Workflow

1. **Customer Information Capture:**
   - Customer name (optional, for credit tracking)
   - Customer phone number (unique identifier for credit ledger)
   - Optional notes/references

2. **Item Selection:**
   - Search and add items to the cart
   - Specify quantity for each item
   - **Only Boss** can override the base price for any item in real-time
   - Example: Base price of Rice = ₹40/kg, but Boss applies ₹38/kg for a loyal customer

3. **Discount Application:**
   - Support for a single flat discount amount (not percentage-based)
   - Discount is applied to the final bill total before payment
   - Example: Total ₹1000, Discount ₹100 = Final ₹900

#### 4.2.2 Tax Exclusion

- **GST/Taxes:** Currently excluded from all calculations
- All bill totals are "raw" amounts without tax components
- Future scope for tax support, but not in current implementation

#### 4.2.3 Payment Mode Selection

When creating the order, **only the Boss** specifies the **payment method**. Managers cannot set or change the payment method:

| Payment Mode        | Behavior                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Cash**            | Amount recorded as immediate payment. Order moves to ledger.                                        |
| **UPI**             | Amount recorded as immediate payment (digital). Order moves to ledger.                              |
| **Credit (Udhaar)** | Amount recorded in `customer_ledger` as outstanding. Customer receives bill but payment is pending. |
| **Mixed**           | Combination of the above (e.g., ₹500 Cash + ₹500 Credit). Split is recorded accordingly.            |

#### 4.2.4 Bill Output

- **Digital Receipt:** Stored in database for future retrieval
- **Physical Receipt:** Printed instantly via connected thermal printer using ESC/POS protocol
- **Ledger Entry:** Completed orders (with payment method) are staged for EOD processing

---

### 4.3 Order Fulfillment & Status Management

#### 4.3.1 Order Status State Machine

**Standard Orders:**

```
┌─────────┐
│ PENDING │  (Bill created by Boss, employees notified)
└────┬────┘
     │
     ├──────────────────────────────────────┐
     │                                      │
     ↓                                      ↓
┌──────────────┐                  ┌───────────────────┐
│  COMPLETED   │◄─────────────────│ PARTIAL/DELAYED/  │
│  (Manager/   │   (Edge cases)    │ CHANGES MADE     │
│  Boss only)  │                  │ (Manager/Boss)    │
└──────────────┘                  └───────────────────┘
```

**Delivery Orders:**

```
┌─────────┐       ┌────────────┐       ┌──────────────┐
│ PENDING │──────►│ FULFILLING │──────►│  COMPLETED   │
│         │       │ (delivery  │       │ (Manager/    │
│         │       │  in transit)│      │  Boss only)  │
└─────────┘       └────────────┘       └──────────────┘
                       │
                       ▼
               ┌───────────────┐
               │ PARTIAL/      │
               │ DELAYED/      │
               │ CHANGES MADE  │
               └───────────────┘
```

**Status Definitions:**

- **Pending:** Order created by Boss. Employees notified to begin packing.
- **Fulfilling:** _(Delivery orders only)_ Items have been packed and are in transit to the customer. Set by Boss or Manager.
- **Completed:** All items verified delivered/given. **Only Manager or Boss** can mark this status.
- **Partial:** Not all items were fulfilled; only some items were given to customer.
- **Delayed:** Order is delayed; items not yet ready or dispatched.
- **Changes Made:** Customer or Boss requested modifications after order creation.

#### 4.3.2 Secure Notification Delivery

- When a Boss creates an order, **all connected employees receive a secure push notification**
- **Delivery Mechanism:** WireGuard VPN tunnel from employee devices to local server + Socket.io WebSocket
  - Employees at remote warehouses (5-10km away) connect to the shop's WireGuard VPN on their phone
  - Once VPN-connected, all Socket.io real-time events work exactly as on local Wi-Fi
  - No cloud service involved; all data travels through the encrypted VPN tunnel
- **Notification Content:** Order ID, customer name (if provided), list of items and quantities
- **Auto-Deletion:** All notification messages are **automatically purged from the device and server** after **7 days**
  - Notifications older than 7 days are deleted by a scheduled cleanup job on the local server
  - Employees cannot retrieve notifications older than 7 days
- **Notification opens a checklist interface** showing:
  - Item name, quantity required
  - Checkbox for each item
  - Storage location(s) where item is found
- Employees check off items as they physically pack them
- Employees **cannot** mark the order as complete; they can only update checklist items

#### 4.3.3 Order Verification & Completion (Manager Only)

- **Who Can Mark Complete:** Only **Manager** or **Boss** (employees explicitly excluded)
- **Trigger:** Manager reviews that physical packing is done (either by observing or checking checklist)
- **Pre-Completion Step:** Manager **must specify which employee(s) fulfilled this order** (fulfillment attribution)
  - A dropdown/selector on the completion screen lists active employees
  - Manager selects 1 or more employees who physically packed the order
  - This is recorded permanently in the `order_fulfillments` table
- **Action on Complete:**
  1. Order status changes to "Completed"
  2. Fulfillment attribution is recorded (which employee packed it)
  3. Order is logged into the `Temporary_Stock_Ledger` for EOD processing
  4. Physical receipt is printed (if printer connected)

#### 4.3.4 Delivery Orders

- **Who Can Create Delivery Orders:** Boss only (same as all orders)
- **How to Specify:** When creating the order, Boss toggles **"Delivery Order"** flag
- **Delivery Assignee:** Boss assigns **which employee** will perform the delivery
  - Selected employee receives a special delivery notification via VPN
  - Notification includes: customer name, contact, address/notes, item list
- **Delivery Status Flow:**
  - Boss/Manager marks status as **"Fulfilling"** once items are packed and employee departs
  - Once delivery is confirmed (employee reports back), Manager/Boss marks as **"Completed"**
- **Delivery Recipient:** Customer's name and contact are mandatory for delivery orders (required field)
- **Receipt for Delivery:** Physical receipt is printed before dispatch and sent with the delivery

#### 4.3.5 Fulfillment Attribution

- Every completed order must have at least one employee attributed as the fulfiller
- Stored in `order_fulfillments` table: `order_id`, `employee_id`, `role` (packer/delivery)
- Boss can view fulfillment attribution in order details
- Manager can see attribution for orders they verified
- Used for internal accountability tracking (not a payroll feature)

---

### 4.4 End of Day (EOD) Reconciliation & Permanent Stock Updates

#### 4.4.1 The Two-Ledger System

**During Business Hours:**

- Completed orders do NOT immediately deduct from the main `inventory` table
- Instead, they are logged in `Temporary_Stock_Ledger` (staging area)
- This prevents database locks during high-traffic periods and allows for easy corrections

**At End of Day:**

- Boss reviews the `Temporary_Stock_Ledger` — a clean list of all completed orders from the day
- Boss verifies the total stock deductions match physical count (if needed)
- Boss clicks "Commit EOD" button

**On Commit:**

- System reads all uncommitted records in `Temporary_Stock_Ledger`
- For each item-location pair, calculates total daily deduction
- Updates the permanent `inventory` table (e.g., reduce Rice in Main Shop by 50kg)
- Marks all temporary ledger records as committed
- Locks the daily financial ledger (no further edits allowed for that day)

#### 4.4.2 Workflow Example

**Day Operations:**

```
Order 1: 5kg Rice from Main Shop → logged to temp ledger
Order 2: 3kg Rice from Main Shop → logged to temp ledger
Order 3: 2kg Rice from Warehouse 1 → logged to temp ledger
```

**At 9:00 PM (EOD):**

- Boss reviews: "Today, 8kg Rice from Main Shop and 2kg from Warehouse 1 were sold"
- Boss clicks "Commit EOD"
- System updates:
  - `inventory`: Main Shop Rice: 250kg → 242kg
  - `inventory`: Warehouse 1 Rice: 100kg → 98kg
- All temp ledger records marked as committed

#### 4.4.3 Error Handling & Post-Commit Corrections

- If an order was created by mistake and needs to be cancelled, this should happen **before EOD commit** (simplest path)
- Cancelled orders are removed from the temp ledger before commit; they don't affect permanent inventory

**Post-Commit Corrections (Ledger Amendment):**

- After EOD commit, the daily ledger is marked as "locked" as a default state — but **corrections are permitted** by the Boss
- Boss can navigate to the **Ledger/History** area and make amendments to past records
- Every amendment creates a **correction entry** (audit log) that records:
  - Which record was changed
  - The original value
  - The new (corrected) value
  - Date and time of correction
  - Boss's user ID (who made the correction)
- **The original entry is never deleted** — only marked as superseded by the correction
- Managers can view that a correction was made, but cannot make corrections themselves
- This ensures transparency while allowing recovery from genuine human errors

---

### 4.5 Ledgers & Credit Management (Udhaar)

#### 4.5.1 Customer Ledger (Udhaar Tracking)

- **Purpose:** Track customer credit balances and payment history
- **Triggered By:** Orders marked with "Credit" payment mode
- **Key Attributes:**
  - Customer Name
  - Customer Phone Number (primary key for identifying repeat customers)
  - Order ID (linked to the specific order)
  - Amount Owed
  - Amount Paid (tracks partial settlements)
  - Outstanding Balance (calculated as Owed - Paid)

#### 4.5.2 Usage Example

```
Customer: Rajesh Kumar | Phone: 98765-43210
Order 1 (Feb 20): ₹1000 Credit → Outstanding: ₹1000
Order 2 (Feb 22): ₹500 Credit → Outstanding: ₹1500
Payment (Feb 25): ₹600 received → Outstanding: ₹900
Order 3 (Feb 27): ₹200 Credit → Outstanding: ₹1100
```

#### 4.5.3 Daily Transaction Ledger

- All completed orders (regardless of payment method) are recorded in a daily ledger
- Ledger entries include:
  - Order ID, Date, Customer Name, Items, Total Amount, Discount
  - Payment Method breakdown (Cash, UPI, Credit)
  - Boss who created the order
  - Manager who verified/completed the order
  - Employee(s) who fulfilled the order (fulfillment attribution)
- **Ledger Access:** Full history is visible to **Boss only**; Managers see only active/pending orders
- **Ledger Corrections:** Boss can amend any past ledger entry at any time
  - All amendments are recorded in an audit log (original value preserved)
  - Amended records are visually flagged as "Corrected" with a correction timestamp
  - Corrections are never silent — always traceable

---

### 4.6 Predictive Analytics & Business Metrics

#### 4.6.1 Sales Velocity Calculation

The system calculates the average daily sales for each item across different time windows:

- **7-day velocity:** Average units sold per day over last 7 days
- **14-day velocity:** Average units sold per day over last 14 days
- **30-day velocity:** Average units sold per day over last 30 days

**Example:**

- Rice sold in last 7 days: 350kg ÷ 7 days = 50kg/day (7-day velocity)
- Rice sold in last 30 days: 1500kg ÷ 30 days = 50kg/day (30-day velocity)

#### 4.6.2 Smart "Recommended to Buy" Dashboard

The Boss's dashboard displays a **Restock Alert List** based on this logic:

```
IF (Current Stock in Shop < 7-day Velocity × 3) THEN
    ADD to "Recommended to Buy" List
```

**Example:**

- Rice 7-day velocity: 50kg/day
- Current Main Shop stock: 100kg
- Alert Threshold: 50kg × 3 = 150kg
- **Decision:** 100kg < 150kg → "BUY MORE RICE"

This prevents under-stocking during high-demand periods and over-investing in slow-moving items.

#### 4.6.3 Other Metrics Available to Boss

- **Daily/Weekly Sales Summary:** Total revenue, item-wise breakdown
- **Top-Moving Items:** Ranked by units sold
- **Slow-Moving Items:** Candidate for discounting or removal
- **Payment Method Breakdown:** % of sales via Cash, UPI, Credit
- **Outstanding Credit Report:** Total Udhaar outstanding, by customer
- **Inventory Valuation:** Current stock value based on cost price (if tracked)

---

### 4.7 Hardware Integrations

#### 4.7.1 Thermal Receipt Printer Integration

- **Protocol:** ESC/POS (thermal printer standard)
- **Connectivity:** Bluetooth or LAN (local network)
- **Trigger:** When order is marked "Completed," a physical receipt is automatically printed
- **Details on Receipt:**
  - Shop name, address (configured by owner)
  - Order ID, Date/Time
  - Customer name (if provided)
  - Itemized list: Item name, quantity, unit price, line total
  - Subtotal, discount, final amount
  - Payment method
  - Thank you message

#### 4.7.2 Capacitor.js Integration

- React app is wrapped in Capacitor.js to run natively on Android
- Capacitor provides bridge access to device hardware:
  - Bluetooth API (for printer communication)
  - File system (for local backup storage)
  - Device info (for MAC address whitelisting)

---

### 4.8 Employee Attendance System

#### 4.8.1 Basic Check-In/Check-Out

- **Who Can Mark:** Managers (typically)
- **Interface:** Simple toggle button for each employee on a daily attendance page
- **Recording:** Check-in time, Check-out time, Date
- **Storage:** `attendance` table linked to user_id

#### 4.8.2 Attendance Reporting

- Daily attendance view for Boss
- Monthly attendance summary per employee
- Optional: Leaves, half-days (future enhancement)

---

## 5. Non-Functional Requirements

### 5.1 Security & Data Privacy

#### 5.1.1 Air-Gapped Privacy

- **Zero External Connectivity:** No APIs calls to cloud services, no telemetry, no analytics
- **No Third-Party SDKs:** Only open-source or custom implementations
- **Device Whitelisting:** Client apps must authenticate their MAC address with the local server
  - First-time device must be manually approved by the Boss
  - Subsequent connections auto-authenticate if MAC is approved
- **API Authentication:** Passcode-based login stored as bcrypt hashes locally

#### 5.1.2 Data Encryption

- **In-Transit:** All local network communication via HTTPS (self-signed certificate on local server)
- **At-Rest:** Sensitive fields (passcodes) hashed with bcrypt; other data stored plaintext (as per owner's comfort)
- **Backup Encryption:** `.sql` database dumps are encrypted with AES-256 before being written to USB

#### 5.1.3 No Government/Corporate Access

- System includes explicit configuration to reject any external telemetry requests
- Backups are encrypted and physically controlled by the owner
- No cloud storage, no automatic uploads, no third-party visibility

#### 5.1.4 Secure Remote Notification System (WireGuard VPN)

Since employees and warehouse staff may be located **5-10km away from the main shop**, the local-only Socket.io approach is extended with a **self-hosted VPN layer**:

**Technology:**

- **WireGuard VPN** server runs on the same local Mini-PC as the Node.js backend
- Each employee device (Android) has the WireGuard VPN client installed
- Boss registers each device's WireGuard public key during onboarding (one-time setup)
- All device-to-server communication is end-to-end encrypted by WireGuard (ChaCha20 + Poly1305)

**How it Works:**

- Employee opens WireGuard VPN on their phone → connects to shop's VPN
- Phone now appears as if it's on the local network (assigned a private VPN IP)
- Socket.io notification pushes work identically to in-premises devices
- No third-party VPN provider; VPN server is physically owned by Boss
- **Internet IS required** only for the VPN tunnel (minimal data usage, ~1-5MB/day per employee)

**Message Auto-Deletion:**

- All notification records older than **7 days** are automatically purged:
  - From the server's `notifications` table (CRON job at 2:00 AM daily)
  - The mobile app checks message TTL and removes expired notifications on launch
- Employees cannot retrieve or scroll back to notifications older than 7 days
- This limits the window of exposure if a device is lost or compromised

**Security Properties:**

- No message passes through any third-party server
- VPN keys are generated locally and never leave the premises (except on the employee's physical device)
- Even if internet traffic is intercepted, WireGuard's encryption is cryptographically secure
- Revoke access instantly by removing the employee's WireGuard key from the server (Boss action)

### 5.2 Data Backup & Recovery

#### 5.2.1 Manual Backup Strategy

- **Trigger:** Manual action by Boss via "Backup Now" button on dashboard
- **Process:**
  1. Boss plugs in USB drive to the local server
  2. Boss clicks "Backup Data" button in the app
  3. System executes `pg_dump` to export the entire PostgreSQL database
  4. Export file is encrypted with AES-256
  5. File is saved to USB drive with timestamp: `backup_2026-02-26_21-30.sql.enc`
- **Frequency:** Recommended daily after EOD; at least weekly
- **Custody:** Boss maintains physical control over all USB backups

#### 5.2.2 Hardware Redundancy

- **RAID 1 Configuration:** Two identical SSDs or HDDs in the local server configured as RAID 1 (mirroring)
- **Benefit:** If one drive fails, the other maintains a complete copy with zero data loss
- **Setup:** Configured during initial server setup (one-time cost ~₹5000)

#### 5.2.3 Recovery Procedure

- If data corruption occurs, Boss retrieves the encrypted backup from USB
- Restore process: `pg_restore` executed on fresh PostgreSQL instance
- Time to recovery: ~5-10 minutes (depending on database size)

### 5.3 Performance & Scalability

#### 5.3.1 Concurrency & Load Capacity

| Metric                  | Specification                                       |
| ----------------------- | --------------------------------------------------- |
| **Concurrent Users**    | Up to 50 simultaneous connections on local network  |
| **Daily Transactions**  | 500-2000 orders per day (typical small shop)        |
| **Query Response Time** | <200ms (on local network, no internet latency)      |
| **Database Size**       | ~5-10GB after 3 years of operations (single shop)   |
| **Server Hardware**     | Intel i3 with 8GB RAM (sufficient for 99% of cases) |

#### 5.3.2 Scalability Limits

- **Single-Location:** Designed for ONE physical shop + warehouses
- **Multi-Location:** NOT supported. Each shop location requires its own independent server
- **Future Multi-Location:** Requires manual setup of secure VPN between branches (not provided)

#### 5.3.3 Database Optimization

- Indexes on frequently queried columns: `orders.created_at`, `orders.status`, `customer_ledger.customer_phone`
- Query optimization for aggregations (velocity calculations) using materialized views (future)
- Connection pooling via pgBouncer to limit open PostgreSQL connections

### 5.4 Availability & Reliability

#### 5.4.1 Offline Resilience

- If internet goes down: **No impact** - system continues to operate normally
- If local Wi-Fi router fails: Devices can be directly connected via USB to the server (for short-term operations)
- If server goes down: All pending orders are lost; completed orders are safe (in backup)

#### 5.4.2 Disaster Recovery Plan

1. **Server Hardware Failure:** Boot from RAID 1 mirror or restore from USB backup
2. **Data Corruption:** Restore from latest USB backup
3. **User Error (Accidental Deletion):** Recover from daily/weekly backups
4. **Network Failure:** System continues to function; just resync when network comes back

#### 5.4.3 System Monitoring

- No remote monitoring (as per privacy requirement)
- Boss can manually check server health via local dashboard
- Optional: Email alerts to Boss when critical events occur (delivered via local mail, no external calls)

---

## 6. System Constraints & Assumptions

### 6.1 Infrastructure Assumptions

- Dedicated Wi-Fi router with consistent local network connectivity
- Stable power supply to the local server (UPS backup recommended)
- At least one connected thermal printer (optional, but recommended for billing)
- Employee devices are Android 7.0+ with at least 2GB RAM

### 6.2 Operational Assumptions

- Boss or Manager performs EOD reconciliation every business day
- Manual backups are created at least weekly
- Server is kept in a secure, climate-controlled room
- No untrusted Wi-Fi clients are allowed to connect to the shop's router

### 6.3 Limitation Scope

- Multi-shop coordination is OUT of scope
- Real-time inventory sync across shops requires manual setup of VPN (not provided)
- Advanced tax calculations (GST, TDS) are OUT of scope
- Mobile app development for iOS is OUT of scope (Android only)

---

## 7. Success Criteria

The system is considered **successfully implemented** when:

1. ✅ Boss can create orders with custom pricing and discounts in <10 seconds
2. ✅ Employees receive order notifications in <2 seconds (on LAN) or <5 seconds (via WireGuard VPN)
3. ✅ Managers (not employees) are the sole verifiers of order completion
4. ✅ Every completed order records which employee fulfilled it
5. ✅ Delivery orders support "Fulfilling" status with assigned delivery person
6. ✅ Notifications are auto-deleted from device and server after 7 days
7. ✅ All stock adjustments occur only after EOD commit; no mid-day lock-ups
8. ✅ Boss can make post-commit ledger corrections with full audit trail
9. ✅ Backups can be created manually and restored within 5 minutes
10. ✅ All data remains on-premises; WireGuard VPN has zero third-party cloud involvement
11. ✅ System supports up to 50 concurrent users without lag
12. ✅ Physical receipt is printed within 2 seconds of order completion
13. ✅ "Recommended to Buy" alerts are calculated accurately based on 7-day velocity

---

## 8. Out of Scope (Future Enhancements)

- Multi-location shop management
- Cloud sync and central server
- Advanced tax calculations (GST, TDS, etc.)
- iOS mobile app
- Supplier management and PO generation
- HR module (payroll, leave management)
- Real-time inventory transfer between locations

---

## Appendix: Glossary

| Term                        | Definition                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **EOD**                     | End of Day reconciliation; process of committing temporary ledger to permanent inventory |
| **Udhaar**                  | Indian term for credit; buy now, pay later arrangement                                   |
| **ESC/POS**                 | Command protocol for thermal receipt printers                                            |
| **MAC Address**             | Hardware identifier for network device authentication                                    |
| **Capacitor.js**            | Framework to wrap web apps as native mobile applications                                 |
| **RAID 1**                  | Data mirroring; two identical drives maintain the same data                              |
| **pg_dump**                 | PostgreSQL utility to export database as SQL file                                        |
| **WireGuard VPN**           | Modern, fast, self-hosted VPN protocol for secure encrypted tunneling                    |
| **Notification TTL**        | Time-To-Live; maximum age before a notification is automatically deleted                 |
| **Fulfillment Attribution** | Recording which employee physically packed/delivered a specific order                    |
| **Delivery Order**          | An order flagged by Boss to be physically delivered to the customer's location           |
| **Audit Log**               | Immutable record of who changed what and when; used for ledger corrections               |
